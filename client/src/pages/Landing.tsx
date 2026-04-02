import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Gift, Zap, ShieldCheck, ArrowRight, Clock, Lock } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { BaseIcon } from "@/components/BaseIcon";

export default function Landing() {
  const { isConnected, connect } = useWallet();
  const [, setLocation] = useLocation();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleCreateClick = () => {
    if (!isConnected) {
      // Trigger connection — Coinbase Smart Wallet will prompt
      connect();
    }
    setLocation("/create");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-10 sm:py-20 relative overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/30 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-primary/20 backdrop-blur-sm shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium text-muted-foreground">Now live on Base</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 backdrop-blur-sm shadow-sm">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Gifts auto-refund after 14 days</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold leading-tight tracking-tight text-foreground">
            Send crypto gifts with{" "}
            <span className="inline sm:block" />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-secondary animate-gradient-x">
              style & emotion
            </span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto font-body">
            Create beautiful, animated gifting experiences on the blockchain. 
            Send USDC or NFTs wrapped in a personalized digital card.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              size="lg" 
              onClick={handleCreateClick}
              className="h-14 px-8 text-lg rounded-full font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all"
            >
              Start Gifting <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <button 
              onClick={() => setShowHowItWorks(true)}
              className="text-muted-foreground font-medium hover:text-primary transition-colors"
            >
              How it works
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-6xl mx-auto w-full px-4">
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-yellow-500" />}
            title="Gasless for Receivers"
            description="Recipients can claim their gifts without needing ETH for gas fees."
            delay={0.2}
          />
          <FeatureCard
            icon={<Gift className="h-8 w-8 text-pink-500" />}
            title="Personalized Experience"
            description="Wrap your assets in beautiful themes with custom messages."
            delay={0.3}
          />
          <FeatureCard
            icon={<Lock className="h-8 w-8 text-green-500" />}
            title="Secret-Key Security"
            description="A cryptographic secret embedded in the link ensures only the intended recipient can claim — not blockchain observers."
            delay={0.4}
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8 text-amber-500" />}
            title="Auto-Refund in 14 Days"
            description="If the recipient doesn't claim within 14 days, the gift is automatically returned to the sender."
            delay={0.5}
          />
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-2">Built on Base <BaseIcon /></p>
      </footer>

      <HowItWorks isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white/60 backdrop-blur-sm border border-white/20 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all text-left"
    >
      <div className="bg-background rounded-2xl p-3 w-fit mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
