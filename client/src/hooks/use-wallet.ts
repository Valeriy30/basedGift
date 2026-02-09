import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';
import { USDC_ADDRESS } from '@/lib/wagmi';
import { useMemo, useCallback } from 'react';

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const { data: ethBalance, refetch: refetchEth } = useBalance({
    address,
    chainId,
    query: {
      enabled: !!address,
      staleTime: 15_000,
    },
  });

  const { data: usdcBalance, refetch: refetchUsdc } = useBalance({
    address,
    token: USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS],
    chainId,
    query: {
      enabled: !!address,
      staleTime: 15_000,
    },
  });

  // Connect via the first available connector (coinbaseWallet).
  const connectWallet = useCallback(() => {
    if (isConnecting) reset();

    const connector = connectors[0];
    if (connector) {
      connect(
        { connector },
        {
          onError: (err) => {
            console.error('[useWallet] Connection failed:', err);
            reset();
          },
        },
      );
    }
  }, [connectors, connect, isConnecting, reset]);

  // Force-refresh both ETH + USDC balances (call after gift creation/claim)
  const refetchBalances = useCallback(() => {
    refetchEth();
    refetchUsdc();
  }, [refetchEth, refetchUsdc]);

  return useMemo(() => ({
    address,
    isConnected,
    isConnecting,
    connect: connectWallet,
    disconnect,
    chain,
    ethBalance,
    usdcBalance,
    refetchBalances,
  }), [address, isConnected, isConnecting, connectWallet, disconnect, chain, ethBalance, usdcBalance, refetchBalances]);
}
