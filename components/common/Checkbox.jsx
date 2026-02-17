const Checkbox = ({ label, checked, onChange, error, className = '', ...props }) => (
  <div className={className}>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-border focus:ring-2 focus:ring-primary cursor-pointer"
        style={{ accentColor: 'rgb(var(--color-primary))' }}
        {...props}
      />
      <span className="text-sm select-none text-text">{label}</span>
    </label>
    {error && (
      <p className="text-xs mt-1 text-error">{error}</p>
    )}
  </div>
);

export default Checkbox;

