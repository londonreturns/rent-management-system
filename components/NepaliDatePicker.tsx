// components/NepaliDatePicker.tsx
import React from "react";
import Calendar from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";

interface NepaliDatePickerProps {
  value?: string;
  onChange: (bsDate: string, adDate: string) => void;
  placeholder?: string;
  className?: string;
}

const NepaliDatePicker: React.FC<NepaliDatePickerProps> = ({
  value = "",
  onChange,
  placeholder = "Select date",
  className = "",
}) => {
  const handleDate = ({
    bsDate,
    adDate,
  }: {
    bsDate: string;
    adDate: string;
  }) => {
    onChange(bsDate, adDate);
  };

  return (
    <div className={`nepali-datepicker-container ${className}`}>
      <Calendar 
        onChange={handleDate} 
        theme="deepdark"
        value={value}
      />
    </div>
  );
};

export default NepaliDatePicker;
