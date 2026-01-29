import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { USDC_ADDRESS, BASE_CHAIN_ID } from '@/lib/wagmi';

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Получаем баланс ETH
  const { data: ethBalance } = useBalance({
    address,
    chainId: BASE_CHAIN_ID,
  });

  // Получаем баланс USDC
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS[BASE_CHAIN_ID],
    chainId: BASE_CHAIN_ID,
  });

  // Функция для подключения кошелька
  const connectWallet = async () => {
    try {
      // Пробуем подключиться через injected connector (MetaMask, Coinbase Wallet и т.д.)
      const injectedConnector = connectors.find((c) => c.id === 'injected');
      if (injectedConnector) {
        connect({ connector: injectedConnector, chainId: BASE_CHAIN_ID });
      } else if (connectors[0]) {
        // Если нет injected, используем первый доступный (обычно WalletConnect)
        connect({ connector: connectors[0], chainId: BASE_CHAIN_ID });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return {
    address,
    isConnected,
    connect: connectWallet,
    disconnect,
    chain,
    ethBalance,
    usdcBalance,
  };
}
