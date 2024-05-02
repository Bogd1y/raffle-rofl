
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./MyToken.sol";

contract MyGov is MyToken {

  event NewProposal(uint proposalId);
  event NewVote(address voter, uint proposalId);
  event ProposalEnd(uint proposalId);
  
  uint public voteDuration = 60; 
  int8 public minOvertake = 1;
  uint public minBalanceToVote = 100;
  uint8 public count = 1;

  struct ProposalCore {
    address proposer;
    uint voteStart;
    uint[] values;
    int8 votes;
  }

  mapping (uint proposalId => ProposalCore) private _proposals;
  mapping (uint count => mapping(address voter => uint proposalId)) hasVoted; // after one option is sellected all votes are anewed

  function hashProposal(
    uint256[] memory values
  ) public pure returns (uint256) {
      return uint256(keccak256(abi.encode(values)));
  }

  function propose( uint256[] memory _values) public returns (uint256) {
    require(_proposals[hashProposal(_values)].voteStart == 0, "Such proposal already exsist!");

    address proposer = _msgSender();

    require(hasVoted[count][proposer] == 0, "You have already voted!"); // wait for vote to be finshed

    uint proposalId = hashProposal(_values);

    _proposals[proposalId] = ProposalCore({
      proposer: proposer,
      voteStart: block.timestamp,
      values: _values, 
      votes: 0
    });

    hasVoted[count][proposer] = proposalId;

    emit NewProposal(proposalId);
    return proposalId;
  }

  function vote(uint _proposalId, int8 support) public {
    require(_proposals[_proposalId].voteStart > 0, "No such proposal");
    require(support == -1 || support == 1, "Invalid?");

    address voter = _msgSender();

    require(balanceOf(voter) >= minBalanceToVote, "Not enought power!");
    // require(hasVoted[count][voter] == 0, "You have already voted!"); // wait for vote to be finshed

    _proposals[_proposalId].votes += support;

    emit NewVote(voter, _proposalId);
  }

  function executeVote(uint _proposalId) public {
    ProposalCore storage currentProposal = _proposals[_proposalId];

    require(currentProposal.voteStart > 0, "No such proposal");
    require(block.timestamp > currentProposal.voteStart + voteDuration, "Vote is still going");
    require(currentProposal.votes > minOvertake, "Quorum not reached");

    _execute(currentProposal.values);


    count++;
    _proposals[_proposalId] = ProposalCore({
      proposer: address(0),
      voteStart: 0,
      values:  new uint[](0), 
      votes: 0
    });

    emit ProposalEnd(_proposalId);
  }

  function _execute(uint[] memory) internal virtual {
    
  }

  function transfer(address to, uint256 value) public override returns (bool) {
    address owner = _msgSender();
    require(hasVoted[count][owner] == 0, "You are in vote!"); // wait for vote to be finshed
    _transfer(owner, to, value);
    return true;
  }

  function transferFrom(address from, address to, uint256 value) public override returns (bool) {
    address spender = _msgSender();
    require(hasVoted[count][from] == 0, "You are in vote!"); // wait for vote to be finshed
    _spendAllowance(from, spender, value);
    _transfer(from, to, value);
    return true;
  }


}