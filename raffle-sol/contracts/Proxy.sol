// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;


import "hardhat/console.sol";

contract Proxy {
  address public admin;
  address public impl;

  constructor() {
    admin = msg.sender;
  }

  function initialize(address _newImpl) public {
    require(admin == msg.sender, "KUDA POLIZ ?");
    impl = _newImpl;

  }
  function _delegate() private returns(bytes memory){
    (bool ok, bytes memory data ) = impl.delegatecall(msg.data);
    return data;
    require(ok, "porazka :(");
  }

  fallback(bytes calldata) external payable returns(bytes memory) { 
    return _delegate();
  }
  receive() external payable {
    _delegate();
  }

}