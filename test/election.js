var Election = artifacts.require("./Election.sol");

contract("Election", function(accounts) {

    var election;

    it("initializes with two candidates", function() {
        return Election.deployed().then(function(instance) {
            return instance.candidatesCount();
        }).then(function(count) {
            assert.equal(count, 2);
        })
    })

    it("initializes candidates with correct values", function() {
        return Election.deployed().then(function(instance) {
            election = instance;
            return election.candidates(1);
        }).then(function(candidate) {
            assert.equal(candidate[0], 1, "contains the correct id");
            assert.equal(candidate[1], "Oarack Bobama", "contains the correct name");
            assert.equal(candidate[2], 0, "contains the correct votes count");
            return election.candidates(2);
        }).then(function(candidate) {
            assert.equal(candidate[0], 2, "contains the correct id");
            assert.equal(candidate[1], "Tonald Drump", "contains the correct name");
            assert.equal(candidate[2], 0, "contains the correct votes count");
        });
    });

    it("allows a voter to cast the vote", function() {
        return Election.deployed().then(function(instance) {
            election = instance;
            candidateId = 1;
            return election.vote(candidateId, { from: accounts[0] });
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, "on event was triggered");
            assert.equal(receipt.logs[0].event, "votedEvent", "the correct event type is triggered");
            assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidateId is correct")
            return election.voters(accounts[0]);
        }).then(function(voted) {
            assert(voted, "the voter was marked as voted");
            return election.candidates(candidateId);
        }).then(function(candidate) {
            var voteCount = candidate[2];
            assert.equal(voteCount, 1, "increments the candidate's vote count");
        })
    });

    it("throws an exception for invalid candidate", function() {
        return Election.deployed().then(function(instance) {
            election = instance;
            return election.vote(99, { from: accounts[0] });
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert")
            return election.candidates(1);
        }).then(function(candidate1) {
            var voteCount = candidate1[2];
            assert.equal(1, voteCount, "candidate 1 didn't received any votes");
            return election.candidates(2);
        }).then(function(candidate2) {
            var voteCount = candidate2[2];
            assert.equal(0, voteCount, "candidate 2 didn't received any votes");
        })
    });

    it("throws an exception for double voting", function() {
        return Election.deployed().then(function(instance) {
            election = instance;
            candidateId = 2;
            election.vote(candidateId, { from : accounts[1] });
            return election.candidates(candidateId);
        }).then(function(candidate) {
            var voteCount = candidate[2];
            assert.equal(voteCount, 1, "accepts the first vote");
            return election.vote(candidateId, { from : accounts[1] });
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain revert");
            return election.candidates(1);
        }).then(function(candidate1) {
            var voteCount = candidate1[2];
            assert.equal(voteCount, 1, "candidate 1 didn't received any votes");
            return election.candidates(2);
        }).then(function(candidate2) {
            var voteCount = candidate2[2];
            assert.equal(voteCount, 1, "candidate 2 didn't received any votes");
        })
    });
})