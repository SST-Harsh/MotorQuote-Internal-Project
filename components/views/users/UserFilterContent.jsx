import React from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import { Search, User, CheckCircle, Building2 } from 'lucide-react';
import TagFilter from '../../common/tags/TagFilter';

export default function UserFilterContent({
  activeFilters,
  setActiveFilters,
  roles = [],
  dealerships = [],
  tagOptions = [],
}) {
  const { t } = useTranslation('users');

  return (
    <>
      {/* Name Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--color-text))] mb-3">
          <Search size={16} className="text-[rgb(var(--color-primary))]" />
          {t('filters.searchByName')}
        </label>
        <input
          type="text"
          value={activeFilters.name || ''}
          onChange={(e) => setActiveFilters({ ...activeFilters, name: e.target.value })}
          placeholder={t('filters.enterName')}
          className="w-full px-4 py-2.5 border border-[rgb(var(--color-border))] rounded-lg bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--color-text))] mb-3">
          <User size={16} className="text-[rgb(var(--color-primary))]" />
          {t('filters.role')}
        </label>
        <div className="space-y-2">
          {(Array.isArray(roles) ? roles : []).map((role) => (
            <label
              key={role.value}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgb(var(--color-background))] cursor-pointer transition-colors group"
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={(activeFilters.roles || []).includes(role.value)}
                  onChange={(e) => {
                    const currentRoles = activeFilters.roles || [];
                    if (e.target.checked) {
                      setActiveFilters({
                        ...activeFilters,
                        roles: [...currentRoles, role.value],
                      });
                    } else {
                      setActiveFilters({
                        ...activeFilters,
                        roles: currentRoles.filter((r) => r !== role.value),
                      });
                    }
                  }}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] checked:border-[rgb(var(--color-primary))] checked:bg-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1 transition-all"
                />
                <CheckCircle
                  size={10}
                  className="pointer-events-none absolute left-0.5 top-0.5 text-white opacity-0 peer-checked:opacity-100"
                />
              </div>
              <span className="text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                {role.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--color-text))] mb-3">
          <CheckCircle size={16} className="text-[rgb(var(--color-primary))]" />
          {t('filters.status')}
        </label>
        <div className="space-y-2">
          {['active', 'inactive', 'suspended'].map((status) => (
            <label
              key={status}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                activeFilters.statuses?.includes(status)
                  ? 'bg-[rgb(var(--color-primary))]/5 border-[rgb(var(--color-primary))]'
                  : 'bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))]/50'
              }`}
            >
              <input
                type="checkbox"
                checked={activeFilters.statuses?.includes(status) || false}
                onChange={(e) => {
                  const current = activeFilters.statuses || [];
                  if (e.target.checked) {
                    setActiveFilters({ ...activeFilters, statuses: [...current, status] });
                  } else {
                    setActiveFilters({
                      ...activeFilters,
                      statuses: current.filter((s) => s !== status),
                    });
                  }
                }}
                className="rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
              />
              <span className="text-sm text-[rgb(var(--color-text))] font-medium">
                {t(`statuses.${status}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      <div>
        <TagFilter
          selectedTags={activeFilters.tags || []}
          onChange={(tags) => setActiveFilters({ ...activeFilters, tags })}
          type="user"
          options={tagOptions}
        />
      </div>

      {dealerships.length > 0 && (
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--color-text))] mb-3">
            <Building2 size={16} className="text-[rgb(var(--color-primary))]" />
            Dealership
          </label>
          <select
            value={activeFilters.dealership || ''}
            onChange={(e) => setActiveFilters({ ...activeFilters, dealership: e.target.value })}
            className="w-full px-4 py-2.5 border border-[rgb(var(--color-border))] rounded-lg bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all"
          >
            <option value="">All Dealerships</option>
            {(Array.isArray(dealerships) ? dealerships : []).map((dealer) => (
              <option key={dealer.value} value={dealer.value}>
                {dealer.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
