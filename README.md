# 🎁 basedGift

A beautiful platform for sending digital gifts (USDC, ETH, and NFTs) on the Base network through unique shareable links.

## ✨ Features

- 🎨 **Beautiful Design** with animations and gradients
- 💰 **Send USDC & ETH** securely via smart contract escrow
- 🖼️ **Send NFTs** with ERC-721 support
- 🎭 **Rich Customization** with 50+ stickers, full color picker, and gradient backgrounds
- 🔗 **Simple UX** - just share a link
- ⛓️ **Base Network** - fast and cheap transactions
- 🔒 **Smart Contract Escrow** - funds are locked until claimed
- 🌐 **Multi-Network** - Base Mainnet and Base Sepolia testnet support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase)
- WalletConnect Project ID ([get one here](https://cloud.walletconnect.com/))
- Deployed GiftEscrow contract (see `contracts/GiftEscrow.sol`)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd basedGift
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Fill in the variables in `.env`:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=development
```

4. **Set up database**
```bash
npm run db:push
```

5. **Deploy the smart contract**

Follow instructions in `contracts/` to deploy the GiftEscrow contract, then update the contract address in `client/src/lib/wagmi.ts`.

6. **Run the application**
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Viem + Wagmi (Web3 integration)
- Framer Motion (animations)
- Tailwind CSS + Radix UI (UI components)

**Backend:**
- Express.js
- PostgreSQL + Drizzle ORM
- Vite (bundler)

**Blockchain:**
- Base (Ethereum Layer 2)
- USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia testnet support
- GiftEscrow contract for secure fund locking

## 📱 Usage

### Creating a Gift

1. Click "Start Gifting"
2. Connect your wallet
3. Select what to send (USDC, ETH, or NFT)
4. Customize the appearance:
   - Choose 2 colors for the gradient (full color picker with RGB support)
   - Add a sticker
   - Upload a background image
   - Write a message
5. Review and create the link
6. Share the link with the recipient

### Claiming a Gift

1. Open the gift link
2. Click on the gift box to reveal
3. Connect your wallet
4. Click "Claim to Wallet"
5. Confirm the transaction
6. Funds/NFT will be transferred to your wallet

## 🔐 Security Features

- ✅ **Smart Contract Escrow** - funds are locked until claimed
- ✅ **On-chain validation** - checks gift status before claiming
- ✅ **Race condition protection** - blockchain verification before database updates
- ✅ **Private keys** never leave the user's wallet
- ✅ **User confirmation** required for all transactions
- ✅ **Input validation** - amount and address verification
- ✅ `.env` files not committed to Git

## 🌐 Networks

### Base Mainnet
- Chain ID: `8453`
- RPC: `https://mainnet.base.org`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Base Sepolia (Testnet)
- Chain ID: `84532`
- RPC: `https://sepolia.base.org`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## 📚 Project Structure

```
basedGift/
├── client/                      # Frontend application
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── ColorPicker.tsx # Full RGB color picker
│   │   │   ├── HowItWorks.tsx  # Feature walkthrough
│   │   │   ├── NetworkSelector.tsx # Network switcher
│   │   │   └── ...
│   │   ├── hooks/              # React hooks
│   │   │   ├── use-wallet.ts   # Wallet connection
│   │   │   ├── use-usdc.ts     # USDC operations
│   │   │   ├── use-escrow.ts   # Escrow contract interaction
│   │   │   ├── use-nft.ts      # NFT operations
│   │   │   └── ...
│   │   ├── lib/                # Configuration
│   │   │   └── wagmi.ts        # Web3 config
│   │   ├── pages/              # Application pages
│   │   │   ├── Landing.tsx     # Homepage
│   │   │   ├── CreateGift.tsx  # Gift creation
│   │   │   ├── ClaimGift.tsx   # Gift claiming
│   │   │   └── ShareGift.tsx   # Share page
│   │   └── App.tsx
│   └── index.html
├── server/                      # Backend server
│   ├── db.ts                   # Database connection
│   ├── routes.ts               # API routes
│   └── index.ts                # Express server
├── shared/                      # Shared code
│   ├── schema.ts               # Database schema
│   └── routes.ts               # API types
├── contracts/                   # Smart contracts
│   └── src/
│       └── GiftEscrow.sol      # Main escrow contract
├── TESTNET_REMOVAL_GUIDE.md    # Guide for production deployment
└── package.json
```

## 🛠️ Commands

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Apply schema changes

# Type checking
npm run check        # TypeScript type checking
```

## 🔧 Configuration

### Switching Networks

The app supports both Base Mainnet and Base Sepolia. To switch:

**For Development (Testnet):**
- Set `TESTNET_MODE = true` in `client/src/lib/wagmi.ts`
- Users can select between Base and Base Sepolia

**For Production (Mainnet only):**
- Set `TESTNET_MODE = false` in `client/src/lib/wagmi.ts`
- See `TESTNET_REMOVAL_GUIDE.md` for detailed instructions

### NFT API Integration

To display user NFTs, integrate with:
- [Alchemy NFT API](https://www.alchemy.com/)
- [Moralis](https://moralis.io/)
- [SimpleHash](https://simplehash.com/)

Update `client/src/hooks/use-nft.ts` with your API key.

## 📝 License

MIT

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

If you have questions or issues, please create an issue in the repository.

## 🙏 Acknowledgments

Built with ❤️ on Base

---

**For deployment instructions, see:**
- `TESTNET_REMOVAL_GUIDE.md` - Switching to mainnet
- `contracts/` - Smart contract deployment
