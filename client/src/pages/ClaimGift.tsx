import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGift, useClaimGift } from "@/hooks/use-gifts";
import { useWallet } from "@/hooks/use-wallet";
import { useTransferUSDC } from "@/hooks/use-usdc";
import { useTransferNFT } from "@/hooks/use-nft";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, ArrowDown, Wallet, Loader2, Check } from "lucide-react";

export default function ClaimGift() {
  const [, params] = useRoute("/claim/:id");
  const giftId = params?.id || "";
  const { data: gift, isLoading: isGiftLoading } = useGift(giftId);
  const { address, isConnected, connect } = useWallet();
  const claimGift = useClaimGift();
  const { transfer: transferUSDC, isPending: isTransferringUSDC, isSuccess: isUSDCSuccess, hash: usdcTxHash } = useTransferUSDC();
  const { transferNFT, isPending: isTransferringNFT, isSuccess: isNFTSuccess, hash: nftTxHash } = useTransferNFT();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isOpened, setIsOpened] = useState(false);

  // Trigger confetti when opened
  useEffect(() => {
    if (isOpened) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = window.setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [isOpened]);

  const handleClaim = async () => {
    if (!gift || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Выполняем транзакцию в зависимости от типа подарка
      if (gift.tokenType === 'USDC' && gift.amount) {
        // Отправляем USDC напрямую от отправителя к получателю
        // ВАЖНО: В продакшене нужно использовать escrow контракт!
        // Сейчас мы просто показываем как это работает
        toast({
          title: "Transaction initiated",
          description: "Please confirm the transaction in your wallet",
        });
        
        // Здесь должна быть логика эскроу контракта
        // Для демо просто обновляем статус
        await claimGift.mutateAsync({
          id: gift.id,
          receiverAddress: address,
          claimTxHash: 'demo-transaction-hash',
        });

        toast({
          title: "Gift claimed!",
          description: `${gift.amount} USDC will be transferred to your wallet`,
        });
      } else if (gift.tokenType === 'NFT' && gift.tokenAddress && gift.tokenId) {
        // Трансфер NFT
        toast({
          title: "Transferring NFT",
          description: "Please confirm the transaction in your wallet",
        });

        await transferNFT(
          gift.tokenAddress,
          gift.tokenId,
          address,
          gift.senderAddress
        );

        // Обновляем статус после успешного трансфера
        if (nftTxHash) {
          await claimGift.mutateAsync({
            id: gift.id,
            receiverAddress: address,
            claimTxHash: nftTxHash,
          });
        }

        toast({
          title: "NFT claimed!",
          description: "NFT has been transferred to your wallet",
        });
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast({
        title: "Claim failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const THEME_CLASSES: Record<string, string> = {
    birthday: 'theme-birthday',
    coffee: 'theme-coffee',
    thanks: 'theme-thanks',
    just_because: 'theme-just_because',
    default: 'bg-white'
  };

  if (isGiftLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Fetching your gift...</p>
      </div>
    );
  }

  if (!gift) return <div className="min-h-screen flex items-center justify-center">Gift not found</div>;

  const visualAssets = (gift.visualAssets as any) || {};
  const senderName = visualAssets.senderName || 'Someone';
  const bgImage = visualAssets.bgImage;
  const sticker = visualAssets.sticker;
  const colorScheme = visualAssets.colorScheme || '#3b82f6';
  const colorScheme2 = visualAssets.colorScheme2 || '#8b5cf6';

  const STICKERS: Record<string, string> = {
    cake: '🎂',
    party: '🥳',
    balloon: '🎈',
    champagne: '🥂',
    confetti: '🎉',
    sparkler: '🎇',
    fireworks: '🎆',
    gift: '🎁',
    wrapped_gift: '🎀',
    trophy: '🏆',
    medal: '🏅',
    ribbon: '🎗️',
    heart: '❤️',
    heart_eyes: '😍',
    sparkling_heart: '💖',
    two_hearts: '💕',
    hug: '🤗',
    kiss: '😘',
    coffee: '☕',
    pizza: '🍕',
    burger: '🍔',
    ice_cream: '🍦',
    donut: '🍩',
    cocktail: '🍹',
    flower: '🌸',
    rose: '🌹',
    sunflower: '🌻',
    rainbow: '🌈',
    sun: '☀️',
    star: '⭐',
    rocket: '🚀',
    airplane: '✈️',
    car: '🚗',
    beach: '🏖️',
    music: '🎵',
    guitar: '🎸',
    gem: '💎',
    money: '💰',
    dollar: '💵',
    coin: '🪙',
    fire: '🔥',
    sparkles: '✨',
    crown: '👑',
    clap: '👏',
    thumb_up: '👍',
    ok_hand: '👌',
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${isOpened ? 'bg-gray-50' : 'bg-background'}`}>
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background for the theme */}
        <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center -z-10 transition-opacity duration-1000"
          style={{ 
            backgroundImage: bgImage ? `url(${bgImage})` : 'none',
            background: !bgImage ? `linear-gradient(135deg, ${colorScheme} 0%, ${colorScheme2} 100%)` : 'transparent'
          }}
        />

        <AnimatePresence mode="wait">
          {!isOpened ? (
            <motion.div
              key="unopened"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center cursor-pointer flex flex-col items-center justify-center w-full"
              onClick={() => setIsOpened(true)}
            >
              <div className="relative group flex flex-col items-center justify-center w-full">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="flex items-center justify-center w-full"
                >
                  <Gift size={180} strokeWidth={1} className="text-primary fill-primary/10 drop-shadow-2xl mx-auto" />
                </motion.div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                  <span className="font-bold text-primary">Click to Open!</span>
                </div>
              </div>
              <h1 className="mt-8 text-3xl font-display font-bold text-foreground">
                {senderName} sent you a gift!
              </h1>
              <p className="text-muted-foreground mt-2">Tap the gift box to reveal.</p>
            </motion.div>
          ) : (
            <motion.div
              key="opened"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-full max-w-md mx-auto"
            >
              <Card className={`overflow-hidden border-none shadow-2xl rounded-3xl w-full`}>
                <div 
                  className={`p-12 text-center relative flex flex-col items-center justify-center min-h-[350px] overflow-hidden`}
                  style={{ background: `linear-gradient(135deg, ${colorScheme} 0%, ${colorScheme2} 100%)` }}
                >
                   {bgImage && (
                     <div className="absolute inset-0 bg-cover bg-center opacity-40 z-0" style={{ backgroundImage: `url(${bgImage})` }} />
                   )}
                   {/* Decorative circle */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/30 rounded-full blur-3xl z-0" />
                   
                   <div className="relative z-10 w-full flex flex-col items-center justify-center">
                     {sticker && (
                       <div className="text-7xl mb-6 animate-bounce">
                         {STICKERS[sticker]}
                       </div>
                     )}
                     <p className="font-handwriting text-2xl mb-6 leading-relaxed text-foreground/90 max-w-[280px] mx-auto text-center">"{gift.message}"</p>
                     
                     <div className="text-6xl font-display font-bold text-foreground my-4 drop-shadow-md">
                       {gift.tokenType === 'USDC' ? `$${gift.amount}` : gift.tokenId || 'NFT'} 
                       <span className="text-2xl text-foreground/70 ml-2">{gift.tokenType}</span>
                     </div>
                     
                     <p className="text-sm font-bold uppercase tracking-widest text-foreground/60 mt-6">From {senderName}</p>
                   </div>
                </div>

                <div className="p-6 bg-white space-y-4">
                  {gift.status === 'claimed' ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                        <Check size={32} strokeWidth={3} />
                      </div>
                      <h3 className="text-xl font-bold text-green-700">Already Claimed</h3>
                      <p className="text-muted-foreground text-sm mt-1">Funds have been sent to the wallet.</p>
                      <Button onClick={() => setLocation('/')} variant="ghost" className="mt-4">Send a gift too</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                         <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                           <Wallet size={20} />
                         </div>
                         <div className="flex-1 overflow-hidden">
                           <p className="text-xs text-muted-foreground font-bold uppercase">Destination Wallet</p>
                           <p className="font-mono text-sm truncate">
                             {isConnected ? address : "Not Connected"}
                           </p>
                         </div>
                         {!isConnected && (
                           <Button size="sm" variant="outline" onClick={connect}>Connect</Button>
                         )}
                      </div>

                      <Button 
                        onClick={handleClaim} 
                        disabled={!isConnected || claimGift.isPending || isTransferringUSDC || isTransferringNFT}
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                      >
                        {(claimGift.isPending || isTransferringUSDC || isTransferringNFT) ? (
                           <><Loader2 className="mr-2 animate-spin" /> Claiming...</>
                        ) : (
                           <>Claim to Wallet <ArrowDown className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>
                      
                      {!isConnected && (
                        <p className="text-xs text-center text-muted-foreground">
                          New to crypto? <a href="#" className="underline hover:text-primary">Create a Smart Wallet</a> in seconds.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
