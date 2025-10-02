// types/nepali-datepicker-reactjs.d.ts
declare module '@sbmdkl/nepali-datepicker-reactjs' {
  interface DatePickerProps {
    value?: string;
    onChange: (dates: { bsDate: string; adDate: string }) => void;
    theme?: string;
    className?: string;
  }
  const Calendar: React.FC<DatePickerProps>;
  export default Calendar;
}
