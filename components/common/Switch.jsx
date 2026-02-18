import React from 'react';

const Switch = ({ checked, onChange, disabled, size = 'md', color = 'primary' }) => {
  const sizes = {
    sm: { w: 'w-8', h: 'h-4', circle: 'w-3 h-3', translate: 'translate-x-4' },
    md: { w: 'w-11', h: 'h-6', circle: 'w-4 h-4', translate: 'translate-x-5' },
    lg: { w: 'w-14', h: 'h-7', circle: 'w-5 h-5', translate: 'translate-x-7' },
  };

  const currentSize = sizes[size] || sizes.md;

  const activeColorClass = disabled
    ? 'bg-[rgb(var(--color-border))]'
    : checked
      ? `bg-[rgb(var(--color-${color}))]`
      : 'bg-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      className={`
                relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
                focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2
                ${currentSize.w} ${currentSize.h}
                ${activeColorClass}
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`
                    pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${currentSize.circle}
                    ${checked ? currentSize.translate : 'translate-x-0'}
                    mt-0.5 ml-0.5
                `}
      />
    </button>
  );
};

export default Switch;
