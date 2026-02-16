import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAccount, useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

// Иконка Base (упрощенная версия логотипа)
const BaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF"/>
  </svg>
);

const networks = [
  {
    id: base.id,
    name: 'Base',
    icon: <BaseIcon />,
    chain: base,
  },
  {
    id: baseSepolia.id,
    name: 'Base Sepolia',
    icon: <BaseIcon />,
    chain: baseSepolia,
  },
];

export function NetworkSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const currentNetwork = networks.find((n) => n.id === chain?.id) || networks[0];

  const handleNetworkChange = (networkId: number) => {
    switchChain({ chainId: networkId });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 text-black hover:bg-white/15 hover:border-white/30 transition-all duration-200 shadow-lg"
      >
        <div className="flex items-center gap-2">
          {currentNetwork.icon}
          <span className="font-medium text-sm">{currentNetwork.name}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay для закрытия при клике вне */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkChange(network.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  currentNetwork.id === network.id
                    ? 'text-black'
                    : 'text-black/80 hover:bg-white/10 hover:text-black/20'
                }`}
              >
                {network.icon}
                <span className="font-medium text-sm">{network.name}</span>
                {currentNetwork.id === network.id && (
                  <div className="ml-auto w-2 h-2 bg-green-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}