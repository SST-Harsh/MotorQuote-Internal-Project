import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, helperText, trend, icon, accent = '#CCFF00', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between rounded-3xl border-0 bg-[rgb(var(--color-surface))] p-5 shadow-sm transition-all duration-300 hover:shadow-md min-w-0 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        '--card-accent': accent,
      }}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          {/* Icon with soft background */}
          <div className="p-2.5 rounded-xl bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] group-hover:bg-[var(--card-accent)] group-hover:text-black transition-colors duration-300">
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                trend.positive ? 'bg-green-100/10 text-green-500' : 'bg-red-100/10 text-red-500'
              }`}
            >
              {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend.label}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-[rgb(var(--color-text-muted))] mb-1">{title}</p>
          <h3
            className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-text-dark))] dark:text-[rgb(var(--color-text))] tracking-tight truncate transition-colors duration-300"
            title={
              typeof value === 'string' || typeof value === 'number' ? String(value) : undefined
            }
          >
            {value}
          </h3>
        </div>

        <div className="mt-auto pt-4">
          <span className="text-sm text-[rgb(var(--color-text-muted))] font-medium">
            {helperText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
