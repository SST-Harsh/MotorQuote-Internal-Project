import React from 'react';
import Select, { components } from 'react-select';
import { ChevronDown } from 'lucide-react';

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown size={16} className="text-[rgb(var(--color-text-muted))]" />
    </components.DropdownIndicator>
  );
};

const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  isSearchable = false,
  isDisabled = false,
  error = false,
  icon: Icon,
  className = '',
  name = '',
  size = 'md',
  inPortal = true,
  ...props
}) => {
  // Filter out options with truly empty values
  const nonEmptyOptions = options.filter(
    (opt) =>
      opt.value !== '' && opt.value !== undefined && opt.value !== null && opt.value !== 'all'
  );

  // If no meaningful options exist, hide and disable the component as requested
  if (nonEmptyOptions.length === 0) return null;

  const allFormattedOptions = options.map((opt) => ({
    value: opt.value,
    label: opt.label,
    isDisabled: opt.disabled,
  }));

  // Menu should not show strictly invalid values. Empty string or 'all' ARE allowed
  // so the user can use them to reset the dropdown if they made a selection.
  // However, the placeholder option itself (value='') should NEVER render inside
  // the menu's selectable items list to prevent an empty gap.
  const menuOptions = options
    .filter(
      (opt) =>
        opt.value !== undefined &&
        opt.value !== null &&
        String(opt.value).trim() !== '' &&
        String(opt.value).toLowerCase() !== 'all'
    )
    .map((opt) => ({
      value: opt.value,
      label: opt.label,
      isDisabled: opt.disabled,
    }));

  const selectedOption = allFormattedOptions.find((opt) => opt.value === value) || null;

  // Size-based configurations
  const sizeConfig = {
    sm: { height: '36px', fontSize: '13px', padding: '0 8px' },
    md: { height: '44px', fontSize: '14px', padding: '0 16px' },
    lg: { height: '52px', fontSize: '16px', padding: '0 20px' },
  }[size] || { height: '44px', fontSize: '14px', padding: '0 16px' };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      display: 'flex',
      gap: '2px',
      backgroundColor: 'rgb(var(--color-background))',
      borderColor: error
        ? 'rgb(var(--color-error))'
        : state.isFocused
          ? 'rgb(var(--color-primary))'
          : 'rgb(var(--color-border))',
      borderRadius: '12px',
      minHeight: sizeConfig.height,
      height: sizeConfig.height,
      paddingLeft: Icon ? '38px' : sizeConfig.padding.split(' ')[1],
      boxShadow: state.isFocused
        ? error
          ? '0 0 0 4px rgba(var(--color-error), 0.1)'
          : '0 0 0 4px rgba(var(--color-primary), 0.1)'
        : 'none',
      '&:hover': {
        borderColor: error ? 'rgb(var(--color-error))' : 'rgb(var(--color-primary)/0.5)',
      },
      transition: 'all 0.2s ease',
      cursor: isSearchable ? 'text' : 'pointer',
      justifyContent: 'flex-start',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0',
      height: '100%',
      flex: '1',
      minWidth: '0',
      display: 'flex',
      alignItems: 'center',
    }),
    input: (provided) => ({
      ...provided,
      color: 'rgb(var(--color-text))',
      fontSize: sizeConfig.fontSize,
      fontWeight: '500',
      margin: '0',
      padding: '0',
      caretColor: isSearchable ? 'inherit' : 'transparent',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'rgb(var(--color-text))',
      fontSize: sizeConfig.fontSize,
      fontWeight: '600',
      opacity: 0.6,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'rgb(var(--color-text))',
      fontSize: sizeConfig.fontSize,
      fontWeight: '600',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'rgb(var(--color-surface))',
      borderRadius: '16px',
      border: '1px solid rgb(var(--color-border))',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
      overflow: 'hidden',
      marginTop: '8px',
      padding: '4px',
      zIndex: 9999,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 10000,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px',
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgb(var(--color-border))',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'rgb(var(--color-text-muted)/0.3)',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'rgb(var(--color-primary))'
        : state.isFocused
          ? 'rgb(var(--color-background))'
          : 'transparent',
      color: state.isSelected ? '#ffffff' : 'rgb(var(--color-text))',
      padding: '10px 12px',
      borderRadius: '8px',
      fontSize: sizeConfig.fontSize,
      fontWeight: '500',
      cursor: 'pointer',
      marginTop: '2px',
      marginBottom: '2px',
      '&:active': {
        backgroundColor: 'rgb(var(--color-primary)/0.8)',
      },
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: `0 ${sizeConfig.padding.split(' ')[1]} 0 0`,
      color: 'rgb(var(--color-text-muted))',
      '&:hover': {
        color: 'rgb(var(--color-primary))',
      },
    }),
  };

  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <div
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] z-10 pointer-events-none flex items-center`}
        >
          <Icon size={size === 'sm' ? 14 : 18} />
        </div>
      )}
      <Select
        name={name}
        options={menuOptions}
        value={selectedOption}
        onChange={(option) => onChange({ target: { name, value: option ? option.value : '' } })}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        styles={customStyles}
        components={{ DropdownIndicator }}
        menuPortalTarget={inPortal && typeof document !== 'undefined' ? document.body : null}
        menuPlacement="auto"
        menuPosition={inPortal ? 'fixed' : 'absolute'}
        hideSelectedOptions={true}
        closeMenuOnScroll={true}
        {...props}
      />
    </div>
  );
};

export default CustomSelect;
