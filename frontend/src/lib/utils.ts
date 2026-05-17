import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function scaleAmount(amount: string, ratio: number): string {
  if (!amount || ratio === 1) return amount;

  // Handle fractions like "1/2"
  if (amount.includes('/')) {
    const [num, den] = amount.split('/').map(Number);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      const val = (num / den) * ratio;
      return formatNumber(val);
    }
  }

  // Handle normal numbers
  const num = parseFloat(amount);
  if (!isNaN(num)) {
    return formatNumber(num * ratio);
  }

  return amount;
}

function formatNumber(num: number): string {
  // If it's a whole number, return it as is
  if (num % 1 === 0) return num.toString();
  
  // Otherwise, round to 2 decimal places and remove trailing zeros
  return parseFloat(num.toFixed(2)).toString();
}
