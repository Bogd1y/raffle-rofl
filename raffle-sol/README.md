# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```


# FLOW 

1. USERs Have Tokens 
2. USERs Deps Tokens
3. Select winner invoked - (move this offchain)
  1. GET All value of tokens (price them) (chainlink) +
  2. Calc every user values percentage by (chainlink also) +
  3. Get Random number from chainlink VRM (will use mock for test)
4. INCRESE round for future use
