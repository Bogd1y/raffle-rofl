import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem,  } from "hardhat";
import { getAddress, parseGwei, getContract, parseAbiItem } from "viem";
import { ERC20_ABI } from "./ABI";
import { ABI_UNI_SWAP_ROUTER_MAINNET } from "./ABI_SRA";
import { abi as WETH_ABI } from "./WETH_ABI";

describe("Raffle", function () {
  async function deployOneYearLockFixture() {
    type address = `0x${string}`
    //* Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await viem.getWalletClients();

    const publicClient = await viem.getPublicClient();
    const testClient = await viem.getTestClient();

    const VRFCoordinatorMock = await viem.deployContract('VRFCoordinatorMock')
    const RaffleContract = await viem.deployContract('Raffle', [VRFCoordinatorMock.address])
    
    await RaffleContract.write.setNewCOORDINATOR([VRFCoordinatorMock.address])
    
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

    const raffleAddress = RaffleContract.address; // COntract address
    const ownerAddress = owner.account.address;

    const ethTokenContract = getContract({
      abi: WETH_ABI,
      address: ethAddress,
      client: owner
    })  

    const tokenContract = getContract({
      abi: ERC20_ABI,
      address: tokenAddress,
      client: owner
    })

    return {
      owner,
      otherAccount,
      publicClient,
      RaffleContract,
      testClient,
      swapRouterContract,
      VRFCoordinatorMock,
      tokenAddress,
      ethAddress,
      raffleAddress,
      ownerAddress,
      ethTokenContract,
      tokenContract
    };
  }
  describe("Depping", function () {
    it("Should dep and win (normal flow)", async function () {
      const { publicClient, testClient, VRFCoordinatorMock, otherAccount, owner, RaffleContract, swapRouterContract, ethAddress, ethTokenContract, ownerAddress, raffleAddress, tokenAddress, tokenContract } = await loadFixture(deployOneYearLockFixture)
      
      const amount = BigInt(1000000000000000000) // 1 Eth (vrodi)

      //* whitelist working 
      await RaffleContract.write.addToWhiteList([ethAddress, BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"])
      expect(await RaffleContract.read.isAddressWhiteListed([tokenAddress])).to.be.not.true
      expect(await RaffleContract.read.isAddressWhiteListed([ethAddress])).to.be.true
      
      await ethTokenContract.write.deposit({value: amount })

      // * weth balance of owner is large (the guy is rich)
      expect(Number(await ethTokenContract.read.balanceOf([ownerAddress]))).to.be.not.lessThan(Number(amount))
      
      await owner.sendTransaction({
        to: raffleAddress,
        value: BigInt(200000)
      })

      expect(Number(await publicClient.getBalance({address:  raffleAddress}))).to.be.not.lessThan(200000)


      //* so guy is allowing our C to spend amount
      await ethTokenContract.write.approve([raffleAddress, amount]);

      //* guy deposit
      await expect( RaffleContract.write.dep([ethTokenContract.address, amount])).to.be.not.rejected;

      //*
      expect(Number(await RaffleContract.read.getUserDepValue())).to.be.not.equal(0);

      //* making sure we got all right
      expect(Number(await RaffleContract.read.potTotalValue())).to.be.not.equal(0);
      expect(Number(await RaffleContract.read.getUserDepValue())).to.be.not.equal(0);

      //* and C has balance
      expect(Number(await tokenContract.read.balanceOf([raffleAddress]))).to.be.not.equal(0);
      
      //* time magic
      await time.increase(await RaffleContract.read.timeToWait())

      //* win gen call
      await expect(RaffleContract.write.requestRandomWords()).to.be.not.rejected;

      //* simulating Coordinator resp
      const hashok = await VRFCoordinatorMock.write.fulfillRandomWords([await VRFCoordinatorMock.read.lastRequestId(), [BigInt(13291329)]],{account: owner.account} );
      
      const winTx = await publicClient.waitForTransactionReceipt({hash: hashok})

      const logs = await publicClient.getLogs({
        event: parseAbiItem('event Win(address, uint)'),
      })
      //* fining event WIN
      // RaffleContract.getEvents.Win()
      expect(logs.find(l => l.blockHash == winTx.blockHash)?.blockHash).to.be.equal(winTx.blockHash);
      
      //* no balance 
      expect(Number(await tokenContract.read.balanceOf([raffleAddress]))).to.be.equal(0);

      //* make sure all rested
      expect(Number(await RaffleContract.read.count())).to.be.equal(2)      
      expect(Number(await RaffleContract.read.potTotalValue())).to.be.equal(0)      
      expect(Number(await RaffleContract.read.startTime())).to.be.equal(0)      
    })
    it("Should dep and win (keeper flow)", async function () {
      const { publicClient, testClient, VRFCoordinatorMock, otherAccount, owner, RaffleContract, swapRouterContract, ethAddress, ethTokenContract, ownerAddress, raffleAddress, tokenAddress, tokenContract } = await loadFixture(deployOneYearLockFixture)
      
      const amount = BigInt(1000000000000000000) // 1 Eth (vrodi)

      //* whitelist working 
      await RaffleContract.write.addToWhiteList([ethAddress, BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"])
      expect(await RaffleContract.read.isAddressWhiteListed([tokenAddress])).to.be.not.true
      expect(await RaffleContract.read.isAddressWhiteListed([ethAddress])).to.be.true
      
      await ethTokenContract.write.deposit({value: amount })

      // * weth balance of owner is large (the guy is rich)
      expect(Number(await ethTokenContract.read.balanceOf([ownerAddress]))).to.be.not.lessThan(Number(amount))
      
      await owner.sendTransaction({
        to: raffleAddress,
        value: BigInt(200000)
      })

      expect(Number(await publicClient.getBalance({address:  raffleAddress}))).to.be.not.lessThan(200000)


      //* so guy is allowing our C to spend amount
      await ethTokenContract.write.approve([raffleAddress, amount]);

      //* guy deposit
      await expect( RaffleContract.write.dep([ethTokenContract.address, amount])).to.be.not.rejected;

      //* making sure we got all right
      expect(Number(await RaffleContract.read.potTotalValue())).to.be.not.equal(0);
      expect(Number(await RaffleContract.read.getUserDepValue())).to.be.not.equal(0);

      //* and C has balance
      expect(Number(await tokenContract.read.balanceOf([raffleAddress]))).to.be.not.equal(0);
      
      //* time magic
      expect(await RaffleContract.read.checkUpkeep([ownerAddress])).to.deep.equal([false, '0x'])
      await time.increase(await RaffleContract.read.timeToWait())

      //* win gen call
      await expect(RaffleContract.write.requestRandomWords()).to.be.not.rejected;

      //* simulating chainlink keep
      
      expect(await RaffleContract.read.checkUpkeep([ownerAddress])).to.deep.equal([true, '0x'])
      const d = await RaffleContract.read.checkUpkeep([ownerAddress]);

      if (d[0]) {
        const hashok = await VRFCoordinatorMock.write.fulfillRandomWords([await VRFCoordinatorMock.read.lastRequestId(), [BigInt(13291329)]],{account: owner.account} );
        
        const winTx = await publicClient.waitForTransactionReceipt({hash: hashok})
  
        const logs = await publicClient.getLogs({
          event: parseAbiItem('event Win(address, uint)'),
        })
        //* fining event WIN
        // RaffleContract.getEvents.Win()
        expect(logs.find(l => l.blockHash == winTx.blockHash)?.blockHash).to.be.equal(winTx.blockHash);
      }
      
      
      //* no balance 
      expect(Number(await tokenContract.read.balanceOf([raffleAddress]))).to.be.equal(0);

      //* make sure all rested
      expect(Number(await RaffleContract.read.count())).to.be.equal(2)      
      expect(Number(await RaffleContract.read.potTotalValue())).to.be.equal(0)      
      expect(Number(await RaffleContract.read.startTime())).to.be.equal(0)      
    })
    it("Should dep and fail due to small dep amount", async function () {
      const { publicClient, testClient, VRFCoordinatorMock, otherAccount, owner, RaffleContract, swapRouterContract, ethAddress, ethTokenContract, ownerAddress, raffleAddress, tokenAddress, tokenContract } = await loadFixture(deployOneYearLockFixture)
      
      const amount = BigInt(100)

      //* whitelist working 
      await RaffleContract.write.addToWhiteList([ethAddress, BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"])
      expect(await RaffleContract.read.isAddressWhiteListed([tokenAddress])).to.be.not.true
      expect(await RaffleContract.read.isAddressWhiteListed([ethAddress])).to.be.true
      
      await ethTokenContract.write.deposit({value: amount })

      // * weth balance of owner is large (the guy is rich)
      expect(Number(await ethTokenContract.read.balanceOf([ownerAddress]))).to.be.not.lessThan(Number(amount))
      
      await owner.sendTransaction({
        to: raffleAddress,
        value: BigInt(200000)
      })

      expect(Number(await publicClient.getBalance({address:  raffleAddress}))).to.be.not.lessThan(200000)


      //* so guy is allowing our C to spend amount
      await ethTokenContract.write.approve([raffleAddress, amount]);

      //* guy deposit
      await expect( RaffleContract.write.dep([ethTokenContract.address, amount])).to.be.rejectedWith("Your dep tooooo small");
    })
    it("Should dep and fail due to lack of user approve", async function () {
      const { publicClient, testClient, VRFCoordinatorMock, otherAccount, owner, RaffleContract, swapRouterContract, ethAddress, ethTokenContract, ownerAddress, raffleAddress, tokenAddress, tokenContract } = await loadFixture(deployOneYearLockFixture)
      
      const amount = BigInt(100)

      //* whitelist working 
      await RaffleContract.write.addToWhiteList([ethAddress, BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"])
      expect(await RaffleContract.read.isAddressWhiteListed([tokenAddress])).to.be.not.true
      expect(await RaffleContract.read.isAddressWhiteListed([ethAddress])).to.be.true
      
      await ethTokenContract.write.deposit({value: amount })

      // * weth balance of owner is large (the guy is rich)
      expect(Number(await ethTokenContract.read.balanceOf([ownerAddress]))).to.be.not.lessThan(Number(amount))
      
      await owner.sendTransaction({
        to: raffleAddress,
        value: BigInt(200000)
      })

      expect(Number(await publicClient.getBalance({address:  raffleAddress}))).to.be.not.lessThan(200000)

      //* guy deposit
      await expect( RaffleContract.write.dep([ethTokenContract.address, amount])).to.be.rejected;
    })
    it("Should dep and emit deposit event ", async function () {
      const { publicClient, testClient, VRFCoordinatorMock, otherAccount, owner, RaffleContract, swapRouterContract, ethAddress, ethTokenContract, ownerAddress, raffleAddress, tokenAddress, tokenContract } = await loadFixture(deployOneYearLockFixture)
      
      const amount = BigInt(1000000000000000000) // 1 Eth (vrodi)

      //* whitelist working 
      await RaffleContract.write.addToWhiteList([ethAddress, BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"])
      expect(await RaffleContract.read.isAddressWhiteListed([tokenAddress])).to.be.not.true
      expect(await RaffleContract.read.isAddressWhiteListed([ethAddress])).to.be.true
      
      await ethTokenContract.write.deposit({value: amount })

      // * weth balance of owner is large (the guy is rich)
      expect(Number(await ethTokenContract.read.balanceOf([ownerAddress]))).to.be.not.lessThan(Number(amount))
      
      await owner.sendTransaction({
        to: raffleAddress,
        value: BigInt(200000)
      })

      expect(Number(await publicClient.getBalance({address:  raffleAddress}))).to.be.not.lessThan(200000)


      //* so guy is allowing our C to spend amount
      await ethTokenContract.write.approve([raffleAddress, amount]);

      //* guy deposit
      const hash = await RaffleContract.write.dep([ethTokenContract.address, amount]);
      
      await publicClient.waitForTransactionReceipt({hash})

      expect(
        await RaffleContract.getEvents.Deposit()
      ).to.be.at.lengthOf(1)
      
    })


  })
  describe("Configuration", function () {
    it("Should change time to wait + not when not admin", async function () {
      const { publicClient, testClient, VRFCoordinatorMock, otherAccount, owner, RaffleContract, swapRouterContract, ethAddress, ethTokenContract, ownerAddress, raffleAddress, tokenAddress, tokenContract } = await loadFixture(deployOneYearLockFixture)

      await expect(RaffleContract.write.setTimeToWait([BigInt(21)])).to.be.not.rejected
      
      await expect(RaffleContract.write.setTimeToWait([BigInt(21)], {
        account: otherAccount.account
      })).to.be.rejectedWith("You are not him!")
      
      await expect(RaffleContract.write.setTimeToWait([BigInt(21)])).to.be.not.rejected
    })
    it("Should change whitelist + not when not admin", async function () {
      const { publicClient, testClient, VRFCoordinatorMock, otherAccount, owner, RaffleContract, swapRouterContract, ethAddress, ethTokenContract, ownerAddress, raffleAddress, tokenAddress, tokenContract } = await loadFixture(deployOneYearLockFixture)

      await expect( RaffleContract.write.addToWhiteList([ethAddress, BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"])).to.be.not.rejected
      expect(await RaffleContract.read.isAddressWhiteListed([tokenAddress])).to.be.not.true
      
      await expect( RaffleContract.write.addToWhiteList([ethAddress, BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"], {
        account: otherAccount.account
      })).to.be.rejectedWith("You are not him!")
    })
    it("Should restrict changing the coordinator to non-admin", async function () {
      const { RaffleContract, otherAccount } = await loadFixture(deployOneYearLockFixture);

      const newCoordinator = await viem.deployContract('VRFCoordinatorMock');

      await expect(RaffleContract.write.setNewCOORDINATOR([newCoordinator.address], { account: otherAccount.account })).to.be.rejectedWith("You are not him!");
  });

  })
  describe("Automation", function () {
    it("Check upkeep", async function () {
      const { publicClient, testClient, VRFCoordinatorMock, otherAccount, owner, RaffleContract, swapRouterContract, ethAddress, ethTokenContract, ownerAddress, raffleAddress, tokenAddress, tokenContract } = await loadFixture(deployOneYearLockFixture)
      
      const amount = BigInt(1000000000000000000) // 1 Eth (vrodi)

      //* whitelist working 
      await RaffleContract.write.addToWhiteList([ethAddress, BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"])
      expect(await RaffleContract.read.isAddressWhiteListed([tokenAddress])).to.be.not.true
      expect(await RaffleContract.read.isAddressWhiteListed([ethAddress])).to.be.true
      
      await ethTokenContract.write.deposit({value: amount })

      // * weth balance of owner is large (the guy is rich)
      expect(Number(await ethTokenContract.read.balanceOf([ownerAddress]))).to.be.not.lessThan(Number(amount))
      
      await owner.sendTransaction({
        to: raffleAddress,
        value: BigInt(200000)
      })

      expect(Number(await publicClient.getBalance({address:  raffleAddress}))).to.be.not.lessThan(200000)


      //* so guy is allowing our C to spend amount
      await ethTokenContract.write.approve([raffleAddress, amount]);

      //* guy deposit
      await expect( RaffleContract.write.dep([ethTokenContract.address, amount])).to.be.not.rejected;

      expect(await RaffleContract.read.checkUpkeep([tokenAddress])).to.be.deep.equal([false, '0x'])

      await time.increase(100);

      expect(await RaffleContract.read.checkUpkeep([tokenAddress])).to.be.deep.equal([true, '0x'])
    })
  })
});
// TODO


