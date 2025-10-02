declare module 'nepali-datetime' {
  class NepaliDate {
    constructor(year: number, month: number, day: number);

    // Convert the Nepali date to a JavaScript Date object
    toDate(): Date; 

    // Static method to create a NepaliDateTime instance from a Nepali (Bikram Sambat) date
    static fromBS(year: number, month: number, day: number): NepaliDateTime; 

    // Convert the Nepali date to the Nepali year/month/day string format
    toBS(): string; // Returns the date in the Nepali Date (Bikram Sambat) format
    
    // Convert Nepali date to a formatted string
    format(format: string): string; // Formats the Nepali date into a string, e.g., 'YYYY-MM-DD'

    // Get the Nepali day of the week
    dayOfWeek(): number; // Returns the day of the week for the Nepali date (0 for Sunday, 6 for Saturday)
    
    // Get the Nepali month name in Nepali
    monthName(): string; // Returns the Nepali month name

    // Get the Nepali date as a plain day number (1-31)
    dayOfMonth(): number; // Returns the Nepali day of the month

    // Get the Nepali year
    year(): number; // Returns the Nepali year

    // Get the Nepali month (1-12)
    month(): number; // Returns the Nepali month number (1 to 12)

    // Get the Nepali date (1-31)
    day(): number; // Returns the Nepali day of the month (1 to 31)
    
    // Get the number of days in the current Nepali month
    daysInMonth(): number; // Returns the total number of days in the Nepali month

    // Get the number of days in the current Nepali year
    daysInYear(): number; // Returns the total number of days in the Nepali year
    
    // Checks if the Nepali date is a leap year
    isLeapYear(): boolean; // Returns true if the Nepali year is a leap year, otherwise false
  }

  export default NepaliDateTime;
}
