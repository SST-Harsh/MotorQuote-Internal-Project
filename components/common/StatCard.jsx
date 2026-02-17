const StatCard = ({ title, value, helperText, trend, icon, accent }) => (
  <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-6 py-5 shadow-sm flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-[rgb(var(--color-text))]">{title}</p>
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: `${accent}22`, color: accent }}
      >
        {icon}
      </span>
    </div>
    <p className="text-3xl font-bold text-[rgb(var(--color-text))]">{value}</p>
    <div className="flex items-center justify-between text-sm">
      <span className="text-[rgb(var(--color-text))]">{helperText}</span>
      {trend && (
        <span className={`font-semibold ${trend.positive ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-error))]'}`}>
          {trend.positive ? '▲' : '▼'} {trend.label}
        </span>
      )}
    </div>
  </div>
);

export default StatCard;

