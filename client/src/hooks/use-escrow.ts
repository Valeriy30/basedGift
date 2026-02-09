import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseUnits, parseEther, stringToHex, padHex } from 'viem';
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, USDC_ADDRESS, ERC721_ABI, TARGET_CHAIN, config } from '@/lib/wagmi';
import { getPublicClient } from 'wagmi/actions';

// Convert a string giftId to bytes32
export function giftIdToBytes32(giftId: string): `0x${string}` {
  return padHex(stringToHex(giftId), { size: 32 });
}

/**
 * Helper: wait for a tx hash to be mined and check receipt status.
 * Returns the receipt so callers know the tx actually succeeded on-chain.
 */
async function waitForTx(txHash: `0x${string}`, chainId: number) {
  const client = getPublicClient(config, { chainId });
  if (!client) throw new Error('No public client for chain ' + chainId);

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    timeout: 120_000, // 2 min timeout — Base blocks are 2s
  });

  if (receipt.status === 'reverted') {
    throw new Error('Transaction reverted on-chain. Check gas limit or contract state.');
  }

  return receipt;
}

export function useCreateUSDCGift() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 12000,
  });

  const createGift = async (giftId: string, amount: string) => {
    const giftIdBytes = giftIdToBytes32(giftId);
    const amountWei = parseUnits(amount, 6);

    // NOTE: `capabilities` / paymasterService removed — writeContractAsync
    // does NOT support EIP-5792 capabilities. The field was silently ignored,
    // and could cause Coinbase Smart Wallet to behave unexpectedly.
    // If you need paymaster sponsorship, use `useSendCalls` from
    // wagmi/experimental or OnchainKit's <Transaction> component instead.
    const txHash = await writeContractAsync({
      address: ESCROW_CONTRACT_ADDRESS[chainId as keyof typeof ESCROW_CONTRACT_ADDRESS],
      abi: ESCROW_ABI,
      functionName: 'createUSDCGift',
      args: [giftIdBytes, USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS], amountWei],
      chainId,
      // Increased from 120k: createUSDCGift does safeTransferFrom (≈65k)
      // + new storage slot for Gift struct (≈45k) + event (≈2k) = ~112k.
      // 200k gives safe margin.
      gas: 200_000n,
    });

    console.log('[useCreateUSDCGift] tx sent:', txHash);

    // Wait for on-chain confirmation before returning
    await waitForTx(txHash, chainId);
    console.log('[useCreateUSDCGift] ✅ confirmed on-chain');

    return txHash;
  };

  return {
    createGift,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useCreateETHGift() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 12000,
  });

  const createGift = async (giftId: string, amount: string) => {
    const giftIdBytes = giftIdToBytes32(giftId);
    const amountWei = parseEther(amount);

    const txHash = await writeContractAsync({
      address: ESCROW_CONTRACT_ADDRESS[chainId as keyof typeof ESCROW_CONTRACT_ADDRESS],
      abi: ESCROW_ABI,
      functionName: 'createETHGift',
      args: [giftIdBytes],
      value: amountWei,
      chainId,
      gas: 150_000n,
    });

    console.log('[useCreateETHGift] tx sent:', txHash);
    await waitForTx(txHash, chainId);
    console.log('[useCreateETHGift] ✅ confirmed on-chain');

    return txHash;
  };

  return {
    createGift,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Approve escrow contract to transfer a specific NFT token.
 * Must be called before createNFTGift.
 */
export function useApproveNFT() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 12000,
  });

  const approveNFT = async (nftContractAddress: string, tokenId: string) => {
    const escrow = ESCROW_CONTRACT_ADDRESS[chainId as keyof typeof ESCROW_CONTRACT_ADDRESS];

    console.log('[useApproveNFT] Approving tokenId', tokenId, 'to escrow', escrow);

    const txHash = await writeContractAsync({
      address: nftContractAddress as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'approve',
      args: [escrow, BigInt(tokenId)],
      chainId,
      gas: 100_000n,
    });

    console.log('[useApproveNFT] tx sent:', txHash);
    await waitForTx(txHash, chainId);
    console.log('[useApproveNFT] ✅ NFT approved');
    return txHash;
  };

  return {
    approveNFT,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Create an NFT gift on the escrow contract.
 * The NFT must be approved to the escrow first (useApproveNFT).
 */
export function useCreateNFTGift() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 12000,
  });

  const createGift = async (giftId: string, nftContractAddress: string, tokenId: string) => {
    const giftIdBytes = giftIdToBytes32(giftId);

    console.log('[useCreateNFTGift] Creating NFT gift:', { giftId, nftContractAddress, tokenId });

    const txHash = await writeContractAsync({
      address: ESCROW_CONTRACT_ADDRESS[chainId as keyof typeof ESCROW_CONTRACT_ADDRESS],
      abi: ESCROW_ABI,
      functionName: 'createNFTGift',
      args: [giftIdBytes, nftContractAddress as `0x${string}`, BigInt(tokenId)],
      chainId,
      gas: 250_000n, // NFT transfer + storage is expensive
    });

    console.log('[useCreateNFTGift] tx sent:', txHash);
    await waitForTx(txHash, chainId);
    console.log('[useCreateNFTGift] ✅ NFT gift created on-chain');

    return txHash;
  };

  return {
    createGift,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useClaimGift() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 12000,
  });

  const claimGift = async (giftId: string, targetChainId?: number) => {
    const giftIdBytes = giftIdToBytes32(giftId);
    const useChain = targetChainId || chainId;

    console.log('[useClaimGift] Starting claim for giftId:', giftId, 'on chain:', useChain);

    try {
      // FIX #4: Add gas limit to avoid estimation errors
      // Gas estimation can fail if:
      // - Gift already claimed
      // - Gift doesn't exist
      // - Wrong network
      // Using a fixed gas limit bypasses estimation
      const txHash = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS[useChain as keyof typeof ESCROW_CONTRACT_ADDRESS],
        abi: ESCROW_ABI,
        functionName: 'claimGift',
        args: [giftIdBytes],
        chainId: useChain,
        gas: BigInt(200000), // Fixed gas limit - bypasses estimation
      });

      console.log('[useClaimGift] tx sent:', txHash);

      // Wait for on-chain confirmation — without this, the tx could revert
      // silently and the UI would still show "success".
      await waitForTx(txHash, useChain);
      console.log('[useClaimGift] ✅ Claim confirmed on-chain');

      return txHash;
    } catch (err: any) {
      console.error('[useClaimGift] Error:', err);
      
      // Provide better error messages
      const message = err?.shortMessage || err?.message || '';
      if (message.includes('already claimed')) {
        throw new Error('This gift has already been claimed');
      } else if (message.includes('does not exist')) {
        throw new Error('Gift not found on this network');
      } else if (message.includes('user rejected') || message.includes('User rejected')) {
        throw new Error('Transaction cancelled');
      }
      
      throw err;
    }
  };

  return {
    claimGift,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Read on-chain gift info.
 * @param giftId - the short nanoid string
 * @param targetChainId - (optional) force reading from a specific chain
 *                        instead of the user's currently connected chain.
 *                        Critical for ClaimGift page — we must read from the
 *                        chain where the gift was created, not the user's chain.
 */
export function useGiftInfo(giftId: string | undefined, targetChainId?: number) {
  const connectedChainId = useChainId();
  const chainId = targetChainId || connectedChainId;
  
  const giftIdBytes = giftId ? giftIdToBytes32(giftId) : undefined;

  const { data, isLoading, error, refetch } = useReadContract({
    address: giftIdBytes ? ESCROW_CONTRACT_ADDRESS[chainId as keyof typeof ESCROW_CONTRACT_ADDRESS] : undefined,
    abi: ESCROW_ABI,
    functionName: 'getGiftInfo',
    args: giftIdBytes ? [giftIdBytes] : undefined,
    chainId,
    query: {
      enabled: !!giftIdBytes,
      staleTime: 30_000, // 30 seconds — reduced from 10s to lower RPC load
      refetchOnWindowFocus: false,
      refetchInterval: 30_000, // 30 seconds — reduced from 5s to prevent rate limiting
    }
  });

  // New return shape: [sender, tokenAddress, amountOrTokenId, isNFT, claimed, refunded, createdAt]
  return {
    giftInfo: data as [string, string, bigint, boolean, boolean, boolean, bigint] | undefined,
    isLoading,
    error,
    refetch,
  };
}
