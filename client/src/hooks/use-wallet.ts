import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// Simple mock wallet store using Zustand
export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      connect: async () => {
        // Simulate connection delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Generate a random mock address
        const mockAddress = `0x71C...${Math.random().toString(16).slice(2, 6)}`;
        set({ address: mockAddress, isConnected: true });
      },
      disconnect: () => set({ address: null, isConnected: false }),
    }),
    {
      name: 'wallet-storage',
    }
  )
);

export function useWallet() {
  // Hydration fix for Next.js/SSR environments (though we are SPA, good practice)
  const [mounted, setMounted] = useState(false);
  const store = useWalletStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return {
      address: null,
      isConnected: false,
      connect: async () => {},
      disconnect: () => {},
    };
  }

  return store;
}
