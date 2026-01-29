import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, stringToHex, padHex } from 'viem';
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, USDC_ADDRESS, BASE_CHAIN_ID } from '@/lib/wagmi';

export function useCreateUSDCGift() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createGift = async (giftId: string, amount: string) => {
    // Конвертируем giftId в bytes32
    const giftIdBytes = padHex(stringToHex(giftId), { size: 32 });
    const amountWei = parseUnits(amount, 6); // USDC имеет 6 decimals

    writeContractAsync({
      address: ESCROW_CONTRACT_ADDRESS[BASE_CHAIN_ID],
      abi: ESCROW_ABI,
      functionName: 'createUSDCGift',
      args: [giftIdBytes, USDC_ADDRESS[BASE_CHAIN_ID], amountWei],
      chainId: BASE_CHAIN_ID,
    });
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
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimGift = async (giftId: string) => {
    const giftIdBytes = padHex(stringToHex(giftId), { size: 32 });

    writeContractAsync({
      address: ESCROW_CONTRACT_ADDRESS[BASE_CHAIN_ID],
      abi: ESCROW_ABI,
      functionName: 'claimGift',
      args: [giftIdBytes],
      chainId: BASE_CHAIN_ID,
    });
  };

  return {
    claimGift,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}