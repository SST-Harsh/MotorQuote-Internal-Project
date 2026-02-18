import React from 'react';
export default function TabNavigation({
  activeTab,
  onTabChange,
  tabs,
  className = '',
  scrollable = false,
}) {
  return (
    <div
      className={`flex gap-2 sm:space-x-1 sm:gap-0 bg-[rgb(var(--color-surface))] p-1 rounded-xl border border-[rgb(var(--color-border))] w-full sm:w-fit ${scrollable ? 'flex-nowrap overflow-x-auto no-scrollbar' : 'flex-wrap'} ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgb(var(--color-primary))]/20'
                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {Icon && <Icon size={16} />}
              <span>{tab.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
