import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Coins, Image as ImageIcon, Sparkles, Send, Loader2, ArrowLeft } from "lucide-react";
import { ThemeCard } from "@/components/ThemeCard";
import { useCreateGift } from "@/hooks/use-gifts";
import { useWallet } from "@/hooks/use-wallet";
import { useUSDCBalance } from "@/hooks/use-usdc";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import { useCreateUSDCGift } from '@/hooks/use-escrow'; // Новый хук
import { useApproveUSDC } from '@/hooks/use-usdc';     // Убедись, что он есть
import { ESCROW_CONTRACT_ADDRESS, BASE_CHAIN_ID } from '@/lib/wagmi'; // Адреса

// Steps definition
const STEPS = ["Asset", "Customize", "Review"];

// Mock Themes
const THEMES = [
  { id: 'birthday', name: 'Birthday Bash', description: 'Balloons, confetti, and joy.', colorClass: 'theme-birthday' },
  { id: 'coffee', name: 'Coffee Break', description: 'Warm vibes for a small treat.', colorClass: 'theme-coffee' },
  { id: 'thanks', name: 'Thank You', description: 'Simple elegance to say thanks.', colorClass: 'theme-thanks' },
  { id: 'just_because', name: 'Just Because', description: 'Surprise them for no reason.', colorClass: 'theme-just_because' },
];

// Расширенная коллекция стикеров (эмодзи доступные на всех устройствах)
const STICKERS = [
  // Праздники и празднование
  { id: 'cake', emoji: '🎂' },
  { id: 'party', emoji: '🥳' },
  { id: 'balloon', emoji: '🎈' },
  { id: 'champagne', emoji: '🥂' },
  { id: 'confetti', emoji: '🎉' },
  { id: 'sparkler', emoji: '🎇' },
  { id: 'fireworks', emoji: '🎆' },
  
  // Подарки и награды
  { id: 'gift', emoji: '🎁' },
  { id: 'wrapped_gift', emoji: '🎀' },
  { id: 'trophy', emoji: '🏆' },
  { id: 'medal', emoji: '🏅' },
  { id: 'ribbon', emoji: '🎗️' },
  
  // Любовь и дружба
  { id: 'heart', emoji: '❤️' },
  { id: 'heart_eyes', emoji: '😍' },
  { id: 'sparkling_heart', emoji: '💖' },
  { id: 'two_hearts', emoji: '💕' },
  { id: 'hug', emoji: '🤗' },
  { id: 'kiss', emoji: '😘' },
  
  // Еда и напитки
  { id: 'coffee', emoji: '☕' },
  { id: 'pizza', emoji: '🍕' },
  { id: 'burger', emoji: '🍔' },
  { id: 'ice_cream', emoji: '🍦' },
  { id: 'donut', emoji: '🍩' },
  { id: 'cocktail', emoji: '🍹' },
  
  // Природа
  { id: 'flower', emoji: '🌸' },
  { id: 'rose', emoji: '🌹' },
  { id: 'sunflower', emoji: '🌻' },
  { id: 'rainbow', emoji: '🌈' },
  { id: 'sun', emoji: '☀️' },
  { id: 'star', emoji: '⭐' },
  
  // Активности
  { id: 'rocket', emoji: '🚀' },
  { id: 'airplane', emoji: '✈️' },
  { id: 'car', emoji: '🚗' },
  { id: 'beach', emoji: '🏖️' },
  { id: 'music', emoji: '🎵' },
  { id: 'guitar', emoji: '🎸' },
  
  // Драгоценности и деньги
  { id: 'gem', emoji: '💎' },
  { id: 'money', emoji: '💰' },
  { id: 'dollar', emoji: '💵' },
  { id: 'coin', emoji: '🪙' },
  
  // Другое
  { id: 'fire', emoji: '🔥' },
  { id: 'sparkles', emoji: '✨' },
  { id: 'crown', emoji: '👑' },
  { id: 'clap', emoji: '👏' },
  { id: 'thumb_up', emoji: '👍' },
  { id: 'ok_hand', emoji: '👌' },
];

// Палитра цветов для градиента
const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange  
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#10b981', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
];

export default function CreateGift() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { address, isConnected } = useWallet();
  const { balance: usdcBalance } = useUSDCBalance();
  const { toast } = useToast();
  const { approve, isPending: isApproving } = useApproveUSDC();
  const { createGift: createGiftOnChain, isPending: isContractLoading } = useCreateUSDCGift();
  const createGift = useCreateGift();

  // Form State
  const [formData, setFormData] = useState({
    tokenType: 'USDC', // 'USDC' | 'NFT'
    amount: '',
    message: '',
    theme: 'birthday',
    senderName: '',
    bgImage: '',
    sticker: '',
    colorScheme: '#3b82f6',
    colorScheme2: '#8b5cf6', // Второй цвет для градиента
    nftId: '',
  });

  const [isDragging, setIsDragging] = useState(false);

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

  const handleNext = () => {
    if (step === 0 && !formData.amount) {
      toast({ title: "Amount required", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    if (step === 1 && !formData.message) {
      toast({ title: "Message required", description: "Don't forget to write a note!", variant: "destructive" });
      return;
    }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    try {
      if (!address) throw new Error("Wallet not connected");
      const newGiftId = nanoid();
  
      
      toast({ title: "Step 1/2", description: "Approving USDC..." });
     
      const approveHash = await approve(ESCROW_CONTRACT_ADDRESS[BASE_CHAIN_ID], formData.amount);
      toast({ title: "Step 2/2", description: "Creating gift on-chain..." });
      await createGiftOnChain(newGiftId, formData.amount);
      const newGift = await createGift.mutateAsync({
        id: newGiftId,
        senderAddress: address,
        tokenType: formData.tokenType,
        amount: formData.amount,
        message: formData.message,
        visualAssets: { senderName: formData.senderName,
          bgImage: formData.bgImage,
          sticker: formData.sticker,
          colorScheme: formData.colorScheme,
          colorScheme2: formData.colorScheme2},
        status: 'created'
      });
  
      toast({ title: "Success!", description: "Gift ready to share!" });
      setLocation(`/share/${newGift.id}`);
  
    } catch (error: any) {
      console.error('Full error:', error);
      // Если пользователь отклонил транзакцию или нет газа — база данных не обновится. Это правильно!
      toast({ 
        title: "Transaction Failed", 
        description: error?.shortMessage || error?.message || "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        {/* Progress Bar */}
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

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, tokenType: 'USDC' })}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        formData.tokenType === 'USDC' 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Coins size={32} />
                      </div>
                      <span className="font-bold">USDC</span>
                    </button>
                    
                    <button
                      onClick={() => setFormData({ ...formData, tokenType: 'NFT' })}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        formData.tokenType === 'NFT' 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <ImageIcon size={32} />
                      </div>
                      <span className="font-bold">NFT</span>
                    </button>
                  </div>

                  {formData.tokenType === 'USDC' ? (
                    <div className="space-y-3 pt-4">
                      <Label htmlFor="amount" className="text-lg">Amount (USDC)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                        <Input 
                          id="amount"
                          type="number"
                          placeholder="10.00"
                          className="pl-8 h-14 text-xl rounded-xl border-2 focus-visible:ring-primary/20"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isConnected ? `Balance: $${parseFloat(usdcBalance).toFixed(2)} USDC` : 'Connect wallet to see balance'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-4">
                      <Label className="text-lg">Select NFT</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(id => (
                          <button
                            key={id}
                            onClick={() => setFormData({ ...formData, nftId: `NFT #${id}` })}
                            className={`aspect-square rounded-xl border-2 flex items-center justify-center bg-muted/30 ${formData.nftId === `NFT #${id}` ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                          >
                            <ImageIcon size={24} className="text-muted-foreground" />
                          </button>
                        ))}
                      </div>
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
                    
                    {/* iOS Style Sticker Picker */}
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

                    <div className="grid grid-cols-1 gap-6">
                      {/* Gradient Color Picker */}
                      <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground">Gradient Colors</Label>
                        
                        {/* Превью градиента */}
                        <div 
                          className="h-20 rounded-xl border-2 border-border/50"
                          style={{
                            background: `linear-gradient(135deg, ${formData.colorScheme} 0%, ${formData.colorScheme2} 100%)`
                          }}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* Первый цвет */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Color 1</Label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {COLORS.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setFormData({ ...formData, colorScheme: color })}
                                  style={{ backgroundColor: color }}
                                  className={`w-full aspect-square rounded-full transition-all ${
                                    formData.colorScheme === color ? 'ring-2 ring-offset-1 ring-primary scale-90' : 'hover:scale-105'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          
                          {/* Второй цвет */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Color 2</Label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {COLORS.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setFormData({ ...formData, colorScheme2: color })}
                                  style={{ backgroundColor: color }}
                                  className={`w-full aspect-square rounded-full transition-all ${
                                    formData.colorScheme2 === color ? 'ring-2 ring-offset-1 ring-primary scale-90' : 'hover:scale-105'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Photo Upload / Drag-n-Drop */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Background Photo</Label>
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
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
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="message" className="text-lg">Your Message</Label>
                    <Textarea 
                      id="message"
                      placeholder="Happy Birthday! Here's for that coffee we talked about..."
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
                    <p className="text-muted-foreground">Review your gift before paying.</p>
                  </div>

                  <div 
                    className={`p-8 rounded-2xl relative overflow-hidden`} 
                    style={{ 
                      background: `linear-gradient(135deg, ${formData.colorScheme} 0%, ${formData.colorScheme2} 100%)`
                    }}
                  >
                    {formData.bgImage && (
                      <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${formData.bgImage})` }} />
                    )}
                    <div className="relative z-10 bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-sm text-center space-y-4 border border-white/50">
                      <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase">You are sending</p>
                      <div className="text-5xl font-display font-bold text-foreground">
                        {formData.tokenType === 'USDC' ? `$${formData.amount}` : formData.nftId || 'NFT'} 
                        <span className="text-2xl text-muted-foreground ml-2">{formData.tokenType}</span>
                      </div>
                      <div className="h-px bg-border w-1/2 mx-auto my-4" />
                      <p className="font-handwriting text-2xl text-foreground/80 leading-relaxed">"{formData.message}"</p>
                      <p className="text-sm font-bold text-muted-foreground mt-4">- {formData.senderName || 'A friend'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
                {step > 0 ? (
                  <Button variant="ghost" onClick={handleBack} className="rounded-xl px-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                ) : <div />} {/* Spacer */}

                {step < STEPS.length - 1 ? (
                  <Button onClick={handleNext} className="rounded-xl px-8 h-12 text-lg shadow-lg shadow-primary/20">
                    Next Step
                  </Button>
                ) : (
                  <Button 
  onClick={handleSubmit} 
  disabled={isApproving || isContractLoading || createGift.isPending}
  className="rounded-xl px-8 h-12 text-lg shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700"
>
  {isApproving ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Approving USDC...
    </>
  ) : isContractLoading ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating on Chain...
    </>
  ) : createGift.isPending ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
    </>
  ) : (
    <>
      Create Link <Send className="ml-2 h-5 w-5" />
    </>
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
