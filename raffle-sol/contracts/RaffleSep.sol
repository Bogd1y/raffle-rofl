// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
pragma abicoder v2;

// import "hardhat/console.sol";

import "./Interface/IERC.sol";
import "./Interface/WETH.sol";
import "./Random.sol";  
import "./Gov.sol";

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract RaffleSep is VRFv2Consumer, AutomationCompatibleInterface {
  address public admin;
  address public impl;

  IERC20 public tokenContract;
  AggregatorV3Interface internal dataFeed;

  address public constant routerAddress = 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008; // sepolia
  // address outAdrress = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9; // WETH sepolia
  address outAdrress = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8; // USDC sepolia
  
  IUniswapV2Router02 public immutable swapRouter = IUniswapV2Router02(routerAddress);

  struct PriceFeed {
    uint decimals;
    address feedAddress;
  }

  mapping (address => bool) availableTokens; //* white list
  mapping (address => PriceFeed) priceFeeds;
  mapping (uint count => mapping (address => uint)) userDepValue;

  address[] usersAddresses;
  uint public potTotalValue;
  uint public count = 1;
  uint public timeToWait = 3;
  uint public startTime = 0; 

  uint x = 90;
  uint y = 5;
  uint z = 5;

  event Deposit(address, uint);
  event Win(address, uint);

  // MyGovernor(_token)
  constructor(address coordinatorAddress) VRFv2Consumer(11065, coordinatorAddress) {
    admin = msg.sender;
    dataFeed = AggregatorV3Interface(0x986b5E1e1755e3C2440e960477f25201B0a8bbD4);
  }

  receive() external payable {}

  // function _executeResult(uint[] memory values) internal override {
  //   x = values[0]; 
  //   y = values[1]; 
  //   z = values[2]; 
  // }

  function _onlyAdmin() internal override onlyAdmin{} 
  function _timeCheck() public view override {
    require(block.timestamp > startTime + timeToWait, "Time is not to be wasted, gamble more while you still can!");
  }

  modifier onlyAdmin {
    require(msg.sender == admin, "You are not him!");
    _;
  }

  function isAddressWhiteListed(address _address) public view returns(bool) {
    return availableTokens[_address];
  }
  function setTimeToWait(uint _timeToWait) external onlyAdmin {
    timeToWait= _timeToWait;
  }
  function setOutAddress(address _address) external onlyAdmin{
    outAdrress = _address;
  }
  function addToWhiteList(address _address, uint _decimals, address _feedAddress) external onlyAdmin {
    availableTokens[_address] = true;
    priceFeeds[_address] = PriceFeed({
      decimals: _decimals,
      feedAddress: _feedAddress
    });
  }
  function conectToToken(address _tokenAddress) public {
    require(availableTokens[_tokenAddress], "Token not whitelisted");
    tokenContract = IERC20(_tokenAddress);
  }
  function conectToPriceFeed(address _tokenAddress) public {
    dataFeed = AggregatorV3Interface(priceFeeds[_tokenAddress].feedAddress);
  }

  function dep(address _tokenAddress, uint _amount) external {

    conectToToken(_tokenAddress);
    require(tokenContract.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

    if(potTotalValue == 0) {
      startTime = block.timestamp;
    }

    if(userDepValue[count][msg.sender] == 0) {
      usersAddresses.push(msg.sender);
    }
    
    conectToPriceFeed(_tokenAddress);
    (
        /* uint80 roundID */,
        int answer, // 318174231904172
        /*uint startedAt*/,
        /*uint timeStamp*/,
        /*uint80 answeredInRound*/
    ) = dataFeed.latestRoundData();

    uint minOutPrice = uint(answer) * _amount / 10**18 / 10**priceFeeds[_tokenAddress].decimals; // calc actucal price 

    require(minOutPrice != 0, "Your dep tooooo small");
    tokenContract.approve(address(swapRouter), _amount);

    address[] memory path = new address[](2);
    path[0] = _tokenAddress;
    path[1] = outAdrress;
    
    uint[] memory amountOut = swapRouter.swapExactTokensForTokens({
      amountIn: _amount,
      amountOutMin: minOutPrice,
      path: path,
      to: address(this),
      deadline: block.timestamp
    });

    uint finalAmount = amountOut[1];

    userDepValue[count][msg.sender] += finalAmount;
    potTotalValue += finalAmount;
    
    emit Deposit(msg.sender, finalAmount);
  }

  function _fulfillRandomWords(uint[] memory _randomWords) override internal {
    address winner;
    uint cumulativePercent;

    for (uint i = 0; i < usersAddresses.length; i++) {
      
      cumulativePercent += userDepValue[count][usersAddresses[i]];

      uint randomchik = _randomWords[0] > potTotalValue ? _randomWords[0] % potTotalValue : _randomWords[0];

      if (randomchik <= cumulativePercent) {
        winner = usersAddresses[i];
      }
    }
    if (winner == address(0)) {
      winner = usersAddresses[0];
    }

    IERC20 tContract = IERC20(outAdrress); 
    
    tContract.transfer(winner, tContract.balanceOf(address(this)));

    count++;
    delete usersAddresses;
    potTotalValue = 0;
    startTime = 0;

    emit Win(winner, potTotalValue);
  }

  function checkUpkeep(
      bytes calldata /* checkData */
  )
      external
      view
      override
      returns (bool upkeepNeeded, bytes memory performData)
  {
      upkeepNeeded = block.timestamp > startTime + timeToWait;
      // The checkData is defined when the Upkeep was registered.
      return (upkeepNeeded, performData);
  }

  function getUserDepValue() public view returns(uint) {
    return userDepValue[count][msg.sender];
  }

  function performUpkeep(bytes calldata /* performData */) external override {
    requestRandomWords();
  }
  
}
