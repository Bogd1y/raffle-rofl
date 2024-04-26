import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' 
import { defineChain } from 'viem';
import { Toaster } from 'react-hot-toast';

export const mainnet = /*#__PURE__*/ defineChain({
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/api',
    },
  },
  contracts: {
    ensRegistry: {
      address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    },
    ensUniversalResolver: {
      address: '0xce01f8eee7E479C928F8919abD53E553a36CeF67',
      blockCreated: 19_258_213,
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 14_353_601,
    },
  },
})


export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http('http://127.0.0.1:8545/'),
    // [sepolia.id]: http('http://127.0.0.1:8545/'),
  },
  // connectors: [
  //   injected({target: 'metaMask'})
  // ],
})

const queryClient = new QueryClient() 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}> 
    <QueryClientProvider client={queryClient}> 
    <Toaster
      toastOptions={{
        style: {color: "#F6B17A", background: "#2D3250", borderRadius: "16px", border: "1px solid #F6B17A", padding: "4px", fontSize: "16px"}
      }}
      position="top-center"
    />
        <App />
    </QueryClientProvider>
    </WagmiProvider> 
  </React.StrictMode>,
)
