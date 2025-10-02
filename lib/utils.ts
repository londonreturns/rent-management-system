import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import NepaliDate from "nepali-datetime"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert Nepali date to English format
export function nepaliToEnglishDate(nepaliDateString: string): string {
  if (!nepaliDateString) return "";
  
  try {
    // Convert Nepali numerals to English numerals
    const nepaliToEnglishMap: { [key: string]: string } = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    };
    
    let englishDateString = nepaliDateString;
    for (const [nepali, english] of Object.entries(nepaliToEnglishMap)) {
      englishDateString = englishDateString.replace(new RegExp(nepali, 'g'), english);
    }
    
    return englishDateString;
  } catch (error) {
    console.error('Error converting Nepali to English date:', error);
    return nepaliDateString; // Return original if conversion fails
  }
}

// Calculate deadline date (1 day before the given date)
export function calculateDeadlineDate(dateString: string): string {
  if (!dateString) return "";
  
  try {
    const nepaliDate = new NepaliDate(dateString);
    // Subtract 1 day
    nepaliDate.setDate(nepaliDate.getDate() - 1);
    return nepaliDate.format('YYYY-MM-DD');
  } catch (error) {
    console.error('Error calculating deadline date:', error);
    return "";
  }
}