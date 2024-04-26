import { getContract } from 'viem';
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem, } from "hardhat";
import { ABI_UNI_SWAP_ROUTER_MAINNET } from "./ABI_SRA";
import { abi as WETH_ABI } from "./WETH_ABI";

describe("VRFv2Consumer", function () {
  async function deployFixture() {
    type address = `0x${string}`
    //* Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await viem.getWalletClients();

    const publicClient = await viem.getPublicClient();
    const testClient = await viem.getTestClient();

    const VRFCoordinatorMock = await viem.deployContract('VRFCoordinatorMock')
    const ConsumerContract = await viem.deployContract('VRFv2Consumer', [BigInt(123), VRFCoordinatorMock.address])
    
    await ConsumerContract.write.setNewCOORDINATOR([VRFCoordinatorMock.address])
    
    const swapRouterAddress: address = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; //! Uniswap V3 MAINNET SwapRouter address
    // const swapRouterAddress = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; //* Uniswap SwapRouter address / sepolia doesnt work :((( s3 :(
    
    const swapRouterContract = getContract({
      abi: ABI_UNI_SWAP_ROUTER_MAINNET,
      address: swapRouterAddress,
      client: owner,
    });

    const tokenAddress: address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; //! USDC mainet token address
    // const tokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; //! USDT mainet token address
    // const tokenAddress = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0"; //* USDT sepolia token address
    const ethAddress: address = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; //! WETH mainet token address
    // const ethAddress = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"; //* WETH sepolia token address

    const raffleAddress = ConsumerContract.address; // COntract address
    const ownerAddress = owner.account.address;

    return {
      owner,
      otherAccount,
      publicClient,
      ConsumerContract,
      testClient,
      swapRouterContract,
      VRFCoordinatorMock,
      tokenAddress,
      ethAddress,
      raffleAddress,
      ownerAddress,
    };
  }

  describe("Requesting Random Numbers", function () {
    it("Should send a request for random numbers", async function () {
        const { ConsumerContract, publicClient } = await loadFixture(deployFixture);
        
        const hash = await ConsumerContract.write.requestRandomWords();

        const receipt = await publicClient.waitForTransactionReceipt({hash})
        expect(Number(await ConsumerContract.read.lastRequestId())).to.be.equal(1);

        const lastestReq = await ConsumerContract.read.lastRequestId()
        expect(await ConsumerContract.getEvents.RequestSent()).to.be.at.lengthOf(1)
        const event = receipt
        console.log(parseInt(event.logs[0].data), lastestReq);

    });

    it("Should handle multiple concurrent requests", async function () {
        const { ConsumerContract } = await loadFixture(deployFixture);
        
        const requestIds = await Promise.all([
            ConsumerContract.write.requestRandomWords(),
            ConsumerContract.write.requestRandomWords(),
            ConsumerContract.write.requestRandomWords(),
        ]);

        expect(requestIds).to.have.lengthOf(3);
    });
});

describe("Fulfilling Random Numbers", function () {
    it("Should fulfill a request for random numbers", async function () {
        const { ConsumerContract, VRFCoordinatorMock } = await loadFixture(deployFixture);

        const requestId = await ConsumerContract.write.requestRandomWords();

        const randomWords = [BigInt(123), BigInt(456)]; // Example random numbers
        await VRFCoordinatorMock.write.fulfillRandomWords([BigInt(1), randomWords]);

        const data = await ConsumerContract.read.getRequestStatus([BigInt(1)]);
        expect(data[0]).to.be.true;
        expect(data[1]).to.deep.equal(randomWords);
    });

    it("Should not fulfill a request if not found", async function () {
        const { ConsumerContract, VRFCoordinatorMock } = await loadFixture(deployFixture);

        const randomWords = [BigInt(123), BigInt(456)]; // Example random numbers
        await expect(VRFCoordinatorMock.write.fulfillRandomWords([BigInt(11), randomWords])).to.be.rejected;

        await expect( ConsumerContract.read.getRequestStatus([BigInt(123)])).to.be.rejectedWith("request not found")
    });
});

describe("Changing Coordinator", function () {
    it("Should allow changing the coordinator", async function () {
        const { ConsumerContract, VRFCoordinatorMock } = await loadFixture(deployFixture);

        const newCoordinator = await viem.deployContract('VRFCoordinatorMock');
        await expect(ConsumerContract.write.setNewCOORDINATOR([newCoordinator.address])).to.be.not.rejected;
            });

});


    // Add more tests as needed to cover other functions and edge cases
});
