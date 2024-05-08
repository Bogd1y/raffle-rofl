import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const INFURA_API_KEY = vars.get("INFURA_API_KEY");
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");


const config: HardhatUserConfig = {
  solidity:{
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    }
  },
  mocha: {
    timeout: 600000
  },
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
      //   // url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      //   // blockNumber: 19706187
        url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
        // blockNumber: 5773402
      }
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
};

export default config;

