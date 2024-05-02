// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract MyToken is ERC20, ERC20Burnable {

    address admin; 

    constructor()
        ERC20("MyToken", "MTK")
    {
        admin = msg.sender;
    }

    function mint(address to, uint256 amount) public {
        // require(admin == msg.sender, "Not him");
        _mint(to, amount);
        // _transferVotingUnits(address(0), to, amount);
    }
}
