import { useRoute, Link } from "wouter";
import { useGift } from "@/hooks/use-gifts";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Copy, CheckCircle, ExternalLink, Gift, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { truncateNFTName, getChainName, getChainIcon } from '@/lib/wagmi';

export default function ShareGift() {
  const [, params] = useRoute("/share/:id");
  const giftId = params?.id || "";
  const { data: gift, isLoading } = useGift(giftId);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareLink = `${window.location.origin}/claim/${giftId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-primary">Loading...</div></div>;
  if (!gift) return <div className="min-h-screen flex items-center justify-center">Gift not found</div>;

  const visualAssets = (gift.visualAssets as any) || {};

  return (
    <div className="min-h-screen flex flex-col relative ">
      <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
      
      <div className="sticky top-0 z-50 w-full">
        <Navbar />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="p-8 rounded-3xl shadow-xl border-border/50 bg-white text-center space-y-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 relative">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle size={40} strokeWidth={3} />
              </motion.div>
              <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20" />
            </div>

            <div>
              <h1 className="text-3xl font-display font-bold mb-2">Gift Wrapped!</h1>
              <p className="text-muted-foreground text-lg">
                Your{' '}
                <span className="font-bold text-foreground">
                  {gift.tokenType === 'NFT' 
                    ? truncateNFTName(visualAssets.nftName || 'NFT', 20)
                    : gift.tokenType === 'ETH'
                    ? `${gift.amount} ETH`
                    : `${gift.amount} USDC`
                  }
                </span>{' '}
                gift is ready to be sent.
              </p>
              {gift.chainId && (
                <p className="text-sm text-muted-foreground mt-2">
                  {getChainIcon(gift.chainId)} Created on {getChainName(gift.chainId)}
                </p>
              )}
            </div>

            <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 text-left space-y-3">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Share this link</label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={shareLink} 
                  className="font-mono text-sm bg-white h-12 border-2 focus-visible:ring-0"
                />
                <Button 
                  onClick={handleCopy} 
                  className={`h-12 w-12 rounded-xl transition-all ${copied ? 'bg-green-500 hover:bg-green-600' : ''}`}
                >
                  {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send this link to the recipient via WhatsApp, Telegram, or Email.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a href={shareLink} target="_blank" rel="noreferrer" className="w-full">
                <Button variant="outline" className="w-full h-12 rounded-xl text-primary border-primary/20 hover:bg-primary/5">
                  View Gift Page <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              
              <Link href="/create">
                <Button variant="ghost" className="w-full rounded-xl text-muted-foreground">
                  Send Another Gift <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
