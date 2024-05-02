import { viem } from 'hardhat';
import { time, mine, mineUpTo } from '@nomicfoundation/hardhat-network-helpers';

interface Clock {
  blocknumber: () => Promise<bigint>;
  timestamp: () => Promise<bigint>;
}

interface ClockFromReceipt {
  blocknumber: (receipt: any) => Promise<bigint>;
  timestamp: (receipt: any) => Promise<bigint>;
}

interface IncreaseBy {
  blockNumber: typeof mine;
  timestamp: (delay: number, mine?: boolean) => Promise<void>;
}

interface IncreaseTo {
  blocknumber: typeof mineUpTo;
  timestamp: (to: number, mine?: boolean) => Promise<void>;
}

interface Duration {
  [key: string]: (n: number) => bigint;
}

// const clock: Clock = {
//   blocknumber: () => viem.get.getBlockNumber().then(BigInt),
//   timestamp: () => viem.getBlockTimestamp().then(BigInt),
// };

// const clockFromReceipt: ClockFromReceipt = {
//   blocknumber: (receipt) => Promise.resolve(BigInt(receipt.blockNumber)),
//   timestamp: async (receipt) => {
//     const block = await publicClient.getBlockByNumber(receipt.blockNumber);
//     return BigInt(block.timestamp);
//   },
// };

// const increaseBy: IncreaseBy = {
//   blockNumber: mine,
//   timestamp: async (delay, mine = true) => {
//     const currentTimestamp = await viem.getBlockTimestamp();
//     await increaseTo.timestamp(Number(currentTimestamp) + delay, mine);
//   },
// };

const increaseTo: IncreaseTo = {
  blocknumber: mineUpTo,
  timestamp: async (to, mine = true) => {
    if (mine) {
      await time.increaseTo(to);
    } else {
      await time.setNextBlockTimestamp(to);
    }
  },
};


export { increaseTo };