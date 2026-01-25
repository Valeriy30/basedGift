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
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";

// Steps definition
const STEPS = ["Asset", "Customize", "Review"];

// Mock Themes
const THEMES = [
  { id: 'birthday', name: 'Birthday Bash', description: 'Balloons, confetti, and joy.', colorClass: 'theme-birthday' },
  { id: 'coffee', name: 'Coffee Break', description: 'Warm vibes for a small treat.', colorClass: 'theme-coffee' },
  { id: 'thanks', name: 'Thank You', description: 'Simple elegance to say thanks.', colorClass: 'theme-thanks' },
  { id: 'just_because', name: 'Just Because', description: 'Surprise them for no reason.', colorClass: 'theme-just_because' },
];

export default function CreateGift() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { address } = useWallet();
  const { toast } = useToast();
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
    colorScheme: 'default',
  });

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

      const newGift = await createGift.mutateAsync({
        id: nanoid(),
        senderAddress: address,
        tokenType: formData.tokenType,
        amount: formData.amount,
        message: formData.message,
        theme: formData.theme,
        visualAssets: { 
          senderName: formData.senderName,
          bgImage: formData.bgImage,
          sticker: formData.sticker,
          colorScheme: formData.colorScheme
        },
        status: 'created'
      });

      toast({ title: "Gift Created!", description: "Your gift link is ready to share." });
      setLocation(`/share/${newGift.id}`);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Something went wrong", 
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
                      <span className="font-bold">NFT (Coming Soon)</span>
                    </button>
                  </div>

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
                    <p className="text-sm text-muted-foreground">Balance: $1,240.50 USDC</p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold mb-2">Personalize it</h2>
                    <p className="text-muted-foreground">Make it special with a theme and message.</p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg">Choose a Theme</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {THEMES.map((theme) => (
                        <ThemeCard
                          key={theme.id}
                          {...theme}
                          isSelected={formData.theme === theme.id}
                          onSelect={() => setFormData({ ...formData, theme: theme.id })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg">Stickers & Backgrounds</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Sticker</Label>
                        <select 
                          className="w-full h-10 rounded-lg border-2 bg-white px-3"
                          value={formData.sticker}
                          onChange={(e) => setFormData({ ...formData, sticker: e.target.value })}
                        >
                          <option value="">None</option>
                          <option value="cake">🎂 Cake</option>
                          <option value="party">🥳 Party</option>
                          <option value="heart">❤️ Heart</option>
                          <option value="star">⭐ Star</option>
                          <option value="coffee">☕ Coffee</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Background Style</Label>
                        <select 
                          className="w-full h-10 rounded-lg border-2 bg-white px-3"
                          value={formData.colorScheme}
                          onChange={(e) => setFormData({ ...formData, colorScheme: e.target.value })}
                        >
                          <option value="default">Default</option>
                          <option value="warm">Warm Glow</option>
                          <option value="cool">Cool Breeze</option>
                          <option value="vibrant">Vibrant Energy</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bgImage" className="text-sm text-muted-foreground">Custom Background Image URL (Optional)</Label>
                      <Input 
                        id="bgImage"
                        placeholder="https://images.unsplash.com/..."
                        className="h-10 rounded-lg border-2"
                        value={formData.bgImage}
                        onChange={(e) => setFormData({ ...formData, bgImage: e.target.value })}
                      />
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

                  <div className={`p-8 rounded-2xl relative overflow-hidden ${THEMES.find(t => t.id === formData.theme)?.colorClass}`}>
                    <div className="relative z-10 bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-sm text-center space-y-4 border border-white/50">
                      <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase">You are sending</p>
                      <div className="text-5xl font-display font-bold text-foreground">
                        ${formData.amount} <span className="text-2xl text-muted-foreground">USDC</span>
                      </div>
                      <div className="h-px bg-border w-1/2 mx-auto my-4" />
                      <p className="font-handwriting text-2xl text-foreground/80 leading-relaxed">"{formData.message}"</p>
                      <p className="text-sm font-bold text-muted-foreground mt-4">- {formData.senderName || 'A friend'}</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Network Fee (Base)</span>
                    <span className="font-mono font-bold">~$0.05</span>
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
                    disabled={createGift.isPending}
                    className="rounded-xl px-8 h-12 text-lg shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700"
                  >
                    {createGift.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Wrappping Gift...
                      </>
                    ) : (
                      <>
                        Pay & Create Link <Send className="ml-2 h-5 w-5" />
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
