const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  label,
  required = false,
  className = '',
  ...props
}) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--color-text))]">
        {label} {required && <span className="text-[rgb(var(--color-error))]">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]">
          <Icon size={20} />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all text-sm ${error ? 'border-[rgb(var(--color-error))] bg-[rgb(var(--color-error))/0.05]' : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]'
          } ${Icon ? 'pl-12' : ''} text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))]`}
        {...props}
      />
    </div>
    {error && (
      <p className="text-xs mt-1 text-[rgb(var(--color-error))]">
        {error}
      </p>
    )}
  </div>
);

export default Input;

