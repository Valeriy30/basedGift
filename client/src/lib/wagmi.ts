import { createConfig, fallback, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

export const TESTNET_MODE = true;

const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;
const CDP_API_KEY = import.meta.env.VITE_CDP_API_KEY;

// Default chain (used by OnchainKitProvider and AutoChainSwitch on first connect)
export const TARGET_CHAIN = TESTNET_MODE ? baseSepolia : base;

export const config = createConfig({
  chains: TESTNET_MODE ? [baseSepolia, base] : [base],
  connectors: [
    coinbaseWallet({
      appName: 'basedGift',
      appLogoUrl: typeof window !== 'undefined'
        ? `${window.location.origin}/favicon.png`
        : '',
      // 'all' — supports both Coinbase Wallet extension and Smart Wallet.
      // Inside Base App it auto-uses the native account;
      // in a regular browser it connects via the Coinbase Wallet extension.
      preference: 'all',
    }),
  ],
  transports: {
    [base.id]: fallback([
      http(CDP_API_KEY ? `https://api.developer.coinbase.com/rpc/v1/base/${CDP_API_KEY}` : 'https://mainnet.base.org'),
      http(import.meta.env.VITE_ALCHEMY_MAINNET_URL || 'https://mainnet.base.org'),
    ]),
    [baseSepolia.id]: fallback([
      http(CDP_API_KEY ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${CDP_API_KEY}` : 'https://sepolia.base.org'),
      http(`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
      http('https://sepolia.base.org'),
    ]),
  },
});

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
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
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

// Escrow Contract Addresses
export const ESCROW_CONTRACT_ADDRESS = {
  [base.id]: '0x2856EEC9898e66684928ADe2f42F178210BB9449',
  [baseSepolia.id]: '0x9636A9c4bD8295071d063E82433E3d021D49D05d',
} as const;

// Updated ABI — includes refundExpiredGift + refunded field in getGiftInfo
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
    name: 'createETHGift',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'giftId', type: 'bytes32' },
      { name: 'nftAddress', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'createNFTGift',
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
  {
    inputs: [{ name: 'giftId', type: 'bytes32' }],
    name: 'refundGift',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'giftId', type: 'bytes32' }],
    name: 'refundExpiredGift',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'GIFT_EXPIRY',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'giftId', type: 'bytes32' }],
    name: 'getGiftInfo',
    outputs: [
      { name: 'sender', type: 'address' },
      { name: 'tokenAddress', type: 'address' },
      { name: 'amountOrTokenId', type: 'uint256' },
      { name: 'isNFT', type: 'bool' },
      { name: 'claimed', type: 'bool' },
      { name: 'refunded', type: 'bool' },
      { name: 'createdAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'giftId', type: 'bytes32' },
      { indexed: true, name: 'sender', type: 'address' },
      { indexed: false, name: 'tokenAddress', type: 'address' },
      { indexed: false, name: 'amountOrTokenId', type: 'uint256' },
      { indexed: false, name: 'isNFT', type: 'bool' },
    ],
    name: 'GiftCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'giftId', type: 'bytes32' },
      { indexed: true, name: 'recipient', type: 'address' },
    ],
    name: 'GiftClaimed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'giftId', type: 'bytes32' },
      { indexed: true, name: 'sender', type: 'address' },
    ],
    name: 'GiftRefunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'giftId', type: 'bytes32' },
    ],
    name: 'GiftExpired',
    type: 'event',
  },
] as const;

// Helper: truncate address
export const truncateAddress = (address: string | undefined): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper: truncate long NFT names
export const truncateNFTName = (name: string | undefined, maxLength: number = 20): string => {
  if (!name) return 'Unnamed NFT';
  if (name.startsWith('0x') && name.length > 10) {
    return `${name.slice(0, 6)}...${name.slice(-4)}`;
  }
  if (name.length <= maxLength) return name;
  // Keep first part + ... + last 4 chars
  const firstPart = maxLength - 4;
  return `${name.slice(0, firstPart)}…${name.slice(-4)}`;
};

// Helper: get chain name
export const getChainName = (chainId: number): string => {
  if (chainId === base.id) return 'Base';
  if (chainId === baseSepolia.id) return 'Base Sepolia';
  return 'Unknown';
};

// Helper: get chain icon
export const getChainIcon = (chainId: number): string => {
  if (chainId === base.id) return '🔵';
  if (chainId === baseSepolia.id) return '🔷';
  return '🔵';
};
