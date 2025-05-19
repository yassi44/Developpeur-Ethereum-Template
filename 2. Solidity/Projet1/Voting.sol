// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.30;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";


contract Voting is Ownable {

    address admin;
    mapping(address => bool) public whiteList;
    uint winningProposalId;
    WorkflowStatus workflowStatus;
    Proposal[] public proposals;
    mapping(address => Voter) public voters;


    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);
    event WhiteListed( address _addr);

    struct Voter { 
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }
    
    struct Proposal {
         string description;
          uint voteCount; 
    }

    enum WorkflowStatus { 
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied 
    }


    constructor() Ownable(msg.sender){  }

    modifier actionAllowed(WorkflowStatus _status) {
        require(workflowStatus == _status, "Action not allowed at this stage !");
        _;
    }

    modifier onlyWhitelisted() {
        require(whiteList[msg.sender], "You are not whitelisted");
        _;
    }

    function isWhitelisted(address _addr) public view onlyOwner returns (bool) {
        return whiteList[_addr];
    }

    function addToWhitelist(address[] memory _newAddrs) public onlyOwner actionAllowed(WorkflowStatus.RegisteringVoters){
        for (uint i = 0; i < _newAddrs.length; i++) {
            address addr = _newAddrs[i];
            if (!whiteList[addr]) {
                whiteList[addr] = true;
                voters[addr] = Voter(true, false, 0);
                emit WhiteListed(addr);
                emit VoterRegistered(addr);
            }
        }
    }

    /* Fonctions pour permettre à l'admin de passer d'un status à un autre*/

    function startProposalsRegistration() public onlyOwner actionAllowed(WorkflowStatus.RegisteringVoters) {
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, workflowStatus);
    }

    function endProposalsRegistration() public onlyOwner actionAllowed(WorkflowStatus.ProposalsRegistrationStarted) {
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, workflowStatus);
    }

    function startVotingSession() public onlyOwner actionAllowed(WorkflowStatus.ProposalsRegistrationEnded) {
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, workflowStatus);
    }

    function endVotingSession() public onlyOwner actionAllowed(WorkflowStatus.VotingSessionStarted) {
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, workflowStatus);
    }

    /* FIN */


    function addProposal(string memory _description) public onlyWhitelisted actionAllowed(WorkflowStatus.ProposalsRegistrationStarted) {
        proposals.push(Proposal(_description, 0));
        emit ProposalRegistered(proposals.length - 1);
    }

    function vote(uint proposalId) public actionAllowed(WorkflowStatus.VotingSessionStarted) onlyWhitelisted {
        Voter storage sender = voters[msg.sender];
        require(!sender.hasVoted, "You have already voted");
        require(proposalId < proposals.length, "Invalid proposal");

        sender.hasVoted = true;
        sender.votedProposalId = proposalId;
        proposals[proposalId].voteCount++;

        emit Voted(msg.sender, proposalId);
    }

    function countVotes() public onlyOwner actionAllowed(WorkflowStatus.VotingSessionEnded) {
        uint _winningProposalId;
        uint maxVotes = 0;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVotes) {
                maxVotes = proposals[i].voteCount;
                _winningProposalId = i;
            }
        }

        winningProposalId = _winningProposalId;
        workflowStatus = WorkflowStatus.VotesTallied;

        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, workflowStatus);
    }



    function getWinner() public view actionAllowed(WorkflowStatus.VotesTallied) returns (Proposal memory) {
        return proposals[winningProposalId];
    }

}