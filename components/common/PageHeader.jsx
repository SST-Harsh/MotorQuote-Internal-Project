import React from 'react';
import PropTypes from 'prop-types';

/**
 * PageHeader - Consistent, responsive page header component
 *
 * @param {string} title - Page title (required)
 * @param {string|ReactNode} subtitle - Page subtitle or description
 * @param {ReactNode} actions - Action buttons, filters, etc.
 * @param {ReactNode[]} stats - Array of StatCard components
 * @param {ReactNode} icon - Optional icon to display with title
 * @param {boolean} gradient - Whether to use gradient background
 * @param {string} className - Additional CSS classes
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  stats = [],
  icon,
  gradient = false,
  className = '',
}) {
  const headerContent = (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-[rgb(var(--color-text))] flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--color-primary))] flex items-center justify-center shrink-0">
                <div className="text-white">{icon}</div>
              </div>
            )}
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-sm md:text-base text-[rgb(var(--color-text-muted))] mt-1 md:mt-2 leading-relaxed ${icon ? 'ml-[52px]' : ''}`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions Section */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">{stats}</div>
      )}
    </>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {gradient ? (
        <div className="bg-gradient-to-r from-[rgb(var(--color-primary))]/5 to-transparent p-6 rounded-2xl border border-[rgb(var(--color-border))]">
          {headerContent}
        </div>
      ) : (
        headerContent
      )}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  actions: PropTypes.node,
  stats: PropTypes.arrayOf(PropTypes.node),
  icon: PropTypes.node,
  gradient: PropTypes.bool,
  className: PropTypes.string,
};
