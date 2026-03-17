'use client';
import React from 'react';
import { Filter } from 'lucide-react';

/**
 * A reusable Filter button component to ensure consistency across the project.
 *
 * @param {Object} props
 * @param {Function} props.onClick - Function to call when button is clicked
 * @param {string} [props.label="Filters"] - Text label for the button
 * @param {boolean} [props.active=false] - Whether filters are currently active (shows a badge or different styling)
 * @param {string} [props.className=""] - Additional CSS classes
 * @param {React.ReactNode} [props.icon] - Optional custom icon
 */
const FilterButton = ({
  onClick,
  label = 'Filters',
  active = false,
  className = '',
  icon: Icon = Filter,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
                flex items-center gap-2 h-11 px-4 
                bg-[rgb(var(--color-surface))] 
                border border-[rgb(var(--color-border))] 
                rounded-xl text-sm font-semibold 
                text-[rgb(var(--color-text))] 
                hover:bg-[rgb(var(--color-background))] 
                hover:border-[rgb(var(--color-border-hover))] 
                transition-all shadow-sm shrink-0
                ${active ? 'ring-2 ring-[rgb(var(--color-primary))/0.2] border-[rgb(var(--color-primary))/0.3]' : ''}
                ${className}
            `}
    >
      <Icon
        size={16}
        className={
          active ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-muted))]'
        }
      />
      <span>{label}</span>
      {active && (
        <span className="flex h-2 w-2 rounded-full bg-[rgb(var(--color-primary))] ml-0.5"></span>
      )}
    </button>
  );
};

export default FilterButton;
