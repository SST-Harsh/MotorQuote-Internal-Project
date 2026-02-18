const Checkbox = ({
  label,
  checked,
  onChange,
  error,
  className = '',
  labelClassName = '',
  checkboxClassName = '',
  ...props
}) => (
  <div className={className}>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={`w-4 h-4 rounded border-border cursor-pointer ${checkboxClassName}`}
        style={{ accentColor: 'rgb(var(--color-primary))' }}
        {...props}
      />
      <span className={`text-sm select-none text-[rgb(var(--color-text))] ${labelClassName}`}>
        {label}
      </span>
    </label>
    {error && <p className="text-xs mt-1 text-[rgb(var(--color-error))]">{error}</p>}
  </div>
);

export default Checkbox;
