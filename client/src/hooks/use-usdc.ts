import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { USDC_ADDRESS, ERC20_ABI } from '@/lib/wagmi';
import { useMemo } from 'react';

// Hook to get USDC balance
export function useUSDCBalance() {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS],
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: {
      staleTime: 15_000,
      enabled: !!address,
    },
  });

  // USDC has 6 decimals
  const formattedBalance = useMemo(() => 
    balance ? formatUnits(balance as bigint, 6) : '0',
    [balance]
  );

  return useMemo(() => ({
    balance: formattedBalance,
    rawBalance: balance as bigint | undefined,
    isLoading,
    refetch,
  }), [formattedBalance, balance, isLoading, refetch]);
}

// Hook for USDC transfer
export function useTransferUSDC() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 12000,
  });

  const transfer = async (to: string, amount: string) => {
    try {
      const amountInWei = parseUnits(amount, 6);

      await writeContractAsync({
        address: USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS],
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, amountInWei],
        chainId,
      });
    } catch (err) {
      console.error('Error transferring USDC:', err);
      throw err;
    }
  };

  return {
    transfer,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Hook for approving USDC (needed for escrow contract)
export function useApproveUSDC() {
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    pollingInterval: 12000,
  });

  const approve = async (spender: string, amount: string) => {
    try {
      console.log('[useApproveUSDC] Starting approve for', amount, 'USDC to', spender);
      const amountInWei = parseUnits(amount, 6);

      const txHash = await writeContractAsync({
        address: USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS],
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amountInWei],
        chainId,
        gas: 80_000n,
      });

      console.log('[useApproveUSDC] Approve tx sent:', txHash);

      // Wait for on-chain confirmation before returning.
      // createUSDCGift will call safeTransferFrom which needs the allowance on-chain.
      const { getPublicClient } = await import('wagmi/actions');
      const { config } = await import('@/lib/wagmi');
      const publicClient = getPublicClient(config, { chainId });

      if (publicClient && typeof txHash === 'string') {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
          confirmations: 1,
          timeout: 120_000,
        });

        if (receipt.status === 'reverted') {
          throw new Error('Approve transaction reverted on-chain');
        }

        console.log('[useApproveUSDC] ✅ Approve confirmed on-chain');
      }

      return txHash;
    } catch (err) {
      console.error('[useApproveUSDC] Error:', err);
      throw err;
    }
  };

  return {
    approve,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}
