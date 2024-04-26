import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  mocha: {
    timeout: 600000
  },
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        url: "https://mainnet.infura.io/v3/004af4789d5446518b70416003876477",
        blockNumber: 19706187
        // url: "https://sepolia.infura.io/v3/004af4789d5446518b70416003876477",
        // blockNumber: 5773400
      }
    }
  }
};

export default config;

