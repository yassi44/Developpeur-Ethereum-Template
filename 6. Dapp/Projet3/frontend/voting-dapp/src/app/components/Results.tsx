'use client';
import { useState, useEffect } from 'react';
import { EthereumService } from '../lib/ethereum';

export default function Results() {
  const [contract, setContract] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState(0);
  const [winningProposalId, setWinningProposalId] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    initContract();
  }, []);

  const initContract = async () => {
    try {
      const ethereum = EthereumService.getInstance();
      if (!ethereum.account) {
        await ethereum.connectWallet();
      }
      
      const contractInstance = await ethereum.getContract();
      setContract(contractInstance);
      
      await loadResults(contractInstance);
    } catch (error) {
      console.error('Erreur d\'initialisation');
    }
  };

  const loadResults = async (contractInstance?: any) => {
    const contractToUse = contractInstance || contract;
    if (!contractToUse) return;

    try {
      const status = await contractToUse.workflowStatus();
      setWorkflowStatus(Number(status));

      const proposalsList = [];
      let index = 0;
      let total = 0;
      
      while (index < 50) {
        try {
          const proposal = await contractToUse.getOneProposal(index);
          proposalsList.push(proposal);
          total += Number(proposal.voteCount || 0);
          index++;
        } catch (error) {
          break;
        }
      }
      
      setProposals(proposalsList);
      setTotalVotes(total);

      if (Number(status) === 5) {
        try {
          const winnerId = await contractToUse.winningProposalID();
          setWinningProposalId(Number(winnerId));
        } catch (error) {
          console.error('Erreur lors de la récupération du gagnant');
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement des résultats');
    }
  };

  const getStatusText = () => {
    const texts = [
      'Enregistrement des électeurs', 
      'Soumission des propositions', 
      'Fin des propositions', 
      'Session de vote active', 
      'Vote terminé', 
      'Résultats finaux'
    ];
    return texts[workflowStatus] || 'Statut inconnu';
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  if (!contract) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-8 mt-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Résultats du Vote</h2>
        <button 
          onClick={initContract} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
        >
          Charger les résultats
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 mt-8 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Résultats du Vote</h2>
        <div className="flex gap-3">
          <span className="px-4 py-2 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
            {getStatusText()}
          </span>
          <button 
            onClick={() => loadResults()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            ↻ Actualiser
          </button>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg mb-6">Aucune proposition disponible</p>
          <button 
            onClick={() => loadResults()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Recharger
          </button>
        </div>
      ) : (
        <>
          {workflowStatus >= 4 && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-600">
                Participation totale: <span className="font-bold text-slate-800 text-lg">{totalVotes}</span> votes
              </div>
            </div>
          )}

          <div className="space-y-6">
            {proposals.map((proposal, index) => {
              const isWinner = winningProposalId === index && workflowStatus === 5;
              const votes = Number(proposal.voteCount || 0);
              const percentage = getPercentage(votes);
              
              return (
                <div
                  key={index}
                  className={`border-2 rounded-xl p-6 transition-all duration-200 ${
                    isWinner 
                      ? 'border-emerald-300 bg-emerald-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-2 ${
                        isWinner ? 'text-emerald-800' : 'text-gray-800'
                      }`}>
                        {isWinner && <span className="mr-2">🏆</span>}
                        Proposition #{index}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{proposal.description}</p>
                    </div>
                  </div>

                  {workflowStatus >= 4 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-medium text-gray-700">
                          {votes} vote{votes !== 1 ? 's' : ''}
                        </span>
                        <span className="font-bold text-gray-800">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            isWinner 
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                              : 'bg-gradient-to-r from-indigo-400 to-indigo-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {winningProposalId !== null && workflowStatus === 5 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🎉</span>
                <h3 className="text-xl font-bold text-emerald-800">Proposition Gagnante</h3>
              </div>
              <p className="text-emerald-700 text-lg">
                <span className="font-semibold">"{proposals[winningProposalId]?.description}"</span>
                <br />
                <span className="text-sm">
                  Victoire avec {proposals[winningProposalId]?.voteCount?.toString()} votes
                </span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}