import { Link, useLocation } from "wouter";
import { Gift, LayoutDashboard } from "lucide-react";
import { NetworkSelector } from "./NetworkSelector";
import { WalletButton } from "./WalletButton";
import { useWallet } from "@/hooks/use-wallet";

export function Navbar() {
  const [location] = useLocation();
  const { isConnected } = useWallet();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/[0.08] bg-white/55 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg transition-transform group-hover:rotate-12">
                <Gift size={24} strokeWidth={2.5} />
              </div>
              <span className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                basedGift
              </span>
            </Link>

            {isConnected && (
              <Link
                href="/dashboard"
                className={`hidden sm:flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
                  location === '/dashboard'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <LayoutDashboard size={15} />
                My Gifts
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <NetworkSelector />
            </div>
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
