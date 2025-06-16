'use client';
import { useState, useEffect } from 'react';
import { EthereumService } from '../lib/ethereum';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

export default function AdminPanel() {
  const [contract, setContract] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newVoterAddress, setNewVoterAddress] = useState('');

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
      
      const owner = await contractInstance.owner();
      setIsOwner(owner.toLowerCase() === ethereum.account?.toLowerCase());
      
      const status = await contractInstance.workflowStatus();
      setWorkflowStatus(Number(status));
      
    } catch (error) {
      console.error('Erreur d\'initialisation');
    }
  };

  const addVoter = async () => {
    if (!contract || !newVoterAddress) return;
    setLoading(true);
    try {
      const tx = await contract.addVoter(newVoterAddress);
      await tx.wait();
      setNewVoterAddress('');
      alert('Électeur ajouté avec succès !');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const startProposalsRegistering = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.startProposalsRegistering();
      await tx.wait();
      setWorkflowStatus(1);
      alert('Phase de soumission des propositions démarrée !');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const endProposalsRegistering = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.endProposalsRegistering();
      await tx.wait();
      setWorkflowStatus(2);
      alert('Phase de soumission des propositions terminée !');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const startVotingSession = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.startVotingSession();
      await tx.wait();
      setWorkflowStatus(3);
      alert('Session de vote ouverte !');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const endVotingSession = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.endVotingSession();
      await tx.wait();
      setWorkflowStatus(4);
      alert('Session de vote fermée !');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const tallyVotes = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.tallyVotes();
      await tx.wait();
      setWorkflowStatus(5);
      alert('Dépouillement terminé !');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
    setLoading(false);
  };

  const getStatusInfo = () => {
    const statusData = [
      { 
        name: 'Inscription des électeurs', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '👥'
      },
      { 
        name: 'Soumission des propositions', 
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '📝'
      },
      { 
        name: 'Fin des propositions', 
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '⏸️'
      },
      { 
        name: 'Session de vote active', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🗳️'
      },
      { 
        name: 'Vote terminé', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '🔒'
      },
      { 
        name: 'Résultats publiés', 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: '🏆'
      }
    ];
    return statusData[workflowStatus] || { 
      name: 'Statut inconnu', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '❓'
    };
  };

  if (!contract) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Panneau Administrateur</h2>
        <button 
          onClick={initContract} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
        >
          Se connecter au contrat
        </button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-red-800 mb-4">Panneau Administrateur</h2>
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-700 font-medium">Accès restreint aux administrateurs</p>
        </div>
        <p className="text-red-600 text-sm mt-2">
          Vous devez être propriétaire du contrat pour accéder à ce panneau.
        </p>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Panneau Administrateur</h2>
      
      <div className="mb-8">
        <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-medium ${statusInfo.color}`}>
          <span className="mr-2 text-lg">{statusInfo.icon}</span>
          {statusInfo.name}
        </div>
      </div>

      {workflowStatus === 0 && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
            <h3 className="text-lg font-bold text-blue-800 mb-4">👥 Inscription des électeurs</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de l'électeur
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newVoterAddress}
                  onChange={(e) => setNewVoterAddress(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 font-mono text-sm"
                />
              </div>
              <button
                onClick={addVoter}
                disabled={loading || !newVoterAddress}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Ajout en cours...' : 'Ajouter à la liste électorale'}
              </button>
            </div>
          </div>
          
          <button
            onClick={startProposalsRegistering}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-lg transition-all duration-200 shadow-lg"
          >
            {loading ? 'Démarrage...' : '📝 Ouvrir la phase de propositions'}
          </button>
        </div>
      )}

      {workflowStatus === 1 && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-purple-800">
              <span className="font-medium">Phase active :</span> Les électeurs peuvent maintenant soumettre leurs propositions.
            </p>
          </div>
          <button
            onClick={endProposalsRegistering}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-lg transition-all duration-200 shadow-lg"
          >
            {loading ? 'Fermeture...' : '⏸️ Clôturer les propositions'}
          </button>
        </div>
      )}

      {workflowStatus === 2 && (
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-800">
              <span className="font-medium">Étape suivante :</span> Prêt à ouvrir la session de vote.
            </p>
          </div>
          <button
            onClick={startVotingSession}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-lg transition-all duration-200 shadow-lg"
          >
            {loading ? 'Ouverture...' : '🗳️ Ouvrir la session de vote'}
          </button>
        </div>
      )}

      {workflowStatus === 3 && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              <span className="font-medium">Vote en cours :</span> Les électeurs peuvent maintenant voter pour leurs propositions préférées.
            </p>
          </div>
          <button
            onClick={endVotingSession}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-lg transition-all duration-200 shadow-lg"
          >
            {loading ? 'Fermeture...' : '🔒 Clôturer le vote'}
          </button>
        </div>
      )}

      {workflowStatus === 4 && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              <span className="font-medium">Vote fermé :</span> Prêt pour le dépouillement des résultats.
            </p>
          </div>
          <button
            onClick={tallyVotes}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-lg transition-all duration-200 shadow-lg"
          >
            {loading ? 'Dépouillement...' : '🏆 Dépouiller les votes'}
          </button>
        </div>
      )}

      {workflowStatus === 5 && (
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Processus électoral terminé</h3>
          <p className="text-emerald-700">
            Le dépouillement est terminé et les résultats sont disponibles publiquement.
          </p>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700 font-medium">Transaction en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}