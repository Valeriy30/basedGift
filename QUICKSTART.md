# 🚀 Quick Start Guide

Get basedGift running in 5 minutes!

## Prerequisites

- Node.js 18+
- A wallet (MetaMask, Coinbase Wallet, etc.)
- WalletConnect Project ID ([get free here](https://cloud.walletconnect.com/))

## Step 1: Installation

```bash
# Clone and install
npm install

# Create environment file
cp .env.example .env
```

## Step 2: Configure .env

Edit `.env` and add:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Step 3: Database Setup

### Option A: Quick SQLite (Development)

For local development, use SQLite:

```bash
npm run db:push
```

### Option B: PostgreSQL/Supabase (Production)

1. Create a database on [Supabase](https://supabase.com/)
2. Copy the connection string to `.env`
3. Run migrations:

```bash
npm run db:push
```

## Step 4: Deploy Smart Contract

**Important:** You need to deploy the GiftEscrow contract before the app will work.

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Deploy to Base Sepolia (testnet):
```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url https://sepolia.base.org --broadcast --verify
```

3. Copy the contract address and update `client/src/lib/wagmi.ts`:
```typescript
export const ESCROW_CONTRACT_ADDRESS = {
  [base.id]: '0xYourMainnetAddress',
  [baseSepolia.id]: '0xYourTestnetAddress', // ← Paste here
} as const;
```

## Step 5: Run the App

```bash
npm run dev
```

Open http://localhost:5000

## Step 6: Test with Testnet Tokens

1. **Get Base Sepolia ETH**
   - Visit https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Connect wallet and claim testnet ETH

2. **Get Base Sepolia USDC**
   - Swap some ETH for USDC on [Uniswap](https://app.uniswap.org/swap)
   - Switch to Base Sepolia network
   - Use USDC address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Testing the App

### Create a Gift
1. Click "Start Gifting"
2. Connect wallet (switch to Base Sepolia)
3. Choose USDC or ETH
4. Enter amount (e.g., 1 USDC)
5. Customize with colors and stickers
6. Create gift link

### Claim the Gift
1. Copy the gift link
2. Open in incognito/different browser
3. Connect a different wallet
4. Click to reveal gift
5. Claim to wallet

## Troubleshooting

### "Transaction Failed"
- Make sure you're on Base Sepolia network
- Check you have enough ETH for gas
- Ensure you approved USDC before creating gift

### "Gift not found"
- Check the link is correct
- Make sure the gift was created successfully
- Check database connection

### "Wallet not connecting"
- Try a different browser
- Clear browser cache
- Update your wallet extension

## Next Steps

- ✅ Test creating and claiming gifts
- ✅ Customize colors and messages
- 📖 Read [README.md](./README.md) for full documentation
- 🚀 Deploy to mainnet using [TESTNET_REMOVAL_GUIDE.md](./TESTNET_REMOVAL_GUIDE.md)

## Need Help?

- Check [README.md](./README.md) for detailed docs
- Review smart contract in `contracts/src/GiftEscrow.sol`
- Create an issue on GitHub

---

**Ready?** Run `npm run dev` and start gifting! 🎁
