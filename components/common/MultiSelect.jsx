import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';

/**
 * MultiSelect Component
 * Allows selecting multiple options from a list with a search input and removable badges.
 *
 * @param {Array} value - Array of selected values
 * @param {Function} onChange - Callback function when value changes
 * @param {Array} options - Array of available options [{ label, value }, ...]
 * @param {String} placeholder - Placeholder text
 * @param {String} labelKey - Key for label in options (default: 'label')
 * @param {String} valueKey - Key for value in options (default: 'value')
 * @param {String} className - Additional CSS classes
 */
const MultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder = 'Select options...',
  labelKey = 'label',
  valueKey = 'value',
  className = '',
  readOnly = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Normalize value to always be an array
  const safeValue = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const selectedItems = useMemo(() => {
    return safeValue
      .map((v) =>
        (Array.isArray(options) ? options : []).find((o) => String(o[valueKey]) === String(v))
      )
      .filter(Boolean);
  }, [safeValue, options, valueKey]);

  const suggestions = useMemo(() => {
    return (Array.isArray(options) ? options : []).filter(
      (o) =>
        !safeValue.some((v) => String(v) === String(o[valueKey])) &&
        String(o[labelKey] || '')
          .toLowerCase()
          .includes(inputValue.toLowerCase())
    );
  }, [options, safeValue, inputValue, labelKey, valueKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    if (readOnly) return;
    onChange([...safeValue, item[valueKey]]);
    setInputValue('');
    // Keep open if more suggestions exist, or close for cleaner UX?
    // Closing is usually better for "select" behavior
    setIsOpen(false);
  };

  const handleRemove = (itemValue) => {
    if (readOnly) return;
    onChange(safeValue.filter((v) => String(v) !== String(itemValue)));
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div
        className={`
                    flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[rgb(var(--color-surface))]
                    border border-[rgb(var(--color-border))]
                    ${readOnly ? 'bg-[rgb(var(--color-background))] cursor-not-allowed opacity-60' : 'focus-within:ring-2 focus-within:ring-[rgb(var(--color-primary))]/20 cursor-text'}
                    transition-all duration-300 min-h-[44px]
                `}
        onClick={() => !readOnly && setIsOpen(true)}
      >
        {selectedItems.map((item) => (
          <div
            key={item[valueKey]}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] rounded-lg text-xs font-bold border border-[rgb(var(--color-primary))]/20 group/badge animate-in fade-in zoom-in duration-200"
          >
            <span className="max-w-[120px] truncate">{item[labelKey]}</span>
            {!readOnly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item[valueKey]);
                }}
                className="hover:bg-[rgb(var(--color-primary))]/20 rounded-full p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={safeValue.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] border-none p-0 focus:ring-0 text-sm bg-transparent placeholder:text-[rgb(var(--color-text-muted))]"
          />
        )}

        <ChevronDown
          size={14}
          className={`text-[rgb(var(--color-text-muted))] mr-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && !readOnly && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[rgb(var(--color-surface))] rounded-2xl shadow-xl border border-[rgb(var(--color-border))] py-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300 max-h-60 overflow-y-auto no-scrollbar">
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                key={item[valueKey]}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2 hover:bg-[rgb(var(--color-background))] flex items-center justify-between group transition-colors"
              >
                <span className="text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                  {item[labelKey]}
                </span>
                <Check
                  size={14}
                  className="text-[rgb(var(--color-primary))] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-[rgb(var(--color-text-muted))] italic text-center">
              {inputValue ? 'No matching options found' : 'No more options available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
