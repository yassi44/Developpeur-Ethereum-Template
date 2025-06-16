import { useState, useEffect } from 'react';
import { EthereumService } from './ethereum';
import { WorkflowStatus } from './contract';

export function useVotingContract() {
  const [contract, setContract] = useState<any>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ethereum = EthereumService.getInstance();
    if (ethereum.signer) {
      ethereum.getContract().then(setContract);
    }
  }, []);

  // Fonction pour récupérer l'état actuel du workflow
  const refreshWorkflowStatus = async () => {
    if (contract) {
      const status = await contract.workflowStatus();
      setWorkflowStatus(status);
    }
  };

  return {
    contract,
    workflowStatus,
    loading,
    setLoading,
    refreshWorkflowStatus
  };
}