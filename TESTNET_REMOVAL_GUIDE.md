# Testnet Removal Guide

This guide explains how to remove Base Sepolia testnet support and switch to Base Mainnet only.

## Prerequisites

Before proceeding, ensure you have:
- ✅ Thoroughly tested all functionality on Base Sepolia
- ✅ Deployed your GiftEscrow contract to Base Mainnet
- ✅ Updated the mainnet contract address in your configuration

## Step-by-Step Instructions

### 1. Update Smart Contract Address

**File:** `client/src/lib/wagmi.ts`

Replace the mainnet contract address:

```typescript
export const ESCROW_CONTRACT_ADDRESS = {
  [base.id]: '0xYourActualMainnetContractAddress', // ← Update this
  [baseSepolia.id]: '0x57459c4090cE40F4a0D1095FD05A87fAA2363b22',
} as const;
```

### 2. Disable Testnet Mode

**File:** `client/src/lib/wagmi.ts`

Change `TESTNET_MODE` to `false`:

```typescript
// BEFORE
export const TESTNET_MODE = true;

// AFTER
export const TESTNET_MODE = false;
```

### 3. Update Wagmi Configuration (Optional Cleanup)

**File:** `client/src/lib/wagmi.ts`

After setting `TESTNET_MODE = false`, you can optionally remove Base Sepolia references entirely:

**BEFORE:**
```typescript
export const config = createConfig({
  chains: TESTNET_MODE ? [baseSepolia, base] : [base],
  // ...
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

export const SUPPORTED_CHAINS = TESTNET_MODE 
  ? [base, baseSepolia] 
  : [base];
```

**AFTER:**
```typescript
export const config = createConfig({
  chains: [base],
  // ...
  transports: {
    [base.id]: http(),
  },
});

export const SUPPORTED_CHAINS = [base];
```

### 4. Remove Base Sepolia Import (Optional)

**File:** `client/src/lib/wagmi.ts`

If you cleaned up step 3, you can also remove the import:

```typescript
// BEFORE
import { base, baseSepolia } from 'wagmi/chains';

// AFTER
import { base } from 'wagmi/chains';
```

### 5. Update Network Selector Component (Optional)

**File:** `client/src/components/NetworkSelector.tsx`

The network selector will automatically hide when only Base Mainnet is available. No changes needed unless you want to remove Base Sepolia references entirely.

### 6. Remove Contract Address Keys (Optional Deep Clean)

If you want to completely remove Base Sepolia:

**Files to update:**
- `client/src/lib/wagmi.ts` - Remove `[baseSepolia.id]` keys from:
  - `USDC_ADDRESS`
  - `ESCROW_CONTRACT_ADDRESS`

### 7. Testing Checklist

After making changes, verify:

- [ ] Users can only connect to Base Mainnet
- [ ] Contract address is correct for Base Mainnet
- [ ] USDC address is correct for Base Mainnet (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- [ ] Network selector shows only Base (or is hidden)
- [ ] All gift creation flows work
- [ ] All gift claiming flows work
- [ ] Database saves correctly

## Minimal Change Approach

If you want the **simplest** transition with **minimal code changes**:

**Just change these 2 things:**

1. Set `TESTNET_MODE = false` in `client/src/lib/wagmi.ts`
2. Update mainnet contract address in `ESCROW_CONTRACT_ADDRESS`

Everything else will work automatically!

## Rollback Plan

If you need to revert to testnet:

1. Set `TESTNET_MODE = true` in `client/src/lib/wagmi.ts`
2. Restart your development server

## Environment Variables

**Optional:** You can make this configurable via environment variables:

**File:** `client/src/lib/wagmi.ts`

```typescript
export const TESTNET_MODE = import.meta.env.VITE_ENABLE_TESTNET === 'true';
```

**File:** `.env` or `.env.production`

```
VITE_ENABLE_TESTNET=false
```

This allows you to:
- Keep testnet enabled in development
- Disable it in production builds
- Switch easily without code changes

## Questions?

If you encounter issues:
1. Clear browser cache and localStorage
2. Disconnect and reconnect wallet
3. Check that users are on Base Mainnet network
4. Verify contract addresses are correct

---

**Last Updated:** 2026-01-29
**Version:** 1.0
