import { useEffect, useState } from 'react'
import { abi } from './abi/Raffle'
import { Connector, useAccount, useConnect, useReadContract } from 'wagmi';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'

import { ERC20_ABI } from './abi/IERC'
import { config } from './main'
import toast from 'react-hot-toast'


export const raffleAddress = '0xf93b0549cD50c849D792f0eAE94A598fA77C7718'

function App() {
  const [inputValue, setInputValue] = useState<`0x${string}`>('0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9');
  const [amountValue, setAmountValue] = useState<string>('');
  const [tokenAddress, setTokenAddress] = useState<`0x${string}`>("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") //!weth 
  const { address } = useAccount()
  const { connectors, connect } = useConnect()

  const potValue = useReadContract({
    abi,
    address: raffleAddress,
    functionName: 'potTotalValue'
  })

  const handleDep = async () => {

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
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [raffleAddress, BigInt(amountValue)],
    })

    const {status} = await waitForTransactionReceipt(config, {hash: approveHash})
    
    if (status == 'reverted') return toast.error("TOKEN APPROVE IS REVERTED")

    const depHash = await writeContract(config, {
      address: raffleAddress,
      abi,
      functionName: 'dep',
      args: [inputValue, BigInt(amountValue)],
    })
    
    const {status: depStatus} = await waitForTransactionReceipt(config, {hash: depHash})

    if (depStatus == 'reverted') return toast.error("DEP IS REVERTED")

    toast.success("DEP IS DONE, keep gambling")
  }
  const handleConnect = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    console.log("CONTECTIGN");
    
    e.preventDefault();
    if (inputValue.length != 42 ) return toast('Your input seems not to be 42 length')
    if (!address) return toast('NO adress - no dep')

  }
  const handleWin = async () => {

    const isTime = await readContract(config, {
      abi,
      address: raffleAddress,
      functionName: 'checkUpkeep',
      args: [raffleAddress]
    })

    if (isTime[0]) return toast('time hasn`t pass yet')

    const winHash = await writeContract(config, {
      address: raffleAddress,
      abi,
      functionName: 'dep',
      args: [inputValue, BigInt(amountValue)],
    })
    
    const {status: winStatus} = await waitForTransactionReceipt(config, {hash: winHash})

    if (!winStatus) return toast('Could end vote(')

    toast.success("ALL RIGHT")
  }

  return (
    <div style={{height: "100vh", width: '100vw', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: "center", alignItems: 'center', background: '#424769'}}>
      <div style={{color: "#F6B17A", background: "#2D3250", borderRadius: "16px", border: "1px solid #F6B17A", padding: "36px", fontSize: "36px"}}>
        POT: {Number(potValue.data) || 0}
      </div>
      <div style={{display: 'flex', gap: "12px"}}>
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
        <button onClick={(e) => handleConnect(e)} style={{color: "#F6B17A", background: "#2D3250", borderRadius: "0 0 8px 8px", cursor: "pointer", border: "1px solid #F6B17A", padding: "8px 16px"}}>Conect to token</button>
      </form>
      {!address && connectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={() => connect({ connector })}
        />
      ))}
      {/* <div style={{display: "flex", alignItems: "center", gap: "8px", color: "#F6B17A", background: "#2D3250", borderRadius: "8px", padding: "8px", border: "1px solid #F6B17A"}}>
        Status: {isPending ? "PENDING" : isLoading ? "LOADING" : isSuccess ? "SUCCESS" : isError ? "ERROR" : "NO"} 
      </div> */}
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