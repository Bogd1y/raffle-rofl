// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
pragma abicoder v2;

import "hardhat/console.sol";
import "./Interface/IERC.sol";
import "./Interface/WETH.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol"; //! mainet
import "./Random.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

// import "../Interface/Abi.sol"; // * sepolia
// import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@uniswap/v3-sdk/contracts/interfaces/IUniswapV3Pool.sol";
// import "@uniswap/v3-sdk/contracts/interfaces/IUniswapV3Quoter.sol";

contract RaffleV2 is VRFv2Consumer, AutomationCompatibleInterface {
  address public admin;
  address public impl;

  IERC20 public tokenContract;
  AggregatorV3Interface internal dataFeed;

  //! SWAP ROUTER ADDRESS
  address public constant routerAddress = 0xE592427A0AEce92De3Edee1F18E0157C05861564; // mainet
  // address public constant routerAddress = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E; // sepolia
  // address outAdrress = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9; // WETH sepolia
  // address outAdrress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH mainet
  // address outAdrress = 0xdAC17F958D2ee523a2206206994597C13D831ec7; //! USDT mainet token address
  // address outAdrress = 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0; //* USDT sepolia token address
  address outAdrress = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; //! USDC mainet token address

  ISwapRouter public immutable swapRouter = ISwapRouter(routerAddress);

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
  
  uint8 x = 5;
  uint8 y = 5;
  uint8 z = 90;
  address founder;
  address stake;


  event Deposit(address, uint);
  event Win(address, uint);

  constructor(address consumerAddress) VRFv2Consumer(11366, consumerAddress) {
    admin = msg.sender;
    dataFeed = AggregatorV3Interface(0x986b5E1e1755e3C2440e960477f25201B0a8bbD4);
    stake = address(0);
  }

  receive() external payable {}

  function _onlyAdmin() internal override onlyAdmin{} 
  function _timeCheck() public view override {
    require(block.timestamp > startTime + timeToWait, "Time is not to be wasted, gamble more while you still can!");
  }

  modifier onlyAdmin {
    require(msg.sender == admin, "You are not him!");
    _;
  }
  function confX(uint8 _x) external onlyAdmin {
  x = _x;
  }
  function confY(uint8 _y) external onlyAdmin {
    x = _y;
  }
  function confZ(uint8 _z) external onlyAdmin {
    x = _z;
  }
  function changeFounder(address _address) external onlyAdmin {
    founder = _address;
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

    uint minOutPrice = uint(answer) * _amount / 10**18 / 10**priceFeeds[_tokenAddress].decimals; // 18 + 11 

    require(minOutPrice != 0, "Your dep tooooo small");

    tokenContract.approve(address(swapRouter), _amount);

    ISwapRouter.ExactInputSingleParams memory params =
    ISwapRouter.ExactInputSingleParams({
        tokenIn: _tokenAddress,
        tokenOut: outAdrress,
        fee: 3000,
        recipient: address(this),
        deadline: block.timestamp,
        amountIn: _amount,
        amountOutMinimum: minOutPrice,  
        sqrtPriceLimitX96: 0
    });

    uint amountOut = swapRouter.exactInputSingle(params);

    uint finalAmount = amountOut;

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

    tContract.transfer(winner, potTotalValue * z / 100 );
    tContract.transfer(founder, potTotalValue * y / 100 );
    tContract.transfer(stake, potTotalValue * x / 100);

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
      returns (bool upkeepNeeded, bytes memory /* performData */)
  {
      upkeepNeeded = block.timestamp > startTime + timeToWait;
      // The checkData is defined when the Upkeep was registered.
  }

  function getUserDepValue() public view returns(uint) {
    return userDepValue[count][msg.sender];
  }

  function performUpkeep(bytes calldata /* performData */) external override {
    requestRandomWords();
  }
  
}
