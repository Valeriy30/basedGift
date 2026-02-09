import { Link } from "wouter";
import { Gift } from "lucide-react";
import { NetworkSelector } from "./NetworkSelector";
import { 
  ConnectWallet, 
  Wallet,
  WalletDropdown, 
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { 
  Avatar, 
  Name, 
  Identity,
  Address,
} from '@coinbase/onchainkit/identity';

export function Navbar() {
  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg transition-transform group-hover:rotate-12">
              <Gift size={24} strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              basedGift
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <NetworkSelector />

            <Wallet>
              <ConnectWallet className="rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </div>
    </nav>
  );
}
