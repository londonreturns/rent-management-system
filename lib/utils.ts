import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert Bikram Sambat date string to Gregorian Date
export function convertBSToGregorian(bsDateString: string): Date | null {
  if (!bsDateString) return null;
  
  try {
    // Parse BS date string (format: "YYYY-MM-DD")
    const [year, month, day] = bsDateString.split('-').map(Number);
    
    // Simple conversion: BS year 2080 ≈ AD year 2023
    // This is a basic approximation - for production use, consider a proper BS to AD conversion library
    const adYear = year - 57; // Approximate conversion
    const adDate = new Date(adYear, month - 1, day);
    
    return adDate;
  } catch (error) {
    console.error('Error converting BS date to Gregorian:', error);
    return null;
  }
}