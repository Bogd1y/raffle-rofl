import { useEffect, useState } from 'react'
import { abi } from './abi/Raffle'
import { Connector, useAccount, useConnect, useContractWrite, useDisconnect, usePublicClient, useReadContract } from 'wagmi';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'

import { ERC20_ABI } from './abi/IERC'
import { config } from './main'
import toast from 'react-hot-toast'
import { simulateContract } from 'viem/actions';


// export const raffleAddress = '0x3bD80E74f4AB1c322FEB6B6D743CCE06EEB41291' // wokring sepolia 
export const raffleAddress = '0xf5A69e69a7D4f05FF41642d29f4795d5F7e3b1b2' //  


function App() {
  const [inputValue, setInputValue] = useState<`0x${string}`>('0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'); //! WETH Sepolia
  const [amountValue, setAmountValue] = useState<string>('');
  const { address } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync } = useContractWrite()
  const publicClient = usePublicClient()

  // const potValue = useReadContract({
  //   abi,
  //   address: raffleAddress,
  //   functionName: 'potTotalValue'
  // })

  const potValue = useReadContract({
    abi: ERC20_ABI,
    address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // usdc
    functionName: 'balanceOf',
    args: [raffleAddress]
  })
  // console.log(potBal.data);
  
  const handleApprove = async () => {

    //* checking if there is account
    if (!amountValue) return toast("DEP 0  🙉")

    //* checking if there is account
    if (!address) return toast("CONNECT YOUR WALLET FIRST 🙉")

    //* checking if token is valid
    const isTokenWhiteListed = await readContract(config, {
      abi,
      address: raffleAddress,
      functionName: 'isAddressWhiteListed',
      args: [inputValue]
    })

    if (!isTokenWhiteListed) return toast.error("TOKEN IS NOT ALLOWED")

    //* making allowance for raffle to use user tokens
    const approveHash = await writeContract(config, {
      address: inputValue,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [raffleAddress, BigInt(amountValue)],
    })

    const {status} = await waitForTransactionReceipt(config, {hash: approveHash})
    
    if (status == 'reverted') return toast.error("TOKEN APPROVE IS REVERTED")

    return toast.success("TOKEN APPROVE IS DONE")
  }

  const handleDep = async () => {
    if (!address) return toast("CONNECT YOUR WALLET FIRST 🙉")

    const depHash = await writeContract(config, {
      address: raffleAddress,
      abi,
      functionName: 'dep',
      args: ["0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", BigInt(amountValue)],
    })
    
    const {status: depStatus, logs} = await waitForTransactionReceipt(config, {hash: depHash})    

    if (depStatus == 'reverted') return toast.error("DEP IS REVERTED")
    

    toast.success("DEP IS DONE, keep gambling")

  }
  const swapEth = async () => {
    if (!address) return toast("CONNECT YOUR WALLET FIRST 🙉")

    const balancePre = await readContract(config, {
      abi: ERC20_ABI,
      address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
      functionName: 'balanceOf',
      args: [address]
    })

    console.log(balancePre)

 //* making ETH to WETH
    const depWethHash = await writeContract(config, {
      address: inputValue,
      abi: ERC20_ABI,
      functionName: 'deposit',
      value: BigInt(amountValue)
    })
    await waitForTransactionReceipt(config, {hash: depWethHash})

    const balance = await readContract(config, {
      abi: ERC20_ABI,
      address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
      functionName: 'balanceOf',
      args: [address]
    })

    console.log(balance)
  }
  const handleConnect = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    console.log("CONTECTIGN");
    
    e.preventDefault();
    if (inputValue.length != 42 ) return toast('Your input seems not to be 42 length')

    //* checking if token is valid
    const isTokenWhiteListed = await readContract(config, {
      abi,
      address: raffleAddress,
      functionName: 'isAddressWhiteListed',
      args: [inputValue]
    })
    if (!isTokenWhiteListed) return toast.error("TOKEN IS NOT")
    toast.success("Go dep ")
  }
  const handleWin = async () => {

    const isTime = await readContract(config, {
      abi,
      address: raffleAddress,
      functionName: 'checkUpkeep',
      args: [raffleAddress]
    })

    if (!isTime[0]) return toast('time hasn`t pass yet')

    const winHash = await writeContract(config, {
      address: raffleAddress,
      abi,
      functionName: 'requestRandomWords',
    })
    
    const {status: winStatus} = await waitForTransactionReceipt(config, {hash: winHash})

    if (!winStatus) return toast('couldn`t end vote(')

    toast.success("ALL RIGHT")
  }
  const handleStartProposal = async () => {
    const rest = await writeContract(config, {
      abi,
      address: raffleAddress,
      functionName: 'propose',
      args: [[raffleAddress, raffleAddress, raffleAddress], [BigInt(1), BigInt(2), BigInt(3)], [raffleAddress, raffleAddress, raffleAddress], "POVNA TEST"  ]
    })
  }
  
  const handleVote = async () => {

  }

  const handleExecute = async () => {

  }

  return (
    <div style={{height: "100vh", width: '100vw', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: "center", alignItems: 'center', background: '#424769'}}>
      <div style={{color: "#F6B17A", background: "#2D3250", borderRadius: "16px", border: "1px solid #F6B17A", padding: "36px", fontSize: "36px"}}>
        POT: {Number(potValue.data) / 1000000 || 0} USDC  
      </div>
      <div style={{display: 'flex', gap: "12px"}}>
        <button onClick={handleApprove} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>
          Approve
        </button>
        <button onClick={swapEth} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>
          Swap eth/weth
        </button>
        <button onClick={handleDep} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>
          DEP 
        </button>
        <input style={{color: "#F6B17A", background: "#2D3250", cursor: "pointer", borderRadius: "8px", border: "1px solid #F6B17A", padding: "8px 16px"}} type="number" placeholder='Amount' name="" id="" value={amountValue} onChange={(e) => setAmountValue(e.target.value)} />
        <button onClick={handleWin} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>
          WIN
        </button>
      </div>
      <form style={{display: 'flex', flexDirection: "column"}}>
        <input style={{color: "#F6B17A", background: "#2D3250", borderRadius: "8px 8px 0 0", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}} type="text" placeholder='0x0' name="" id="" value={inputValue} onChange={(e) => setInputValue(e.target.value as `0x${string}`)} />
        <button onClick={(e) => handleConnect(e)} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "0 0 8px 8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>Check token</button>
      </form>
      {!address ? connectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={() => connect({ connector })}
        />
      )): <div onClick={() => disconnect()} style={{color: "#F6B17A", background: "#2D3250", cursor: "pointer", borderRadius: "8px", border: "1px solid #F6B17A", padding: "8px 16px"}}>
          disconnect
        </div>}
      {/* <div style={{display: "flex", alignItems: "center", gap: "8px", color: "#F6B17A", background: "#2D3250", borderRadius: "8px", padding: "8px", border: "1px solid #F6B17A"}}>
        Status: {isPending ? "PENDING" : isLoading ? "LOADING" : isSuccess ? "SUCCESS" : isError ? "ERROR" : "NO"} 
      </div> */}
      <div style={{marginTop: "70px", display: "flex", gap: "10px"}}>
        <button onClick={handleStartProposal} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>
          Start Proposal
        </button>
        <button onClick={handleVote} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>
          Vote
        </button>
        <button onClick={handleExecute} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>
          Execute Proposal
        </button>
      </div>
    </div>
  )
}

export default App

function WalletOption({
  connector,
  onClick,
}: {
  connector: Connector
  onClick: () => void
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <button style={{display: "flex", alignItems: "center", gap: "8px", color: "#F6B17A", background: "#2D3250", borderRadius: "8px", padding: "8px", cursor: "pointer", border: "1px solid #F6B17A"}} disabled={!ready} onClick={onClick}>
      <img src={connector?.icon} alt="METAMASKA" />
      {connector.name}
    </button>
  )
}