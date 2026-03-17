'use client';
import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';

/**
 * Common Phone Input component using react-phone-input-2.
 * Provides searchable country dropdown and consistent styling.
 */
const CustomPhoneInput = ({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Enter phone number',
  className = '',
  disabled = false,
  ...props
}) => {
  // Handle change to return E.164 format (with +) for backward compatibility
  const handleChange = (phone) => {
    if (!onChange) return;

    // If phone is not empty and doesn't start with +, prepend it
    const formattedValue = phone ? (phone.startsWith('+') ? phone : `+${phone}`) : '';
    onChange(formattedValue);
  };

  // Ensure the initial value has a + if it's meant to be international
  const displayValue = value ? (value.startsWith('+') ? value : `+${value}`) : value;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-bold mb-2 text-[rgb(var(--color-text))]">
          {label} {required && <span className="text-[rgb(var(--color-error))]">*</span>}
        </label>
      )}

      <div
        className={`phone-input-wrapper ${error ? 'phone-input-error' : 'hover:shadow-sm'} transition-shadow duration-300`}
      >
        <PhoneInput
          country={'us'}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          enableSearch={true}
          searchPlaceholder="Search country..."
          searchNotFound="No country found"
          containerClass="phone-input-container"
          inputClass="phone-input-field"
          buttonClass="phone-input-button"
          dropdownClass="phone-input-dropdown"
          masks={{
            in: '.. .... ....',
            us: '... ... ....',
            ae: '.. ... ....',
          }}
          {...props}
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-2 animate-fade-in">
          <div className="w-1 h-1 rounded-full bg-[rgb(var(--color-error))]" />
          <p className="text-[11px] font-bold text-[rgb(var(--color-error))] lowercase first-letter:uppercase">
            {error}
          </p>
        </div>
      )}

      <style jsx global>{`
        .phone-input-wrapper {
          position: relative;
          width: 100%;
        }
        .phone-input-container {
          width: 100% !important;
          height: auto !important;
        }
        .phone-input-field {
          width: 100% !important;
          height: 52px !important;
          background: rgb(var(--color-surface)) !important;
          border: 1px solid rgb(var(--color-border)) !important;
          border-radius: 12px !important;
          padding-left: 58px !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          color: rgb(var(--color-text)) !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .phone-input-wrapper:focus-within .phone-input-field {
          border-color: rgb(var(--color-primary)) !important;
          box-shadow: 0 0 0 4px rgb(var(--color-primary) / 0.1) !important;
        }
        .phone-input-error .phone-input-field {
          border-color: rgb(var(--color-error)) !important;
          background: rgb(var(--color-error) / 0.02) !important;
        }
        .phone-input-button {
          background: transparent !important;
          border: none !important;
          border-radius: 12px 0 0 12px !important;
          padding: 0 12px !important;
          width: 48px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: background 0.2s !important;
        }
        .phone-input-button:hover,
        .phone-input-button.open {
          background: rgb(var(--color-background)) !important;
        }
        .phone-input-button .selected-flag {
          width: 32px !important;
          height: 100% !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: transparent !important;
        }
        .phone-input-button .selected-flag .arrow {
          border-top-color: rgb(var(--color-text-muted)) !important;
          margin-left: 6px !important;
        }
        .phone-input-dropdown {
          background: rgb(var(--color-surface)) !important;
          border: 1px solid rgb(var(--color-border)) !important;
          border-radius: 12px !important;
          box-shadow: var(--shadow-xl) !important;
          margin-top: 8px !important;
          width: 300px !important;
          z-index: 100 !important;
          animation: fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          /* Remove overflow: hidden to allow internal scrolling */
          overflow: auto !important;
          max-height: 300px !important;
        }
        .phone-input-dropdown .search {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          padding: 12px !important;
          border-bottom: 1px solid rgb(var(--color-border)) !important;
          background: rgb(var(--color-background)) !important;
        }
        .phone-input-dropdown .search-box {
          width: 100% !important;
          height: 40px !important;
          border: 1px solid rgb(var(--color-border)) !important;
          border-radius: 8px !important;
          padding: 0 12px 0 36px !important;
          font-size: 0.8125rem !important;
          background: rgb(var(--color-surface)) !important;
          margin: 0 !important;
          transition: all 0.2s !important;
          /* Custom magnifying glass icon via background */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: 12px center !important;
        }
        .phone-input-dropdown .search-box:focus {
          border-color: rgb(var(--color-primary)) !important;
          ring: 2px rgb(var(--color-primary) / 0.1) !important;
          outline: none !important;
        }
        .phone-input-dropdown .country-list {
          margin: 0 !important;
          padding: 0 !important;
          list-style: none !important;
        }
        .phone-input-dropdown .country {
          padding: 10px 16px !important;
          font-size: 0.8125rem !important;
          font-weight: 500 !important;
          transition: background 0.1s !important;
          color: rgb(var(--color-text)) !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
        }
        .phone-input-dropdown .country:hover {
          background: rgb(var(--color-background)) !important;
        }
        .phone-input-dropdown .country.highlight {
          background: rgb(var(--color-primary) / 0.08) !important;
          color: rgb(var(--color-primary)) !important;
        }
        .phone-input-dropdown .country .dial-code {
          color: rgb(var(--color-text-muted)) !important;
          margin-left: auto !important;
          font-weight: 400 !important;
        }
      `}</style>
    </div>
  );
};

export default CustomPhoneInput;
