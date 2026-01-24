import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  colorClass: string; // CSS class for background
}

export function ThemeCard({ id, name, description, isSelected, onSelect, colorClass }: ThemeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer rounded-xl p-6 border-2 transition-all overflow-hidden",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
          : "border-border hover:border-primary/50 shadow-sm hover:shadow-md",
        "bg-card"
      )}
    >
      <div className={cn("absolute inset-0 opacity-10", colorClass)} />
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h3 className="font-display text-lg font-bold">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {isSelected && (
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <Check size={16} strokeWidth={3} />
          </div>
        )}
      </div>
      
      {/* Decorative swatch */}
      <div className={cn("mt-4 h-12 rounded-lg w-full opacity-80", colorClass)} />
    </motion.div>
  );
}
