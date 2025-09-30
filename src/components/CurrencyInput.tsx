import React, { useState, useEffect } from 'react';
import { digitsOnly, formatCentsToBRL, parseToCentsFromMasked } from '../utils/currency';

type Props = {
  value: number | null;
  onChange: (v: number | null) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function CurrencyInput({
  value,
  onChange,
  name,
  id,
  placeholder = 'R$ 0,00',
  required = false,
  disabled = false,
  className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
}: Props) {
  const [displayValue, setDisplayValue] = useState('');

  // Sync display value when external value changes
  useEffect(() => {
    setDisplayValue(formatCentsToBRL(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digits = digitsOnly(inputValue);
    const cents = parseToCentsFromMasked(inputValue);
    
    // Update the display with formatted value
    const formatted = formatCentsToBRL(cents);
    setDisplayValue(formatted);
    
    // Call onChange with cents (or null if empty)
    onChange(cents > 0 ? cents : null);
  };

  const handleBlur = () => {
    // If required and value is empty, normalize to 0
    if (required && (value === null || value === 0)) {
      onChange(0);
      setDisplayValue(formatCentsToBRL(0));
    }
  };

  return (
    <input
      type="text"
      name={name}
      id={id}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
    />
  );
}
