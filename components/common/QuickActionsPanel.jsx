const QuickActionsPanel = ({ actions = [] }) => (
  <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-5 py-6 shadow-sm h-full flex flex-col">
    <div className="mb-5">
      <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Quick Actions</h3>
      <p className="text-xs text-[rgb(var(--color-text))]">Common tasks and shortcuts</p>
    </div>

    <div className="grid grid-cols-1 gap-3 flex-1">
      {actions.map((action, idx) => (
        <button
          key={action.label}
          onClick={action.actionType}
          type="button"
          className={`group relative w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ease-out
          ${idx === 0
              ? 'bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))] border-transparent text-white shadow-lg shadow-[rgb(var(--color-primary)/0.25)] hover:shadow-xl hover:scale-[1.02]'
              : 'bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] hover:border-[rgb(var(--color-primary)/0.5)] hover:bg-[rgb(var(--color-surface))] hover:shadow-md'
            }`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-110
              ${idx === 0
                ? 'bg-white/20 text-white backdrop-blur-sm'
                : 'bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))]'
              }`}>
              {action.icon}
            </div>

            <div className="text-left">
              <p className={`font-bold text-sm leading-tight mb-0.5 ${idx === 0 ? 'text-white' : 'text-[rgb(var(--color-text))]'}`}>
                {action.label}
              </p>
              <p className={`text-[11px] font-medium ${idx === 0 ? 'text-white/80' : 'text-[rgb(var(--color-text))]'}`}>
                {action.description}
              </p>
            </div>
          </div>

          <div className={`transform transition-transform duration-300 group-hover:translate-x-1 ${idx === 0 ? 'text-white' : 'text-[rgb(var(--color-text))]'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
      ))}

      {/* Fallback empty slots for visual balance if needed */}
      {actions.length === 0 && (
        <div className="p-8 text-center text-[rgb(var(--color-text))] bg-[rgb(var(--color-background))] rounded-xl border border-dashed border-[rgb(var(--color-border))]">
          No quick actions configured.
        </div>
      )}
    </div>
  </div>
);

export default QuickActionsPanel;

