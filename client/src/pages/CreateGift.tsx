import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ColorPicker";
import { NFTImage } from "@/components/NFTImage";
import { Coins, Image as ImageIcon, Sparkles, Send, Loader2, ArrowLeft, Zap, ShoppingCart } from "lucide-react";
import { useCreateGift } from "@/hooks/use-gifts";
import { useWallet } from "@/hooks/use-wallet";
import { useUSDCBalance } from "@/hooks/use-usdc";
import { useToast } from "@/hooks/use-toast";
import { useUserNFTs } from "@/hooks/use-nft";
import { nanoid } from "nanoid";
import { useCreateUSDCGift, useCreateETHGift, useCreateNFTGift, useApproveNFT, giftIdToBytes32} from '@/hooks/use-escrow'; // ИЗМЕНЕНИЕ: импорт generateSecret
import { useApproveUSDC } from '@/hooks/use-usdc';
import { ESCROW_CONTRACT_ADDRESS, USDC_ADDRESS, truncateNFTName, getChainName, getChainIcon } from '@/lib/wagmi';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { NFT } from "@/hooks/use-nft";

const STEPS = ["Asset", "Customize", "Review"];

const STICKERS = [
  { id: 'cake', emoji: '🎂' },
  { id: 'party', emoji: '🥳' },
  { id: 'balloon', emoji: '🎈' },
  { id: 'champagne', emoji: '🥂' },
  { id: 'confetti', emoji: '🎉' },
  { id: 'sparkler', emoji: '🎇' },
  { id: 'fireworks', emoji: '🎆' },
  { id: 'gift', emoji: '🎁' },
  { id: 'wrapped_gift', emoji: '🎀' },
  { id: 'trophy', emoji: '🏆' },
  { id: 'medal', emoji: '🏅' },
  { id: 'ribbon', emoji: '🎗️' },
  { id: 'heart', emoji: '❤️' },
  { id: 'heart_eyes', emoji: '😍' },
  { id: 'sparkling_heart', emoji: '💖' },
  { id: 'two_hearts', emoji: '💕' },
  { id: 'hug', emoji: '🤗' },
  { id: 'kiss', emoji: '😘' },
  { id: 'coffee', emoji: '☕' },
  { id: 'pizza', emoji: '🍕' },
  { id: 'burger', emoji: '🍔' },
  { id: 'ice_cream', emoji: '🍦' },
  { id: 'donut', emoji: '🍩' },
  { id: 'cocktail', emoji: '🍹' },
  { id: 'flower', emoji: '🌸' },
  { id: 'rose', emoji: '🌹' },
  { id: 'sunflower', emoji: '🌻' },
  { id: 'rainbow', emoji: '🌈' },
  { id: 'sun', emoji: '☀️' },
  { id: 'star', emoji: '⭐' },
  { id: 'rocket', emoji: '🚀' },
  { id: 'airplane', emoji: '✈️' },
  { id: 'car', emoji: '🚗' },
  { id: 'beach', emoji: '🏖️' },
  { id: 'music', emoji: '🎵' },
  { id: 'guitar', emoji: '🎸' },
  { id: 'gem', emoji: '💎' },
  { id: 'money', emoji: '💰' },
  { id: 'dollar', emoji: '💵' },
  { id: 'coin', emoji: '🪙' },
  { id: 'fire', emoji: '🔥' },
  { id: 'sparkles', emoji: '✨' },
  { id: 'crown', emoji: '👑' },
  { id: 'clap', emoji: '👏' },
  { id: 'thumb_up', emoji: '👍' },
  { id: 'ok_hand', emoji: '👌' },
];

const TX_STEPS = {
  IDLE: 'idle',
  APPROVING: 'approving',
  APPROVED: 'approved',
  CREATING: 'creating',
  CREATED: 'created',
  SAVING: 'saving',
  DONE: 'done',
};

export default function CreateGift() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { address, isConnected, ethBalance, refetchBalances } = useWallet();
  const { balance: usdcBalance, refetch: refetchUsdcBalance } = useUSDCBalance();
  const { nfts, isLoading: isLoadingNFTs, error: nftError } = useUserNFTs();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const chainId = useChainId();

  const { chainId: walletChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { approve, isPending: isApproving } = useApproveUSDC();
  const { createGift: createUSDCGiftOnChain, isPending: isCreatingUSDC } = useCreateUSDCGift();
  const { createGift: createETHGiftOnChain, isPending: isCreatingETH } = useCreateETHGift();
  const { approveNFT, isPending: isApprovingNFT } = useApproveNFT();
  const { createGift: createNFTGiftOnChain, isPending: isCreatingNFT } = useCreateNFTGift();
  const createGift = useCreateGift();

  const [formData, setFormData] = useState({
    assetType: 'USDC',
    amount: '',
    message: '',
    senderName: '',
    bgImage: '',
    sticker: '',
    colorScheme: '#3b82f6',
    colorScheme2: '#8b5cf6',
    nftContractAddress: '',
    nftTokenId: '',
    nftImage: '',
    nftName: '',
  });

  const [isDragging, setIsDragging] = useState(false);
  const [txProgress, setTxProgress] = useState(TX_STEPS.IDLE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, bgImage: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleNext = useCallback(() => {
    if (step === 0) {
      if (formData.assetType === 'NFT' && !formData.nftTokenId) {
        toast({ title: "NFT required", description: "Please select an NFT.", variant: "destructive" });
        return;
      }
      if ((formData.assetType === 'USDC' || formData.assetType === 'ETH') && !formData.amount) {
        toast({ title: "Amount required", description: "Please enter a valid amount.", variant: "destructive" });
        return;
      }
      if (formData.assetType === 'USDC') {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount < 0.1) {
          toast({ title: "Invalid amount", description: "Minimum USDC gift is 0.1 USDC.", variant: "destructive" });
          return;
        }
        if (amount > 1000) {
          toast({ title: "Invalid amount", description: "Maximum USDC gift is 1,000 USDC.", variant: "destructive" });
          return;
        }
        const balance = parseFloat(usdcBalance);
        if (amount > balance) {
          toast({
            title: "Insufficient balance",
            description: `You only have ${balance.toFixed(2)} USDC. Cannot gift ${amount.toFixed(2)} USDC.`,
            variant: "destructive"
          });
          return;
        }
      }
      if (formData.assetType === 'ETH') {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount < 0.0001) {
          toast({ title: "Invalid amount", description: "Minimum ETH gift is 0.0001 ETH.", variant: "destructive" });
          return;
        }
        if (amount > 1) {
          toast({ title: "Invalid amount", description: "Maximum ETH gift is 1 ETH.", variant: "destructive" });
          return;
        }
        const balance = ethBalance ? parseFloat(ethBalance.formatted) : 0;
        if (amount > balance) {
          toast({
            title: "Insufficient balance",
            description: `You only have ${balance.toFixed(4)} ETH. Cannot gift ${amount.toFixed(4)} ETH.`,
            variant: "destructive"
          });
          return;
        }
      }
    }
    if (step === 1 && !formData.message) {
      toast({ title: "Message required", description: "Don't forget to write a note!", variant: "destructive" });
      return;
    }
    setStep(s => s + 1);
  }, [step, formData, usdcBalance, ethBalance, toast]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(s => s - 1);
    } else {
      setLocation('/');
    }
  }, [step, setLocation]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || txProgress !== TX_STEPS.IDLE) return;
    setIsSubmitting(true);
    try {
      if (!address) throw new Error("Wallet not connected");

      if (walletChainId !== chainId) {
        toast({ title: "Switching network", description: `Switching to ${getChainName(chainId)}...` });
        await switchChainAsync({ chainId });
      }

      const newGiftId = nanoid();
      const giftIdBytes32 = giftIdToBytes32(newGiftId);
      const currentChainId = chainId as keyof typeof ESCROW_CONTRACT_ADDRESS;
      const contractAddress = ESCROW_CONTRACT_ADDRESS[currentChainId];

      if (!contractAddress) throw new Error("Contract not found for this network");

      // ИЗМЕНЕНИЕ: генерируем secret один раз для всего подарка
      // secret → только в URL ссылки, никогда не в БД
      // claimHash → передаётся в контракт
      

      let escrowTxHash: string | undefined;

      if (formData.assetType === 'USDC') {
        setTxProgress(TX_STEPS.APPROVING);
        toast({ title: "Step 1/3", description: "Approving USDC..." });

        await approve(ESCROW_CONTRACT_ADDRESS[chainId as keyof typeof ESCROW_CONTRACT_ADDRESS], formData.amount);

        setTxProgress(TX_STEPS.APPROVED);
        toast({ title: "Step 1/3 ✓", description: "USDC approved! Creating gift..." });

        await new Promise(resolve => setTimeout(resolve, 1000));

        setTxProgress(TX_STEPS.CREATING);
        toast({ title: "Step 2/3", description: "Creating gift on blockchain..." });
        // ИЗМЕНЕНИЕ: передаём claimHash
        escrowTxHash = await createUSDCGiftOnChain(newGiftId, formData.amount, claimHash);

        setTxProgress(TX_STEPS.CREATED);
        toast({ title: "Step 2/3 ✓", description: "Gift created on-chain!" });

      } else if (formData.assetType === 'ETH') {
        setTxProgress(TX_STEPS.CREATING);
        toast({ title: "Step 1/2", description: "Creating gift on blockchain..." });
        // ИЗМЕНЕНИЕ: передаём claimHash
        escrowTxHash = await createETHGiftOnChain(newGiftId, formData.amount, claimHash);

        setTxProgress(TX_STEPS.CREATED);

      } else if (formData.assetType === 'NFT') {
        if (!formData.nftContractAddress || !formData.nftTokenId) {
          throw new Error("NFT not selected");
        }

        setTxProgress(TX_STEPS.APPROVING);
        toast({ title: "Step 1/3", description: "Approving NFT transfer..." });
        await approveNFT(formData.nftContractAddress, formData.nftTokenId);

        setTxProgress(TX_STEPS.APPROVED);
        toast({ title: "Step 1/3 ✓", description: "NFT approved! Creating gift..." });

        await new Promise(resolve => setTimeout(resolve, 1000));

        setTxProgress(TX_STEPS.CREATING);
        toast({ title: "Step 2/3", description: "Creating NFT gift on blockchain..." });
        // ИЗМЕНЕНИЕ: передаём claimHash вторым аргументом
        escrowTxHash = await createNFTGiftOnChain(newGiftId, claimHash, formData.nftContractAddress, formData.nftTokenId);

        setTxProgress(TX_STEPS.CREATED);
        toast({ title: "Step 2/3 ✓", description: "NFT gift created on-chain!" });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      setTxProgress(TX_STEPS.SAVING);
      toast({ title: `Step ${formData.assetType === 'ETH' ? '2/2' : '3/3'}`, description: "Saving gift..." });

      // ИЗМЕНЕНИЕ: secret кладётся ТОЛЬКО в giftLink — никогда не в БД!
      // Получатель получает ссылку вида: /claim/<giftId>?s=<secret>
      const giftLink = `${window.location.origin}/claim/${newGiftId}?s=${secret}`;

      const newGift = await createGift.mutateAsync({
        id: newGiftId,
        giftId: giftIdBytes32,
        chainId: chainId,
        giftLink,
        senderAddress: address,
        tokenType: formData.assetType,
        tokenAddress: formData.assetType === 'USDC'
          ? USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS]
          : formData.assetType === 'NFT'
          ? formData.nftContractAddress
          : null,
        tokenId: formData.assetType === 'NFT' ? formData.nftTokenId : null,
        amount: formData.assetType === 'NFT' ? '0' : formData.amount,
        message: formData.message,
        escrowTxHash: escrowTxHash || null,
        visualAssets: {
          senderName: formData.senderName,
          bgImage: formData.bgImage,
          sticker: formData.sticker,
          colorScheme: formData.colorScheme,
          colorScheme2: formData.colorScheme2,
          nftContractAddress: formData.nftContractAddress,
          nftTokenId: formData.nftTokenId,
          nftImage: formData.nftImage,
          nftName: formData.nftName,
        },
        status: 'created'
      });

      refetchBalances();
      refetchUsdcBalance();
      queryClient.invalidateQueries();

      setTxProgress(TX_STEPS.DONE);
      toast({ title: "Success!", description: "Gift ready to share!" });
      setLocation(`/share/${newGift.id}`);

    } catch (error: any) {
      console.error('Full error:', error);
      setTxProgress(TX_STEPS.IDLE);
      toast({
        title: "Transaction Failed",
        description: error?.shortMessage || error?.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    address, chainId, walletChainId, formData, txProgress, isSubmitting,
    approve, approveNFT, createUSDCGiftOnChain, createETHGiftOnChain, createNFTGiftOnChain,
    createGift, switchChainAsync, refetchBalances, refetchUsdcBalance, queryClient,
    toast, setLocation
  ]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="sticky top-0 z-50 w-full">
        <Navbar />
      </div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 relative">
        <Button variant="ghost" onClick={handleBack} className="mb-4 rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{getChainIcon(chainId)}</span>
          <span>Creating on <strong className="text-foreground">{getChainName(chainId)}</strong></span>
        </div>

        <div className="mb-12">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-sm font-bold font-display ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                {i + 1}. {s}
              </span>
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 md:p-8 shadow-xl border-border/50 rounded-3xl bg-white">
              {step === 0 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">What are you gifting?</h2>
                    <p className="text-muted-foreground">Choose the asset you want to wrap.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, assetType: 'USDC' })}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        formData.assetType === 'USDC' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Coins size={32} /></div>
                      <span className="font-bold">USDC</span>
                    </button>

                    <button
                      onClick={() => setFormData({ ...formData, assetType: 'ETH' })}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        formData.assetType === 'ETH' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="bg-indigo-100 p-3 rounded-full text-indigo-600"><Zap size={32} /></div>
                      <span className="font-bold">ETH</span>
                    </button>

                    <button
                      onClick={() => setFormData({ ...formData, assetType: 'NFT' })}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        formData.assetType === 'NFT' ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="bg-purple-100 p-3 rounded-full text-purple-600"><ImageIcon size={32} /></div>
                      <span className="font-bold">NFT</span>
                    </button>
                  </div>

                  {formData.assetType === 'USDC' && (
                    <div className="space-y-3 pt-4">
                      <Label htmlFor="amount" className="text-lg">Amount (USDC)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                        <Input
                          id="amount"
                          type="text"
                          inputMode="decimal"
                          placeholder="10.00"
                          className="pl-8 h-14 text-xl rounded-xl border-2 focus-visible:ring-primary/20"
                          value={formData.amount}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '' || /^\d*\.?\d*$/.test(v)) {
                              setFormData({ ...formData, amount: v });
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {isConnected ? `Balance: $${parseFloat(usdcBalance).toFixed(2)} USDC` : 'Connect wallet to see balance'}
                        </p>
                        {isConnected && parseFloat(usdcBalance) < parseFloat(formData.amount || '0') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 rounded-full border-blue-500 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              const fundingUrl = `https://pay.coinbase.com/buy/select-asset?appId=${import.meta.env.VITE_CDP_API_KEY}&addresses={"${address}":["base"]}&assets=["USDC"]&defaultAsset=USDC&defaultNetwork=base&defaultPaymentMethod=CARD&presetFiatAmount=${Math.ceil(parseFloat(formData.amount || '0'))}`;
                              const width = 500;
                              const height = 700;
                              const left = (window.screen.width / 2) - (width / 2);
                              const top = (window.screen.height / 2) - (height / 2);
                              window.open(fundingUrl, 'coinbaseOnramp', `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`);
                            }}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Buy USDC
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.assetType === 'ETH' && (
                    <div className="space-y-3 pt-4">
                      <Label htmlFor="ethAmount" className="text-lg">Amount (ETH)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">Ξ</span>
                        <Input
                          id="ethAmount"
                          type="text"
                          inputMode="decimal"
                          placeholder="0.01"
                          className="pl-8 h-14 text-xl rounded-xl border-2 focus-visible:ring-primary/20"
                          value={formData.amount}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '' || /^\d*\.?\d*$/.test(v)) {
                              setFormData({ ...formData, amount: v });
                            }
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isConnected && ethBalance ? `Balance: ${parseFloat(ethBalance.formatted).toFixed(4)} ETH` : 'Connect wallet to see balance'}
                      </p>
                    </div>
                  )}

                  {formData.assetType === 'NFT' && (
                    <div className="space-y-3 pt-4">
                      <Label className="text-lg">Select NFT</Label>
                      {isLoadingNFTs ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                          <p className="text-sm text-muted-foreground mt-2">Loading your NFTs...</p>
                        </div>
                      ) : nftError ? (
                        <div className="text-center py-8 bg-destructive/10 rounded-xl border border-destructive/20">
                          <ImageIcon className="w-12 h-12 mx-auto text-destructive mb-2" />
                          <p className="text-sm text-destructive font-medium">Failed to load NFTs</p>
                          <p className="text-xs text-muted-foreground mt-1">Check console for details</p>
                        </div>
                      ) : nfts.length === 0 ? (
                        <div className="text-center py-8 bg-muted/30 rounded-xl">
                          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No NFTs found in your wallet</p>
                          <p className="text-xs text-muted-foreground mt-1">on {getChainName(chainId)}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                          {nfts.map((nft: NFT) => (
                            <button
                              key={`${nft.contractAddress}-${nft.tokenId}`}
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  nftContractAddress: nft.contractAddress,
                                  nftTokenId: nft.tokenId,
                                  nftImage: nft.image || '',
                                  nftName: nft.name || `NFT #${nft.tokenId}`,
                                })
                              }
                              className={`aspect-square rounded-xl border-2 overflow-hidden transition-all relative group ${
                                formData.nftTokenId === nft.tokenId
                                  ? 'border-primary ring-2 ring-primary/20'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <NFTImage
                                src={nft.image}
                                alt={nft.name || `NFT #${nft.tokenId}`}
                                className="w-full h-full"
                                size={24}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                <p className="text-white text-xs font-bold text-center line-clamp-2 max-w-full truncate">
                                  {truncateNFTName(nft.name || `NFT #${nft.tokenId}`, 18)}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold mb-2">Personalize it</h2>
                    <p className="text-muted-foreground">Make it special with a theme and message.</p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg">Style & Decorations</Label>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Sticker</Label>
                      <div className="flex gap-3 overflow-x-auto py-6 scrollbar-hide px-1">
                        {STICKERS.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setFormData({ ...formData, sticker: s.id })}
                            className={`flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl rounded-full transition-all ${
                              formData.sticker === s.id ? 'bg-primary/20 scale-110 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {s.emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker
                        label="Color 1"
                        value={formData.colorScheme}
                        onChange={(color) => setFormData({ ...formData, colorScheme: color })}
                      />
                      <ColorPicker
                        label="Color 2"
                        value={formData.colorScheme2}
                        onChange={(color) => setFormData({ ...formData, colorScheme2: color })}
                      />
                    </div>

                    <div
                      className="h-20 rounded-xl border-2 border-border/50"
                      style={{ background: `linear-gradient(135deg, ${formData.colorScheme} 0%, ${formData.colorScheme2} 100%)` }}
                    />

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Background Photo</Label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault(); setIsDragging(false);
                          const file = e.dataTransfer.files[0];
                          if (file) handleFile(file);
                        }}
                        className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden relative ${
                          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => document.getElementById('fileInput')?.click()}
                      >
                        {formData.bgImage ? (
                          <img src={formData.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        ) : (
                          <>
                            <ImageIcon className="text-muted-foreground mb-1" size={20} />
                            <span className="text-[10px] text-muted-foreground text-center px-2">Drag photo or click to upload</span>
                          </>
                        )}
                        <input
                          id="fileInput"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="message" className="text-lg">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Happy Birthday! Here's a little something special for you..."
                      className="min-h-[120px] rounded-xl text-lg p-4 border-2 resize-none focus-visible:ring-primary/20 font-handwriting"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="senderName" className="text-lg">From (Optional)</Label>
                    <Input
                      id="senderName"
                      placeholder="Your Name"
                      className="h-12 rounded-xl border-2 focus-visible:ring-primary/20"
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                      <Sparkles size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Ready to wrap?</h2>
                    <p className="text-muted-foreground">Review your gift before sending.</p>
                  </div>

                  <div
                    className="p-8 rounded-2xl relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${formData.colorScheme} 0%, ${formData.colorScheme2} 100%)` }}
                  >
                    {formData.bgImage && (
                      <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${formData.bgImage})` }} />
                    )}
                    <div className="relative z-10 bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-sm text-center space-y-4 border border-white/50">
                      <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase">You are sending</p>
                      <div className="text-5xl font-display font-bold text-foreground">
                        {formData.assetType === 'NFT' ? (
                          <div className="flex flex-col items-center gap-3">
                            <NFTImage
                              src={formData.nftImage || null}
                              alt={formData.nftName}
                              className="w-40 h-40 mx-auto rounded-xl border-2 border-white shadow-lg"
                              size={48}
                            />
                            <span className="text-2xl text-foreground/90 max-w-[250px] truncate">
                              {truncateNFTName(formData.nftName || 'NFT', 24)}
                            </span>
                          </div>
                        ) : (
                          <>
                            {formData.assetType === 'ETH' ? 'Ξ' : '$'}{formData.amount}
                            <span className="text-2xl text-muted-foreground ml-2">{formData.assetType}</span>
                          </>
                        )}
                      </div>
                      <div className="h-px bg-border w-1/2 mx-auto my-4" />
                      <p className="font-handwriting text-2xl text-foreground/80 leading-relaxed">"{formData.message}"</p>
                      <p className="text-sm font-bold text-muted-foreground mt-4">- {formData.senderName || 'A friend'}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getChainIcon(chainId)} {getChainName(chainId)}
                      </p>
                    </div>
                  </div>

                  {txProgress !== TX_STEPS.IDLE && (
                    <div className="space-y-3 bg-muted/30 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        {formData.assetType === 'USDC' && (
                          <>
                            <div className={`flex items-center gap-2 ${txProgress === TX_STEPS.APPROVING ? 'text-primary' : txProgress === TX_STEPS.APPROVED || txProgress === TX_STEPS.CREATING || txProgress === TX_STEPS.CREATED || txProgress === TX_STEPS.SAVING || txProgress === TX_STEPS.DONE ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {txProgress === TX_STEPS.APPROVING ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                              <span className="text-sm font-medium">Approve USDC</span>
                            </div>
                            <div className="flex-1 h-px bg-border" />
                          </>
                        )}
                        <div className={`flex items-center gap-2 ${txProgress === TX_STEPS.CREATING ? 'text-primary' : txProgress === TX_STEPS.CREATED || txProgress === TX_STEPS.SAVING || txProgress === TX_STEPS.DONE ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {txProgress === TX_STEPS.CREATING ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                          <span className="text-sm font-medium">Create on Blockchain</span>
                        </div>
                        <div className="flex-1 h-px bg-border" />
                        <div className={`flex items-center gap-2 ${txProgress === TX_STEPS.SAVING ? 'text-primary' : txProgress === TX_STEPS.DONE ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {txProgress === TX_STEPS.SAVING ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                          <span className="text-sm font-medium">Save Gift</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
                <Button variant="ghost" onClick={handleBack} className="rounded-xl px-6">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button onClick={handleNext} className="rounded-xl px-8 h-12 text-lg shadow-lg shadow-primary/20">
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isApproving || isApprovingNFT || isCreatingUSDC || isCreatingETH || isCreatingNFT || createGift.isPending || isSubmitting || txProgress !== TX_STEPS.IDLE}
                    className="rounded-xl px-8 h-12 text-lg shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700"
                  >
                    {isApproving || isApprovingNFT || isCreatingUSDC || isCreatingETH || isCreatingNFT || createGift.isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                      <>Create Link <Send className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}