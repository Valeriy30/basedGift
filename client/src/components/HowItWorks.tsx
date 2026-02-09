import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gift, Wallet, Link as LinkIcon, ArrowRight, ArrowLeft, X } from 'lucide-react';

const STEPS = [
  {
    icon: <Gift size={48} className="text-primary" />,
    title: 'Choose Your Gift',
    description: 'Select what you want to send: USDC, ETH, or an NFT. Set the amount and personalize it with colors, stickers, and a message.',
    illustration: '🎁',
  },
  {
    icon: <Wallet size={48} className="text-blue-500" />,
    title: 'Secure in Smart Contract',
    description: 'Your gift is safely locked in a smart contract on the Base blockchain. Only the recipient can claim it.',
    illustration: '🔐',
  },
  {
    icon: <LinkIcon size={48} className="text-purple-500" />,
    title: 'Share the Magic Link',
    description: 'Get a unique link to share via WhatsApp, Telegram, or any messaging app. The recipient opens it in their browser.',
    illustration: '🔗',
  },
  {
    icon: <Gift size={48} className="text-green-500" />,
    title: 'Recipient Claims',
    description: 'They connect their wallet and claim the gift. Funds are instantly transferred from the smart contract to their wallet.',
    illustration: '✨',
  },
];

interface HowItWorksProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorks({ isOpen, onClose }: HowItWorksProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-display font-bold">How It Works</DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Progress Bar */}
          <div className="px-6 py-4">
            <div className="flex justify-between mb-2">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`text-xs font-bold ${
                    i <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 py-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-6"
              >
                <div className="text-8xl mb-4">{STEPS[currentStep].illustration}</div>
                <div className="flex justify-center mb-4">{STEPS[currentStep].icon}</div>
                <h3 className="text-2xl font-bold">{STEPS[currentStep].title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                  {STEPS[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>

            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStep ? 'bg-primary w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} className="rounded-xl">
              {currentStep === STEPS.length - 1 ? (
                <>
                  Got it! <X className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
