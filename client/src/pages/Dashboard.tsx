import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NFTImage } from "@/components/NFTImage";
import { BaseIcon } from "@/components/BaseIcon";
import { useWallet } from "@/hooks/use-wallet";
import { useMyGifts, useCancelPendingGift } from "@/hooks/use-gifts";
import { getChainName, truncateNFTName, truncateAddress } from "@/lib/wagmi";
import {
  Gift,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Copy,
  ExternalLink,
  Send,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Gift as GiftType } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  created: {
    label: "Waiting",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock size={12} />,
  },
  pending: {
    label: "Pending",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <Clock size={12} />,
  },
  claimed: {
    label: "Claimed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle2 size={12} />,
  },
  expired: {
    label: "Expired",
    color: "bg-red-100 text-red-600 border-red-200",
    icon: <RotateCcw size={12} />,
  },
};

function GiftCard({ gift }: { gift: GiftType }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const cancelGift = useCancelPendingGift();
  const visualAssets = (gift.visualAssets as any) || {};
  const statusCfg = STATUS_CONFIG[gift.status] ?? STATUS_CONFIG.created;
  const colorStart = visualAssets.colorScheme || "#3b82f6";
  const colorEnd = visualAssets.colorScheme2 || "#8b5cf6";

  const handleCopyLink = () => {
    const link = gift.giftLink || `${window.location.origin}/claim/${gift.id}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Claim link copied to clipboard." });
  };

  const handleCancel = async () => {
    try {
      await cancelGift.mutateAsync(gift.id);
      toast({ title: "Cancelled", description: "Pending gift removed." });
    } catch {
      toast({ title: "Error", description: "Could not cancel gift.", variant: "destructive" });
    }
  };

  const isExpired =
    gift.status === "created" &&
    gift.createdAt &&
    Date.now() - new Date(gift.createdAt).getTime() > 14 * 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden rounded-2xl border border-border/50 hover:shadow-lg transition-shadow">
        <div
          className="h-2"
          style={{ background: `linear-gradient(90deg, ${colorStart}, ${colorEnd})` }}
        />

        <div className="p-4 sm:p-5 flex gap-4 items-start">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colorStart}40, ${colorEnd}40)` }}
          >
            {gift.tokenType === "NFT" && visualAssets.nftImage ? (
              <NFTImage
                src={visualAssets.nftImage}
                alt={visualAssets.nftName || "NFT"}
                className="w-full h-full"
                size={14}
              />
            ) : (
              <span className="text-xl sm:text-2xl font-bold text-white drop-shadow">
                {gift.tokenType === "USDC" ? "$" : gift.tokenType === "ETH" ? "Ξ" : "🖼"}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="font-bold text-sm sm:text-base leading-tight truncate">
                  {gift.tokenType === "NFT"
                    ? truncateNFTName(visualAssets.nftName || "NFT", 20)
                    : gift.tokenType === "USDC"
                    ? `$${gift.amount} USDC`
                    : `${gift.amount} ETH`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  "{gift.message}"
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  isExpired ? STATUS_CONFIG.expired.color : statusCfg.color
                }`}
              >
                {isExpired ? <RotateCcw size={12} /> : statusCfg.icon}
                {isExpired ? "Expired" : statusCfg.label}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
              {gift.chainId && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <BaseIcon size={12} variant={gift.chainId === 84532 ? "testnet" : "mainnet"} />
                  {getChainName(gift.chainId)}
                </span>
              )}
              {gift.createdAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(gift.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              {gift.status === "claimed" && gift.receiverAddress && (
                <span className="text-xs text-green-600 font-mono">
                  → {truncateAddress(gift.receiverAddress)}
                </span>
              )}
            </div>

            {gift.status === "created" && !isExpired && gift.createdAt && (
              <ExpiryBar createdAt={gift.createdAt as unknown as string} />
            )}
          </div>
        </div>

        {gift.status !== "claimed" && (
          <div className="px-4 pb-4 flex gap-2 flex-wrap">
            {gift.giftLink && gift.status === "created" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-lg text-xs"
                  onClick={handleCopyLink}
                >
                  <Copy size={12} /> Copy Link
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 rounded-lg text-xs"
                  onClick={() => setLocation(`/share/${gift.id}`)}
                >
                  <ExternalLink size={12} /> View
                </Button>
              </>
            )}
            {gift.status === "pending" && (
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground italic">
                  Blockchain tx pending…
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 rounded-lg text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleCancel}
                  disabled={cancelGift.isPending}
                >
                  {cancelGift.isPending ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <X size={10} />
                  )}
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function ExpiryBar({ createdAt }: { createdAt: string }) {
  const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const remaining = Math.max(0, EXPIRY_MS - elapsed);
  const daysLeft = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  const pct = Math.min(100, (elapsed / EXPIRY_MS) * 100);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>Expires in {daysLeft}d</span>
        <span>{Math.round(pct)}% elapsed</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-400" : "bg-green-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { address, isConnected, connect } = useWallet();
  const { data: gifts, isLoading } = useMyGifts(address);

  const sorted = (gifts ?? []).slice().sort(
    (a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime(),
  );

  const counts = sorted.reduce(
    (acc, g) => {
      acc[g.status] = (acc[g.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navbar />
      
      {/* Исправленный блок кнопки: привязан к той же сетке, что и контент Navbar */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-4 sm:top-6 left-2 sm:left-4 lg:left-8">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-xl text-muted-foreground -ml-2"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft size={16} /> Back
          </Button>
        </div>
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold">My Gifts</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Track the gifts you've sent.
          </p>
        </motion.div>

        {!isConnected ? (
          <Card className="p-8 sm:p-12 text-center rounded-3xl border-dashed">
            <Gift size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Connect your wallet</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Connect to see gifts you've sent.
            </p>
            <Button onClick={connect} className="rounded-xl px-8">
              Connect Wallet
            </Button>
          </Card>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your gifts…</p>
          </div>
        ) : sorted.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center rounded-3xl border-dashed">
            <Gift size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">No gifts yet</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Send your first crypto gift and it will appear here.
            </p>
            <Button onClick={() => setLocation("/create")} className="rounded-xl px-8">
              Send a Gift <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
              {[
                { label: "Total sent", value: sorted.length, color: "text-primary" },
                { label: "Claimed", value: counts.claimed ?? 0, color: "text-green-600" },
                { label: "Waiting", value: counts.created ?? 0, color: "text-amber-600" },
              ].map((s) => (
                <Card key={s.label} className="p-3 sm:p-4 rounded-2xl text-center">
                  <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {sorted.map((gift) => (
                  <GiftCard key={gift.id} gift={gift} />
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-6 sm:mt-8 text-center">
              <Button
                variant="outline"
                className="rounded-xl gap-2"
                onClick={() => setLocation("/create")}
              >
                <Send size={15} /> Send another gift
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}