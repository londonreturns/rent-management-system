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

// Calculate deadline day (1 day before the given date) - returns just the day number for recurring monthly deadline
export function calculateDeadlineDay(dateString: string): number {
  if (!dateString) return 1;

  try {
    // Parse the date string (format: YYYY-MM-DD)
    const parts = dateString.split('-');
    if (parts.length !== 3) return 1;

    let day = parseInt(parts[2]);

    // Subtract 1 day
    day -= 1;

    // If it becomes 0, it means the last day of previous month
    // For recurring deadline, we'll use day 30 as a safe default
    if (day < 1) {
      day = 30; // Safe default for last day of month
    }

    return day;
  } catch (error) {
    console.error('Error calculating deadline day:', error);
    return 1;
  }
}

// Legacy function for backward compatibility (still used in some places)
export function calculateDeadlineDate(dateString: string): string {
  if (!dateString) return "";

  try {
    // Parse the date string (format: YYYY-MM-DD)
    const parts = dateString.split('-');
    if (parts.length !== 3) return "";

    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    let day = parseInt(parts[2]);

    // Subtract 1 day
    day -= 1;

    // Handle month boundaries
    if (day < 1) {
      month -= 1;

      // Handle year boundaries
      if (month < 1) {
        month = 12;
        year -= 1;
      }

      // Get the number of days in the previous month
      // Create a NepaliDate for the last day of previous month to get days count
      const prevMonthDate = new NepaliDate(year, month, 1);
      const daysInPrevMonth = prevMonthDate.daysInMonth();
      day = daysInPrevMonth;
    }

    // Format back to YYYY-MM-DD
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating deadline date:', error);
    return "";
  }
}