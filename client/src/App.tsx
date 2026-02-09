import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { config, TARGET_CHAIN } from '@/lib/wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnchainKitProvider } from '@coinbase/onchainkit';
import Landing from "@/pages/Landing";
import CreateGift from "@/pages/CreateGift";
import ShareGift from "@/pages/ShareGift";
import ClaimGift from "@/pages/ClaimGift";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/create" component={CreateGift} />
      <Route path="/share/:id" component={ShareGift} />
      <Route path="/claim/:id" component={ClaimGift} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * On first connect, if the wallet is on a chain NOT in our config
 * (e.g. Ethereum mainnet, chain 1), auto-switch to TARGET_CHAIN.
 *
 * Does NOT fire when the user manually switches between Base ↔ Base Sepolia
 * via the NetworkSelector — only when the wallet is on an unsupported chain.
 */
function AutoChainSwitch() {
  const { chainId: walletChainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const supportedIds: Set<number> = new Set([base.id, baseSepolia.id]);

  useEffect(() => {
    if (isConnected && walletChainId && !supportedIds.has(walletChainId)) {
      console.log(
        `[AutoChainSwitch] Wallet on unsupported chain ${walletChainId}, switching to ${TARGET_CHAIN.id}`,
      );
      switchChain({ chainId: TARGET_CHAIN.id });
    }
  }, [isConnected, walletChainId, switchChain]);

  return null;
}

function App() {
  const CDP_API_KEY = import.meta.env.VITE_CDP_API_KEY;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={CDP_API_KEY}
          chain={TARGET_CHAIN}
          config={{
            appearance: {
              mode: 'light',
              theme: 'default',
            },
          }}
        >
          <TooltipProvider>
            <AutoChainSwitch />
            <Toaster />
            <Router />
          </TooltipProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
