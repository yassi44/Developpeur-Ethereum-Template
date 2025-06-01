import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("testing Voting...", function () {
  async function deployVotingFixture() {
    const [owner, voter1, voter2, voter3, notVoter] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    return { voting, owner, voter1, voter2, voter3, notVoter };
  }

  async function deployWithVotersFixture() {
    const [owner, voter1, voter2, voter3, notVoter] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    
    await voting.connect(owner).addVoter(voter1.address);
    await voting.connect(owner).addVoter(voter2.address);
    await voting.connect(owner).addVoter(voter3.address);
    
    return { voting, owner, voter1, voter2, voter3, notVoter };
  }

  async function deployWithProposalsFixture() {
    const { voting, owner, voter1, voter2, voter3, notVoter } = await deployWithVotersFixture();
    
    await voting.connect(owner).startProposalsRegistering();
    await voting.connect(voter1).addProposal("Proposal 1");
    await voting.connect(voter2).addProposal("Proposal 2");
    
    return { voting, owner, voter1, voter2, voter3, notVoter };
  }

  async function deployReadyToVoteFixture() {
    const { voting, owner, voter1, voter2, voter3, notVoter } = await deployWithProposalsFixture();
    
    await voting.connect(owner).endProposalsRegistering();
    await voting.connect(owner).startVotingSession();
    
    return { voting, owner, voter1, voter2, voter3, notVoter };
  }

  describe("Deploy", function () {
    it("...Should deploy with owner", async function () {
      const { voting, owner } = await loadFixture(deployVotingFixture);

      expect(await voting.owner()).to.equal(owner);
    });

    it("WorkflowStatus should be at RegisteringVoters", async function () {
      const { voting } = await loadFixture(deployVotingFixture);

      expect(await voting.workflowStatus()).to.equal(0);
    });

    it("winningProposalID should be 0", async function () {
      const { voting } = await loadFixture(deployVotingFixture);

      expect(await voting.winningProposalID()).to.equal(0);
    });
  });

  describe("Registration", function () {
    it("...Only owner should call addVoter", async function () {
      const { voting, owner, voter1 } = await loadFixture(deployVotingFixture);

      await expect(voting.connect(owner).addVoter(voter1.address)).to.not.be.reverted;
    });

    it("...should emit VoterRegistered event when owner adds voter", async function () {
      const { voting, owner, voter1 } = await loadFixture(deployVotingFixture);

      await expect(voting.connect(owner).addVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);
    });

    it("...should revert when non-owner tries to add voter", async function () {
      const { voting, voter1, voter2 } = await loadFixture(deployVotingFixture);

      await expect(voting.connect(voter2).addVoter(voter1.address)).to.be.reverted;
    });

    it("...should revert when adding already registered voter", async function () {
      const { voting, owner, voter1 } = await loadFixture(deployVotingFixture);

      await voting.connect(owner).addVoter(voter1.address);
      await expect(voting.connect(owner).addVoter(voter1.address))
        .to.be.revertedWith("Already registered");
    });

    it("...should revert when adding voter outside RegisteringVoters phase", async function () {
      const { voting, owner, voter1 } = await loadFixture(deployWithVotersFixture);

      await voting.connect(owner).startProposalsRegistering();
      await expect(voting.connect(owner).addVoter(voter1.address))
        .to.be.revertedWith("Voters registration is not open yet");
    });

    it("...should set voter as registered", async function () {
      const { voting, owner, voter1 } = await loadFixture(deployVotingFixture);

      await voting.connect(owner).addVoter(voter1.address);
      const voterInfo = await voting.connect(voter1).getVoter(voter1.address);
      
      expect(voterInfo.isRegistered).to.be.true;
      expect(voterInfo.hasVoted).to.be.false;
      expect(voterInfo.votedProposalId).to.equal(0);
    });
  });

  describe("Getters", function () {
    it("...should revert getVoter if caller is not a voter", async function () {
      const { voting, notVoter, voter1 } = await loadFixture(deployWithVotersFixture);

      await expect(voting.connect(notVoter).getVoter(voter1.address))
        .to.be.revertedWith("You're not a voter");
    });

    it("...should return voter info if caller is a voter", async function () {
      const { voting, voter1 } = await loadFixture(deployWithVotersFixture);

      const voterInfo = await voting.connect(voter1).getVoter(voter1.address);
      expect(voterInfo.isRegistered).to.be.true;
    });

    it("...should revert getOneProposal if caller is not a voter", async function () {
      const { voting, notVoter } = await loadFixture(deployWithProposalsFixture);

      await expect(voting.connect(notVoter).getOneProposal(0))
        .to.be.revertedWith("You're not a voter");
    });

    it("...should return proposal info if caller is a voter", async function () {
      const { voting, voter1 } = await loadFixture(deployWithProposalsFixture);

      const proposal = await voting.connect(voter1).getOneProposal(0);
      expect(proposal.description).to.equal("GENESIS");
      expect(proposal.voteCount).to.equal(0);
    });
  });

  describe("Workflow State Changes", function () {
    it("...should start proposals registration", async function () {
      const { voting, owner } = await loadFixture(deployWithVotersFixture);

      await expect(voting.connect(owner).startProposalsRegistering())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(0, 1);
      
      expect(await voting.workflowStatus()).to.equal(1);
    });

    it("...should add GENESIS proposal when starting proposals registration", async function () {
      const { voting, owner, voter1 } = await loadFixture(deployWithVotersFixture);

      await voting.connect(owner).startProposalsRegistering();
      const genesisProposal = await voting.connect(voter1).getOneProposal(0);
      
      expect(genesisProposal.description).to.equal("GENESIS");
    });

    it("...should revert startProposalsRegistering if not in RegisteringVoters", async function () {
      const { voting, owner } = await loadFixture(deployWithProposalsFixture);

      await expect(voting.connect(owner).startProposalsRegistering())
        .to.be.revertedWith("Registering proposals cant be started now");
    });

    it("...should end proposals registration", async function () {
      const { voting, owner } = await loadFixture(deployWithProposalsFixture);

      await expect(voting.connect(owner).endProposalsRegistering())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(1, 2);
      
      expect(await voting.workflowStatus()).to.equal(2);
    });

    it("...should start voting session", async function () {
      const { voting, owner } = await loadFixture(deployWithProposalsFixture);

      await voting.connect(owner).endProposalsRegistering();
      
      await expect(voting.connect(owner).startVotingSession())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(2, 3);
      
      expect(await voting.workflowStatus()).to.equal(3);
    });

    it("...should end voting session", async function () {
      const { voting, owner } = await loadFixture(deployReadyToVoteFixture);

      await expect(voting.connect(owner).endVotingSession())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(3, 4);
      
      expect(await voting.workflowStatus()).to.equal(4);
    });

    it("...should tally votes", async function () {
      const { voting, owner } = await loadFixture(deployReadyToVoteFixture);

      await voting.connect(owner).endVotingSession();
      
      await expect(voting.connect(owner).tallyVotes())
        .to.emit(voting, "WorkflowStatusChange")
        .withArgs(4, 5);
      
      expect(await voting.workflowStatus()).to.equal(5);
    });
  });

  describe("Proposals", function () {
    it("...should add proposal", async function () {
      const { voting, voter1 } = await loadFixture(deployWithProposalsFixture);

      await expect(voting.connect(voter1).addProposal("New Proposal"))
        .to.emit(voting, "ProposalRegistered")
        .withArgs(3);
    });

    it("...should revert if non-voter tries to add proposal", async function () {
      const { voting, owner, notVoter } = await loadFixture(deployWithVotersFixture);

      await voting.connect(owner).startProposalsRegistering();
      
      await expect(voting.connect(notVoter).addProposal("Proposal"))
        .to.be.revertedWith("You're not a voter");
    });

    it("...should revert if proposal is empty", async function () {
      const { voting, voter1 } = await loadFixture(deployWithProposalsFixture);

      await expect(voting.connect(voter1).addProposal(""))
        .to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
    });

    it("...should revert if not in proposals registration phase", async function () {
      const { voting, voter1 } = await loadFixture(deployWithVotersFixture);

      await expect(voting.connect(voter1).addProposal("Proposal"))
        .to.be.revertedWith("Proposals are not allowed yet");
    });
  });

  describe("Voting", function () {
    it("...should vote for proposal", async function () {
      const { voting, voter1 } = await loadFixture(deployReadyToVoteFixture);

      await expect(voting.connect(voter1).setVote(1))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, 1);
    });

    it("...should update voter info after voting", async function () {
      const { voting, voter1 } = await loadFixture(deployReadyToVoteFixture);

      await voting.connect(voter1).setVote(1);
      const voterInfo = await voting.connect(voter1).getVoter(voter1.address);
      
      expect(voterInfo.hasVoted).to.be.true;
      expect(voterInfo.votedProposalId).to.equal(1);
    });

    it("...should increment proposal vote count", async function () {
      const { voting, voter1 } = await loadFixture(deployReadyToVoteFixture);

      await voting.connect(voter1).setVote(1);
      const proposal = await voting.connect(voter1).getOneProposal(1);
      
      expect(proposal.voteCount).to.equal(1);
    });

    it("...should revert if voter already voted", async function () {
      const { voting, voter1 } = await loadFixture(deployReadyToVoteFixture);

      await voting.connect(voter1).setVote(1);
      
      await expect(voting.connect(voter1).setVote(1))
        .to.be.revertedWith("You have already voted");
    });

    it("...should revert if non-voter tries to vote", async function () {
      const { voting, notVoter } = await loadFixture(deployReadyToVoteFixture);

      await expect(voting.connect(notVoter).setVote(1))
        .to.be.revertedWith("You're not a voter");
    });

    it("...should revert if proposal doesn't exist", async function () {
      const { voting, voter1 } = await loadFixture(deployReadyToVoteFixture);

      await expect(voting.connect(voter1).setVote(99))
        .to.be.revertedWith("Proposal not found");
    });

    it("...should revert if not in voting phase", async function () {
      const { voting, voter1 } = await loadFixture(deployWithProposalsFixture);

      await expect(voting.connect(voter1).setVote(1))
        .to.be.revertedWith("Voting session havent started yet");
    });
  });

  describe("Tally Votes", function () {
    async function deployWithVotesFixture() {
      const { voting, owner, voter1, voter2, voter3 } = await deployReadyToVoteFixture();
      
      await voting.connect(voter1).setVote(1);
      await voting.connect(voter2).setVote(1);
      await voting.connect(voter3).setVote(2);
      await voting.connect(owner).endVotingSession();
      
      return { voting, owner, voter1, voter2, voter3 };
    }

    it("...should determine winning proposal", async function () {
      const { voting, owner } = await loadFixture(deployWithVotesFixture);

      await voting.connect(owner).tallyVotes();
      
      expect(await voting.winningProposalID()).to.equal(1);
    });

    it("...should revert if not in VotingSessionEnded phase", async function () {
      const { voting, owner } = await loadFixture(deployReadyToVoteFixture);

      await expect(voting.connect(owner).tallyVotes())
        .to.be.revertedWith("Current status is not voting session ended");
    });

   
  });
});