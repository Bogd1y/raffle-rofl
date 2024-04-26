import "./IERC.sol";

interface IWETH9 is IERC20 {
    function deposit() external payable;

    function withdraw(uint256 _amount) external;
}