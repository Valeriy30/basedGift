import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Определяем, используем ли мы testnet или mainnet
const isProduction = import.meta.env.PROD;

// WalletConnect Project ID - замените на свой
// Получите на https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
  chains: isProduction ? [base] : [baseSepolia, base],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      metadata: {
        name: 'basedGift',
        description: 'Send crypto gifts on Base',
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.png`],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

// Base Chain ID
export const BASE_CHAIN_ID = isProduction ? base.id : baseSepolia.id;

// USDC Contract Addresses on Base
export const USDC_ADDRESS = {
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 
  [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', 
} as const;


export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;


export const ERC721_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
export const ESCROW_CONTRACT_ADDRESS = {
  [base.id]: '0xYourMainnetContractAddress',
  [baseSepolia.id]: '0x57459c4090cE40F4a0D1095FD05A87fAA2363b22',
} as const;

export const ESCROW_ABI = [
  {
    inputs: [
      { name: 'giftId', type: 'bytes32' },
      { name: 'usdcAddress', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'createUSDCGift',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'giftId', type: 'bytes32' }],
    name: 'claimGift',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
] as const;
