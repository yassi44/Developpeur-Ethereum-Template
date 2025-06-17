"use client";
import { useState, useEffect } from "react";
import { EthereumService } from "../lib/ethereum";

export default function VoterPanel() {
  const [contract, setContract] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(0);
  const [proposals, setProposals] = useState<any[]>([]);
  const [newProposal, setNewProposal] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initContract();
  }, []);

  const initContract = async () => {
    try {
      const ethereum = EthereumService.getInstance();
      if (!ethereum.account) return;

      const contractInstance = await ethereum.getContract();
      setContract(contractInstance);

      await refreshAll(contractInstance);
    } catch (error) {
      console.error("Erreur d'initialisation");
    }
  };

  const refreshAll = async (contractInstance?: any) => {
    const contractToUse = contractInstance || contract;
    if (!contractToUse) return;

    try {
      const status = await contractToUse.workflowStatus();
      setWorkflowStatus(Number(status));

      await checkVoterStatus(contractToUse);
      await loadProposals(contractToUse);
    } catch (error) {
      console.error("Erreur de rafraîchissement");
    }
  };

  const checkVoterStatus = async (contractInstance: any) => {
    try {
      const ethereum = EthereumService.getInstance();
      const voter = await contractInstance.getVoter(ethereum.account);
      setIsRegistered(voter.isRegistered);
      setHasVoted(voter.hasVoted);
    } catch (error) {
      setIsRegistered(false);
    }
  };

  const loadProposals = async (contractInstance: any) => {
    try {
      const proposalsList = [];
      let index = 0;

      while (index < 50) {
        try {
          const proposal = await contractInstance.getOneProposal(index);
          proposalsList.push(proposal);
          index++;
        } catch {
          break;
        }
      }

      setProposals(proposalsList);
    } catch (error) {
      console.error("Erreur lors du chargement des propositions");
    }
  };

  const addProposal = async () => {
    if (!contract || !newProposal.trim()) return;

    setLoading(true);
    try {
      const tx = await contract.addProposal(newProposal.trim());
      await tx.wait();
      setNewProposal("");
      await refreshAll();
      alert("Proposition ajoutée avec succès !");
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
    setLoading(false);
  };

  const vote = async (proposalId: number) => {
    if (!contract) return;

    setLoading(true);
    try {
      const tx = await contract.setVote(proposalId);
      await tx.wait();
      await refreshAll();
      alert("Vote enregistré avec succès !");
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
    setLoading(false);
  };

  if (!contract) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Espace Électeur
        </h2>
        <button
          onClick={initContract}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
        >
          Se connecter
        </button>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-amber-800 mb-4">
          Espace Électeur
        </h2>
        <div className="flex items-center mb-4">
          <svg
            className="w-6 h-6 text-amber-600 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-amber-700 font-medium">
            Vous n'êtes pas inscrit pour voter
          </p>
        </div>
        <p className="text-amber-600 text-sm mb-4">
          Contactez l'administrateur pour être ajouté à la liste des électeurs.
        </p>
        <button
          onClick={() => refreshAll()}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors duration-200"
        >
          ↻ Vérifier à nouveau
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Espace Électeur</h2>
        <button
          onClick={() => refreshAll()}
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-3 py-1 rounded-md text-sm transition-colors duration-200"
        >
          ↻
        </button>
      </div>

      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-emerald-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-emerald-800 font-medium">Électeur inscrit</span>
        </div>
        {hasVoted && (
          <div className="flex items-center mt-2">
            <svg
              className="w-5 h-5 text-blue-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-blue-800 font-medium">Vote effectué</span>
          </div>
        )}
      </div>

      {workflowStatus === 1 && (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
          <h3 className="text-lg font-bold text-blue-800 mb-4">
            📝 Soumettre une proposition
          </h3>
          <div className="space-y-4">
            <textarea
              placeholder="Décrivez votre proposition en détail..."
              value={newProposal}
              onChange={(e) => setNewProposal(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 resize-none"
              rows={4}
            />
            <button
              onClick={addProposal}
              disabled={loading || !newProposal.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
            >
              {loading ? "Envoi en cours..." : "Soumettre ma proposition"}
            </button>
          </div>
        </div>
      )}

      {workflowStatus === 3 && !hasVoted && proposals.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
          <h3 className="text-lg font-bold text-green-800 mb-4">
            🗳️ Session de vote active
          </h3>
          <p className="text-green-700 mb-4">
            Choisissez la proposition pour laquelle vous souhaitez voter :
          </p>
          <div className="space-y-4">
            {proposals.map((proposal, index) => (
              <div
                key={index}
                className="bg-white border-2 border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors duration-200"
              >
                <div className="mb-3">
                  <h4 className="font-bold text-gray-800 mb-1">
                    Proposition #{index}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {proposal.description}
                  </p>
                </div>
                <button
                  onClick={() => vote(index)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-3 rounded-lg transition-colors duration-200"
                >
                  {loading
                    ? "Vote en cours..."
                    : "✓ Voter pour cette proposition"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {workflowStatus === 3 && hasVoted && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-blue-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-blue-800 font-medium">
              Votre vote a été enregistré avec succès
            </p>
          </div>
        </div>
      )}

      {workflowStatus === 3 && !hasVoted && proposals.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-yellow-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-yellow-800">
              Aucune proposition disponible pour le vote
            </p>
          </div>
        </div>
      )}

      {proposals.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Propositions soumises ({proposals.length})
          </h3>
          <div className="space-y-3">
            {proposals.map((proposal, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4"
              >
                <h4 className="font-bold text-gray-800 text-sm mb-2">
                  Proposition #{index}
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {proposal.description}
                </p>
                {workflowStatus >= 4 && (
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">
                      Votes reçus: {proposal.voteCount?.toString() || "0"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <svg
              className="animate-spin h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-700 font-medium">
              Transaction en cours...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
