import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Thermometer, ArrowRightLeft, Copy, Check } from 'lucide-react';

interface CalculatorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorSidebar: React.FC<CalculatorSidebarProps> = ({ isOpen, onClose }) => {
  const [fahrenheit, setFahrenheit] = useState<string>('');
  const [celsius, setCelsius] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!celsius) return;
    navigator.clipboard.writeText(`${celsius}°C`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const convertToCelsius = (f: string) => {
    const val = parseFloat(f);
    if (isNaN(val)) {
      setCelsius('');
      return;
    }
    const res = (val - 32) * 5 / 9;
    setCelsius(res.toFixed(1));
  };

  const convertToFahrenheit = (c: string) => {
    const val = parseFloat(c);
    if (isNaN(val)) {
      setFahrenheit('');
      return;
    }
    const res = (val * 9 / 5) + 32;
    setFahrenheit(res.toFixed(1));
  };

  useEffect(() => {
    if (!isOpen) {
      // Clear values when closed if desired
    }
  }, [isOpen]);

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[350px] bg-card border-l shadow-2xl z-[101] transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2 font-bold text-primary">
              <Thermometer className="h-5 w-5" />
              <span>Kitchen Calculator</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="flex-grow p-6 space-y-8 overflow-y-auto">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                Temperature Conversion
              </h3>
              
              <div className="grid gap-6 p-4 rounded-xl border bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="fahrenheit">Fahrenheit (°F)</Label>
                  <div className="relative">
                    <Input 
                      id="fahrenheit"
                      type="number"
                      placeholder="350"
                      value={fahrenheit}
                      onChange={(e) => {
                        setFahrenheit(e.target.value);
                        convertToCelsius(e.target.value);
                      }}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">°F</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowRightLeft className="h-4 w-4 text-primary rotate-90 sm:rotate-0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="celsius">Celsius (°C)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Input 
                        id="celsius"
                        type="number"
                        placeholder="175"
                        value={celsius}
                        onChange={(e) => {
                          setCelsius(e.target.value);
                          convertToFahrenheit(e.target.value);
                        }}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">°C</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleCopy}
                      disabled={!celsius}
                      title="Copy to clipboard"
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          
          <div className="p-4 border-t bg-muted/50">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close Calculator
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
