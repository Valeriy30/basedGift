import { Link } from "wouter";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Gift } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { address, isConnected, connect, disconnect } = useWallet();

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

          <div className="flex items-center gap-4">
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="font-mono gap-2 rounded-full border-2 border-primary/20 hover:border-primary/50">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {address}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  <DropdownMenuItem onClick={disconnect} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={connect}
                className="rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
