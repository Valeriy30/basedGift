import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useGift, useClaimGift } from "@/hooks/use-gifts";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { NFTImage } from "@/components/NFTImage";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, ArrowDown, Wallet, Loader2, Check, ArrowLeft, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { useClaimGift as useClaimGiftContract, useGiftInfo } from '@/hooks/use-escrow';
import { truncateAddress, truncateNFTName, TARGET_CHAIN, getChainName, getChainIcon } from '@/lib/wagmi';
import { useAccount, useSwitchChain } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

export default function ClaimGift() {
  const [, params] = useRoute("/claim/:id");
  const [, setLocation] = useLocation();
  const giftId = params?.id || "";

  // ИЗМЕНЕНИЕ: читаем secret из URL параметра ?s=0x...
  // Ссылка имеет вид: /claim/<giftId>?s=<secret>
  // Secret НИКОГДА не хранится в БД — только в URL
  const secret = (() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('s') as `0x${string}` | null;
  })();

  const { data: gift, isLoading: isGiftLoading } = useGift(giftId);
  const { address, isConnected, connect, refetchBalances } = useWallet();
  const claimGift = useClaimGift();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { claimGift: sendClaimTx, isPending: isClaimingInBlockchain } = useClaimGiftContract();
  const { chainId: walletChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const giftChainId = gift?.chainId || TARGET_CHAIN.id;
  const { giftInfo, isLoading: isLoadingGiftInfo, refetch: refetchGiftInfo } = useGiftInfo(giftId, giftChainId);

  const [isOpened, setIsOpened] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWrongNetwork = isConnected && walletChainId !== giftChainId;
  const isClaimedOnChain = giftInfo ? giftInfo[4] : false;
  const isRefundedOnChain = giftInfo ? giftInfo[5] : false;

  // ИЗМЕНЕНИЕ: проверяем наличие secret при открытии страницы
  // Если secret отсутствует — ссылка неполная, клейм невозможен
  const isSecretMissing = !secret;

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `gift_claimed_${giftId}` && e.newValue === 'true') {
        refetchGiftInfo();
        toast({
          title: "Already Claimed",
          description: "This gift was claimed in another tab",
          variant: "destructive",
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [giftId, refetchGiftInfo, toast]);

  useEffect(() => {
    if (isOpened) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = window.setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [isOpened]);

  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: giftChainId });
    } catch (err) {
      console.error('[ClaimGift] switchChain error:', err);
    }
  }, [giftChainId, switchChainAsync]);

  const handleClaim = useCallback(async () => {
    if (isSubmitting || isClaimingInBlockchain || claimGift.isPending) return;

    if (!gift || !address) {
      toast({ title: "Wallet not connected", description: "Please connect your wallet first", variant: "destructive" });
      return;
    }

    // ИЗМЕНЕНИЕ: проверяем secret перед клеймом
    if (!secret) {
      toast({
        title: "Invalid Link",
        description: "This gift link is incomplete. The secret key is missing.",
        variant: "destructive"
      });
      return;
    }

    if (isClaimedOnChain) {
      toast({ title: "Already Claimed", description: "This gift has already been claimed", variant: "destructive" });
      return;
    }

    if (isRefundedOnChain) {
      toast({ title: "Gift Refunded", description: "This gift has been refunded to the sender", variant: "destructive" });
      return;
    }

    const localClaimed = localStorage.getItem(`gift_claimed_${gift.id}`);
    if (localClaimed === 'true') {
      toast({ title: "Already Claimed", description: "This gift was already claimed", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (walletChainId !== giftChainId) {
        toast({ title: "Switching network", description: `Switching to ${getChainName(giftChainId)}...` });
        await switchChainAsync({ chainId: giftChainId });
      }

      toast({ title: "Initiating claim", description: "Please confirm the transaction in your wallet" });

      // ИЗМЕНЕНИЕ: передаём secret в sendClaimTx
      const txHash = await sendClaimTx(gift.id, secret, giftChainId);

      await new Promise(resolve => setTimeout(resolve, 2000));

      await claimGift.mutateAsync({
        id: gift.id,
        receiverAddress: address,
        claimTxHash: (typeof txHash === 'string' ? txHash : undefined) || 'pending',
      });

      localStorage.setItem(`gift_claimed_${gift.id}`, 'true');

      refetchBalances();
      refetchGiftInfo();
      queryClient.invalidateQueries();

      setIsOpened(true);
      toast({
        title: "Success!",
        description: gift.tokenType === 'USDC'
          ? `${gift.amount} USDC is on its way!`
          : gift.tokenType === 'ETH'
          ? `${gift.amount} ETH is on its way!`
          : "NFT has been transferred successfully!",
      });

    } catch (error: any) {
      console.error('Claim error:', error);
      const reason = error?.cause?.reason || error?.shortMessage || error?.message || "";

      toast({
        title: "Claim failed",
        description: reason.includes("Invalid secret")
          ? "This link appears to be invalid or tampered with."
          : reason.includes("Gift has expired")
          ? "This gift has expired (7 days limit)."
          : reason.includes("rate limited")
          ? "Too many requests. Please wait a moment and try again."
          : reason.includes("user rejected")
          ? "Transaction cancelled"
          : reason.includes("already claimed")
          ? "This gift has already been claimed"
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [gift, address, secret, giftChainId, walletChainId, isClaimedOnChain, isRefundedOnChain, isSubmitting, isClaimingInBlockchain, claimGift, sendClaimTx, switchChainAsync, refetchBalances, refetchGiftInfo, queryClient, toast]);

  const STICKERS: Record<string, string> = {
    cake: '🎂', party: '🥳', balloon: '🎈', champagne: '🥂', confetti: '🎉',
    sparkler: '🎇', fireworks: '🎆', gift: '🎁', wrapped_gift: '🎀', trophy: '🏆',
    medal: '🏅', ribbon: '🎗️', heart: '❤️', heart_eyes: '😍', sparkling_heart: '💖',
    two_hearts: '💕', hug: '🤗', kiss: '😘', coffee: '☕', pizza: '🍕',
    burger: '🍔', ice_cream: '🍦', donut: '🍩', cocktail: '🍹', flower: '🌸',
    rose: '🌹', sunflower: '🌻', rainbow: '🌈', sun: '☀️', star: '⭐',
    rocket: '🚀', airplane: '✈️', car: '🚗', beach: '🏖️', music: '🎵',
    guitar: '🎸', gem: '💎', money: '💰', dollar: '💵', coin: '🪙',
    fire: '🔥', sparkles: '✨', crown: '👑', clap: '👏', thumb_up: '👍',
    ok_hand: '👌',
  };

  if (isGiftLoading || isLoadingGiftInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/30 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Fetching your gift...</p>
      </div>
    );
  }

  if (!gift) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Gift size={64} className="text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Gift not found</h2>
          <p className="text-muted-foreground mb-6">This gift link may be invalid or expired.</p>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // ИЗМЕНЕНИЕ: показываем предупреждение если secret отсутствует в URL
  if (isSecretMissing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-center">Incomplete Link</h2>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            This gift link is missing the secret key. Make sure you copied the full link from the sender.
          </p>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const visualAssets = (gift.visualAssets as any) || {};
  const senderName = visualAssets.senderName || 'Someone';
  const bgImage = visualAssets.bgImage;
  const sticker = visualAssets.sticker;
  const colorScheme = visualAssets.colorScheme || '#3b82f6';
  const colorScheme2 = visualAssets.colorScheme2 || '#8b5cf6';
  const isAlreadyClaimed = gift.status === 'claimed' || isClaimedOnChain;
  const isRefunded = isRefundedOnChain;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />

      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center -z-10 transition-opacity duration-1000"
          style={{
            backgroundImage: bgImage ? `url(${bgImage})` : 'none',
            background: !bgImage ? `linear-gradient(135deg, ${colorScheme} 0%, ${colorScheme2} 100%)` : 'transparent'
          }}
        />

        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="absolute top-4 left-4 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

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
              <h1 className="mt-8 text-3xl font-display font-bold text-foreground max-w-md truncate">
                {senderName} sent you a gift!
              </h1>
              <p className="text-muted-foreground mt-2">Tap the gift box to reveal.</p>
              {giftChainId && (
                <p className="text-xs text-muted-foreground mt-1">
                  {getChainIcon(giftChainId)} {getChainName(giftChainId)}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="opened"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-full max-w-md mx-auto"
            >
              <Card className="overflow-hidden border-none shadow-2xl rounded-3xl w-full">
                <div
                  className="p-8 sm:p-12 text-center relative flex flex-col items-center justify-center min-h-[300px] sm:min-h-[350px] overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${colorScheme} 0%, ${colorScheme2} 100%)` }}
                >
                  {bgImage && <div className="absolute inset-0 bg-cover bg-center opacity-40 z-0" style={{ backgroundImage: `url(${bgImage})` }} />}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/30 rounded-full blur-3xl z-0" />

                  <div className="relative z-10 w-full flex flex-col items-center justify-center max-w-[300px] mx-auto">
                    {sticker && <div className="text-7xl mb-6 animate-bounce">{STICKERS[sticker]}</div>}
                    <p className="font-handwriting text-xl sm:text-2xl mb-6 leading-relaxed text-foreground/90 max-w-[280px] mx-auto text-center break-words">
                      "{gift.message}"
                    </p>
                    <div className="font-display font-bold text-foreground my-4 drop-shadow-md w-full">
                      {gift.tokenType === 'NFT' ? (
                        <div className="flex flex-col items-center gap-3">
                          <NFTImage
                            src={visualAssets.nftImage}
                            alt={visualAssets.nftName || 'NFT'}
                            className="w-32 h-32 mx-auto rounded-xl border-2 border-white shadow-lg"
                            size={48}
                          />
                          <span className="text-xl sm:text-2xl text-foreground/90 max-w-[250px] truncate block">
                            {truncateNFTName(visualAssets.nftName || 'NFT', 22)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-4xl sm:text-6xl">
                          {gift.tokenType === 'USDC' ? `$${gift.amount}` : `Ξ${gift.amount}`}
                          <span className="text-xl sm:text-2xl text-foreground/70 ml-2">{gift.tokenType}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-foreground/60 mt-6">From {senderName}</p>
                    {giftChainId && (
                      <p className="text-xs text-foreground/50 mt-1">
                        {getChainIcon(giftChainId)} {getChainName(giftChainId)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-white space-y-4">
                  {isWrongNetwork && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-800">Wrong Network</p>
                        <p className="text-xs text-amber-600">
                          This gift was created on {getChainName(giftChainId)}.
                          You are on chain {walletChainId}.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-400 text-amber-700 hover:bg-amber-100"
                        onClick={handleSwitchNetwork}
                      >
                        Switch
                      </Button>
                    </div>
                  )}

                  {isRefunded ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-4">
                        <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-amber-700">Gift Expired</h3>
                      <p className="text-muted-foreground text-sm mt-1">This gift has been refunded to the sender.</p>
                      <Button onClick={() => setLocation('/')} variant="ghost" className="mt-4">Go Home</Button>
                    </div>
                  ) : isAlreadyClaimed ? (
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
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Wallet size={20} /></div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs text-muted-foreground font-bold uppercase">Destination Wallet</p>
                          <p className="font-mono text-sm flex items-center gap-2">
                            {isConnected && <span className="text-lg">{getChainIcon(giftChainId)}</span>}
                            {isConnected ? truncateAddress(address) : "Not Connected"}
                          </p>
                        </div>
                        {!isConnected && <Button size="sm" variant="outline" onClick={connect}>Connect</Button>}
                      </div>

                      <Button
                        onClick={handleClaim}
                        disabled={!isConnected || !!isWrongNetwork || claimGift.isPending || isClaimingInBlockchain || isSubmitting}
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                      >
                        {(claimGift.isPending || isClaimingInBlockchain || isSubmitting) ? (
                          <><Loader2 className="mr-2 animate-spin" /> Processing...</>
                        ) : isWrongNetwork ? (
                          <>Wrong Network</>
                        ) : (
                          <>Claim to Wallet <ArrowDown className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>

                      {!isConnected && (
                        <p className="text-xs text-center text-muted-foreground">
                          Connect your wallet to claim this gift
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