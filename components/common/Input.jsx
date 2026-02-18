import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      type = 'text',
      placeholder,
      value,
      onChange,
      icon: Icon,
      rightIcon: RightIcon,
      onRightIconClick,
      error,
      label,
      required = false,
      className = '',
      iconClassName,
      inputClassName, // Allow custom styling for the input element
      labelClassName, // Allow custom styling for the label
      forceAlphanumeric = false, // New prop for VIN strict validation
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e) => {
      // Number validation: allow backspace, tab, enter, delete, arrows, numbers
      if (type === 'number') {
        const allowedKeys = [
          'Backspace',
          'Tab',
          'Enter',
          'Delete',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          '.',
        ];
        if (!allowedKeys.includes(e.key) && !/^[0-9]$/.test(e.key)) {
          e.preventDefault();
        }
      }

      // Alphanumeric validation (VIN): allow backspace, tab, enter, delete, arrows, alphanumeric
      if (forceAlphanumeric) {
        const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', '-'];
        if (!allowedKeys.includes(e.key) && !/^[a-zA-Z0-9]$/.test(e.key)) {
          e.preventDefault();
        }
      }

      if (props.onKeyDown) props.onKeyDown(e);
    };

    const handleInput = (e) => {
      if (forceAlphanumeric) {
        e.target.value = e.target.value.toUpperCase();
      }
      if (props.onInput) props.onInput(e);
    };

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            className={`block text-sm font-medium mb-1.5 text-[rgb(var(--color-text))] ${labelClassName || ''}`}
          >
            {label} {required && <span className="text-[rgb(var(--color-error))]">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]">
              <Icon size={20} />
            </div>
          )}
          {type === 'textarea' ? (
            <textarea
              ref={ref}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              className={`w-full py-3 border rounded-md focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm min-h-[100px] resize-y ${
                error
                  ? 'border-error bg-error/5 focus:ring-error/10 focus:border-error'
                  : 'border-border bg-surface'
              } ${Icon ? 'ps-10' : 'ps-4'} ${RightIcon ? 'pe-12' : 'pe-4'} text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] ${inputClassName || ''}`}
              {...props}
            />
          ) : (
            <input
              ref={ref}
              type={type}
              placeholder={placeholder}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className={`w-full py-3 border rounded-md focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm ${
                error
                  ? 'border-error bg-error/5 focus:ring-error/10 focus:border-error'
                  : 'border-border bg-surface'
              } ${Icon ? 'ps-10' : 'ps-4'} ${RightIcon ? 'pe-12' : 'pe-4'} text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] ${inputClassName || ''}`}
              {...props}
            />
          )}
          {RightIcon && type !== 'textarea' && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
            >
              <RightIcon size={20} />
            </button>
          )}
        </div>
        {error && <p className="text-xs mt-1 text-[rgb(var(--color-error))]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
