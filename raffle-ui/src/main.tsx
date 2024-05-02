import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' 
import { defineChain } from 'viem';
import { Toaster } from 'react-hot-toast';
import { localhost } from 'viem/chains';
import { sepolia } from 'viem/chains';

export const config = createConfig({
  // chains: [sepolia],
  chains: [localhost],
  transports: {
    // [mainnet.id]: http('http://127.0.0.1:8545/'),
    // [sepolia.id]: http(),
    [localhost.id]: http(),
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
