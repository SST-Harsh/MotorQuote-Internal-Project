import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatCard = ({ title, value, helperText, trend, icon, accent = '#6366f1', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-3 sm:p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 min-w-0 ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        '--card-accent': accent,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--card-accent)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-t-2xl"></div>

      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
          {title}
        </p>
        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] transition-colors group-hover:bg-[var(--card-accent)] group-hover:text-white">
          {icon}
        </div>
      </div>

      <div className="mb-3 overflow-hidden">
        <h3
          className="text-xl sm:text-2xl md:text-3xl font-bold text-[rgb(var(--color-text))] tracking-tight truncate"
          title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
        >
          {value}
        </h3>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
              trend.positive
                ? 'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] border-[rgb(var(--color-success))]/20'
                : 'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] border-[rgb(var(--color-error))]/20'
            }`}
          >
            {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span className="whitespace-nowrap">{trend.label}</span>
          </div>
        )}
        <span className="text-xs text-[rgb(var(--color-text-muted))] truncate opacity-80">
          {helperText}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
