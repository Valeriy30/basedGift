import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { USDC_ADDRESS, ERC20_ABI, BASE_CHAIN_ID } from '@/lib/wagmi';

// Хук для получения баланса USDC
export function useUSDCBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS[BASE_CHAIN_ID],
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: BASE_CHAIN_ID,
  });

  // USDC имеет 6 decimals
  const formattedBalance = balance ? formatUnits(balance as bigint, 6) : '0';

  return {
    balance: formattedBalance,
    rawBalance: balance as bigint | undefined,
    isLoading,
    refetch,
  };
}

// Хук для трансфера USDC
export function useTransferUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = async (to: string, amount: string) => {
    try {
      // USDC имеет 6 decimals
      const amountInWei = parseUnits(amount, 6);

      writeContract({
        address: USDC_ADDRESS[BASE_CHAIN_ID],
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, amountInWei],
        chainId: BASE_CHAIN_ID,
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

// Хук для approve USDC (если нужен для контракта эскроу)
export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (spender: string, amount: string) => {
    try {
      const amountInWei = parseUnits(amount, 6);

      writeContract({
        address: USDC_ADDRESS[BASE_CHAIN_ID],
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender as `0x${string}`, amountInWei],
        chainId: BASE_CHAIN_ID,
      });
    } catch (err) {
      console.error('Error approving USDC:', err);
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
