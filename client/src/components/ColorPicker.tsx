import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pipette } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  const handleHexChange = (newHex: string) => {
    setHexInput(newHex);
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      onChange(newHex);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setHexInput(newColor);
    onChange(newColor);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3 px-3 border-2"
          >
            <div
              className="w-8 h-8 rounded-md border-2 border-border shadow-sm"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-sm">{value.toUpperCase()}</span>
            <Pipette size={16} className="ml-auto text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 rounded-xl" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Color Picker</Label>
              <div className="relative">
                <input
                  type="color"
                  value={value}
                  onChange={handleColorPickerChange}
                  className="w-full h-32 rounded-lg cursor-pointer border-2 border-border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Hex Code</Label>
              <Input
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#3B82F6"
                className="font-mono"
                maxLength={7}
              />
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {[
                '#ef4444', '#f97316', '#f59e0b', '#eab308',
                '#84cc16', '#10b981', '#14b8a6', '#06b6d4',
                '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
                '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setHexInput(color);
                    onChange(color);
                  }}
                  style={{ backgroundColor: color }}
                  className="w-full aspect-square rounded-md hover:scale-110 transition-transform border border-border"
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
