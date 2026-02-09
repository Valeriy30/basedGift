import { useSwitchChain, useChainId } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { TESTNET_MODE } from '@/lib/wagmi';

const NETWORKS = [
  { chain: base, name: 'Base', icon: '🔵', enabled: true },
  { chain: baseSepolia, name: 'Base Sepolia', icon: '🔷', enabled: TESTNET_MODE },
];

export function NetworkSelector() {
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const currentNetwork = NETWORKS.find((n) => n.chain.id === currentChainId) || NETWORKS[0];
  const availableNetworks = NETWORKS.filter((n) => n.enabled);

  const handleNetworkSwitch = (chainId: number) => {
    switchChain({ chainId });
  };

  if (availableNetworks.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
        <span className="text-lg">{currentNetwork.icon}</span>
        <span className="text-sm font-medium hidden sm:inline">{currentNetwork.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full border-2 border-primary/20 hover:border-primary/50">
          <span className="text-lg">{currentNetwork.icon}</span>
          <span className="font-medium hidden sm:inline">{currentNetwork.name}</span>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        {availableNetworks.map((network) => (
          <DropdownMenuItem
            key={network.chain.id}
            onClick={() => handleNetworkSwitch(network.chain.id)}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{network.icon}</span>
              <span>{network.name}</span>
            </div>
            {currentChainId === network.chain.id && <Check size={16} className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
