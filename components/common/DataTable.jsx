'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, ArrowUpDown, X, Filter, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Pagination } from '@mui/material';
import { useTranslation } from '@/context/LanguageContext';
import Image from 'next/image';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';

const DataTable = ({
  data = [],
  columns = [],
  searchKeys = ['name', 'email'],
  filterOptions = [], // Array of { key: 'status', label: 'Status', options: [{value, label}] }
  onSelectionChange,
  selectedIds: externalSelectedIds, // New: controlled selection
  itemsPerPage = 5,
  searchPlaceholder = 'Search...',
  highlightId = null,
  extraControls = null,
  className = '',
  serverSide = false,
  serverTotalPages = 0,
  serverCurrentPage = 1,
  onServerPageChange,
  manualFiltering = false,
  onSearchChange,
  onRowClick,
  onFilterClick, // New: standard filter button handler
  showFilter = !!onFilterClick, // New: toggle standard filter button
  onClearFilters, // New: clear filter button handler
  showClearFilter = false, // New: toggle clear filter button
}) => {
  const { t } = useTranslation('common');
  const { preferences } = usePreference();
  const effectiveItemsPerPage =
    itemsPerPage !== 5 ? itemsPerPage : preferences.items_per_page || 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(externalSelectedIds || []);
  const [activeHighlightId, setActiveHighlightId] = useState(highlightId);

  // Sync with external selection
  useEffect(() => {
    if (externalSelectedIds !== undefined) {
      setSelectedIds(externalSelectedIds);
    }
  }, [externalSelectedIds]);

  const processedHighlight = useRef(null);
  const tableRef = useRef(null);

  const filteredData = useMemo(() => {
    if (serverSide && manualFiltering) return data;

    const safeData = Array.isArray(data) ? data : [];
    return safeData.filter((item) => {
      // 1. Search Text
      const matchesSearch = searchKeys.some((key) => {
        const val = (item[key]?.toString() || '').toLowerCase();
        return val.includes(searchTerm.toLowerCase());
      });
      if (!matchesSearch) return false;

      // 2. Dropdown Filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && value !== 'all') {
          const itemVal = (item[key]?.toString() || '').toLowerCase().trim();
          const filterVal = value.toString().toLowerCase().trim();
          if (itemVal !== filterVal) return false;
        }
      }
      return true;
    });
  }, [data, searchTerm, filters, searchKeys, serverSide, manualFiltering]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortConfig.key) return 0;

      const getVal = (obj, path) => path.split('.').reduce((o, i) => o?.[i], obj);

      const valA = getVal(a, sortConfig.key);
      const valB = getVal(b, sortConfig.key);

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      const strA = (valA?.toString() || '').toLowerCase();
      const strB = (valB?.toString() || '').toLowerCase();

      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = serverSide
    ? serverTotalPages
    : Math.ceil(sortedData.length / effectiveItemsPerPage);

  const displayedData = serverSide
    ? sortedData
    : sortedData.slice(
        (currentPage - 1) * effectiveItemsPerPage,
        currentPage * effectiveItemsPerPage
      );

  useEffect(() => {
    if (highlightId && sortedData.length > 0) {
      if (processedHighlight.current === highlightId) return;

      const index = sortedData.findIndex((item) => item.id?.toString() === highlightId?.toString());
      if (index !== -1) {
        processedHighlight.current = highlightId;

        if (!serverSide) {
          const targetPage = Math.floor(index / effectiveItemsPerPage) + 1;
          if (currentPage !== targetPage) setCurrentPage(targetPage);
        }
        setActiveHighlightId(highlightId);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const row = document.getElementById(`row-${highlightId}`);
            if (row) {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
        });

        const timer = setTimeout(() => {
          setActiveHighlightId(null);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.delete('highlight');
            window.history.replaceState({}, '', url);
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightId, sortedData, effectiveItemsPerPage, currentPage, serverSide]);

  const handleSelectAll = useCallback(
    (e) => {
      const ids = e.target.checked ? displayedData.map((d) => d.id) : [];
      setSelectedIds(ids);
      onSelectionChange?.(ids);
    },
    [displayedData, onSelectionChange]
  );

  const handleSelectOne = useCallback(
    (id) => {
      const newIds = selectedIds.includes(id)
        ? selectedIds.filter((sid) => sid !== id)
        : [...selectedIds, id];
      setSelectedIds(newIds);
      onSelectionChange?.(newIds);
    },
    [selectedIds, onSelectionChange]
  );

  const isAllSelected =
    displayedData.length > 0 && displayedData.every((d) => selectedIds.includes(d.id));

  const getCellValue = (item, col) => {
    if (col.type) {
      const rawValue =
        typeof col.accessor === 'function'
          ? col.accessor(item)
          : col.accessor
            ? item[col.accessor]
            : item;

      switch (col.type) {
        case 'badge':
          const badgeConfig = col.config || {};
          let badgeColor =
            'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border-[rgb(var(--color-border))]';
          const bVal = String(rawValue || '').toLowerCase();

          if (badgeConfig.green?.some((v) => bVal === v.toLowerCase()))
            badgeColor =
              'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] border-[rgb(var(--color-success))]/20';
          else if (badgeConfig.orange?.some((v) => bVal === v.toLowerCase()))
            badgeColor =
              'bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))]/20';
          else if (badgeConfig.red?.some((v) => bVal === v.toLowerCase()))
            badgeColor =
              'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] border-[rgb(var(--color-error))]/20';
          else if (badgeConfig.blue?.some((v) => bVal === v.toLowerCase()))
            badgeColor =
              'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]/20';
          else if (badgeConfig.purple?.some((v) => bVal === v.toLowerCase()))
            badgeColor =
              'bg-[rgb(var(--color-info))]/10 text-[rgb(var(--color-info))] border-[rgb(var(--color-info))]/20';
          else if (badgeConfig.cyan?.some((v) => bVal === v.toLowerCase()))
            badgeColor =
              'bg-[rgb(var(--color-info))]/10 text-[rgb(var(--color-info))] border-[rgb(var(--color-info))]/20';
          else if (badgeConfig.gray?.some((v) => bVal === v.toLowerCase()))
            badgeColor =
              'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border-[rgb(var(--color-border))]';

          return (
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide inline-block border ${badgeColor}`}
            >
              {rawValue}
            </span>
          );

        case 'currency':
          return (
            <span className="font-mono text-sm text-[rgb(var(--color-text))] font-medium">
              $
              {Number(rawValue || 0).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          );

        case 'avatar':
          const { name, subtext, image } =
            (typeof col.config === 'function' ? col.config(item) : col.config) || {};
          return (
            <div className="flex items-center gap-3">
              {image ? (
                <Image
                  src={image}
                  alt={name || 'Avatar'}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover border border-[rgb(var(--color-border))]"
                  unoptimized // Recommended for dynamic/user-uploaded content to avoid domain whitelist issues
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))] flex items-center justify-center text-sm font-semibold uppercase shrink-0">
                  {(name || 'U').charAt(0)}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[rgb(var(--color-text))] text-sm truncate">
                  {name}
                </span>
                {subtext && (
                  <span className="text-[10px] text-[rgb(var(--color-text-muted))] truncate">
                    {subtext}
                  </span>
                )}
              </div>
            </div>
          );

        case 'date':
          return (
            <span className="text-xs text-[rgb(var(--color-text-muted))]">
              {rawValue ? formatDate(rawValue) : 'N/A'}
            </span>
          );
      }
    }

    // 2. Fallback to existing manual rendering
    if (typeof col.render === 'function') return col.render(item);
    if (typeof col.accessor === 'function') return col.accessor(item);
    return item[col.accessor];
  };

  const handlePageChange = (event, value) => {
    if (serverSide) {
      onServerPageChange?.(value);
    } else {
      setCurrentPage(value);
    }
  };

  useEffect(() => {
    if (serverSide && serverCurrentPage) {
      setCurrentPage(serverCurrentPage);
    }
  }, [serverSide, serverCurrentPage]);

  return (
    <div className={`w-full flex flex-col gap-4 ${className}`}>
      <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden shadow-sm">
        {/* Unified Control Panel Header - Improved Responsiveness */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 p-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.02]">
          {/* Search Container - takes priority in width */}
          <div className="relative w-full md:w-auto md:flex-1 group min-w-0">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] group-focus-within:text-[rgb(var(--color-primary))] transition-colors"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (onSearchChange) onSearchChange(val);
                if (!serverSide) setCurrentPage(1);
              }}
              className="w-full h-11 pl-11 pr-4 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none transition-all placeholder:text-[rgb(var(--color-text-muted))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-[rgb(var(--color-primary)/0.1)] shadow-sm hover:border-[rgb(var(--color-border-hover))]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {showFilter && onFilterClick && (
              <button
                onClick={onFilterClick}
                className="flex items-center gap-2 h-11 px-4 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl text-sm font-semibold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-border-hover))] transition-all shadow-sm shrink-0"
              >
                <Filter size={16} className="text-[rgb(var(--color-primary))]" />
                <span>{t('table.filters') || t('filter') || 'Filters'}</span>
              </button>
            )}

            {showClearFilter && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-2 h-11 px-4 bg-[rgb(var(--color-error))]/10 border border-[rgb(var(--color-error))]/20 rounded-xl text-sm font-semibold text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/20 hover:border-[rgb(var(--color-error))]/30 transition-all shadow-sm shrink-0"
              >
                <X size={16} />
                <span>{t('table.clearFilters') || 'Clear Filters'}</span>
              </button>
            )}

            {extraControls}

            {filterOptions.map((filter) => (
              <div key={filter.key} className="relative flex-shrink-0">
                <select
                  value={filters[filter.key] || 'all'}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, [filter.key]: e.target.value }));
                    if (!serverSide) setCurrentPage(1);
                  }}
                  className="appearance-none h-11 sm:h-12 pl-4 pr-10 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl text-sm sm:text-base font-medium text-[rgb(var(--color-text))] outline-none focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-[rgb(var(--color-primary)/0.05)] cursor-pointer min-w-[140px] sm:min-w-[160px] hover:bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-border-hover))] transition-all shadow-sm min-h-[44px]"
                >
                  <option value="all">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none"
                />
              </div>
            ))}
            {(searchTerm || Object.values(filters).some((v) => v !== 'all' && v)) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({});
                  onSearchChange?.('');
                  if (!serverSide) setCurrentPage(1);
                }}
                className="flex items-center justify-center h-11 w-11 rounded-xl border border-dashed border-[rgb(var(--color-error))]/30 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/5 transition-all flex-shrink-0 shadow-sm"
                title={t('table.resetFilters')}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0" ref={tableRef}>
            <thead>
              <tr className="bg-[rgb(var(--color-background))/0.5]">
                {onSelectionChange && (
                  <th className="px-4 py-3 w-12 text-center border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.5]">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() =>
                      col.sortable &&
                      handleSort(
                        col.sortKey || (typeof col.accessor === 'string' ? col.accessor : null)
                      )
                    }
                    className={`
                                            px-4 py-3 text-[11px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider whitespace-nowrap select-none border-b border-[rgb(var(--color-border))]
                                            ${col.sortable ? 'cursor-pointer hover:text-[rgb(var(--color-text))] group' : ''}
                                            ${col.className || ''}
                                        `}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${col.className?.includes('text-center') ? 'justify-center' : ''}`}
                    >
                      {col.header}
                      {col.sortable && (
                        <ArrowUpDown
                          size={12}
                          className={`transition-opacity ${sortConfig.key === (col.sortKey || col.accessor) ? 'opacity-100 text-[rgb(var(--color-primary))]' : 'opacity-0 group-hover:opacity-50'}`}
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedData.length > 0 ? (
                displayedData.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isHighlighted =
                    activeHighlightId && String(item.id) === String(activeHighlightId);

                  return (
                    <tr
                      key={item.id}
                      id={`row-${item.id}`}
                      onClick={() => onRowClick?.(item)}
                      className={`
                                                group transition-colors duration-200
                                                ${onRowClick ? 'cursor-pointer' : ''}
                                                ${isHighlighted ? 'bg-[rgb(var(--color-warning))]/10' : isSelected ? 'bg-[rgb(var(--color-primary))/0.03]' : 'hover:bg-[rgb(var(--color-background))/0.5]'}
                                            `}
                    >
                      {onSelectionChange && (
                        <td
                          className={`px-4 py-3 text-center border-b border-[rgb(var(--color-border))] first:rounded-l-none last:rounded-r-none group-last:border-b-0 ${isHighlighted ? 'border-l-4 border-l-[rgb(var(--color-warning))]' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectOne(item.id);
                            }}
                            className="w-4 h-4 rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col, idx) => (
                        <td
                          key={idx}
                          className={`
                                                        px-4 py-3 text-sm text-[rgb(var(--color-text))] border-b border-[rgb(var(--color-border))] group-last:border-b-0
                                                        ${col.className || ''}
                                                    `}
                        >
                          {getCellValue(item, col)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                    className="px-6 py-20 text-center bg-[rgb(var(--color-surface))]"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 animate-fade-in">
                      <div className="w-16 h-16 bg-[rgb(var(--color-primary))/0.05] rounded-full flex items-center justify-center mb-2">
                        <Search size={32} className="text-[rgb(var(--color-primary))] opacity-40" />
                      </div>
                      <p className="text-base font-bold text-[rgb(var(--color-text))]">
                        {t('table.noResults') || 'No data found'}
                      </p>
                      <p className="text-sm text-[rgb(var(--color-text-muted))] max-w-[280px] leading-relaxed mx-auto">
                        {t('table.tryAdjusting') ||
                          "We couldn't find any results matching your current filters. Try adjusting your search or date range."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.3] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[rgb(var(--color-text-muted))] font-medium">
              {t('table.showing')}{' '}
              {Math.min((currentPage - 1) * effectiveItemsPerPage + 1, sortedData.length)} -{' '}
              {Math.min(currentPage * effectiveItemsPerPage, sortedData.length)} {t('table.of')}{' '}
              {serverSide ? 'many' : sortedData.length}
            </span>

            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              shape="rounded"
              size="small"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: '0.75rem',
                  color: 'rgb(var(--color-text-muted))',
                  borderColor: 'transparent',
                  '&.Mui-selected': {
                    backgroundColor: 'rgb(var(--color-primary))',
                    color: '#fff',
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: 'rgb(var(--color-primary-dark))' },
                  },
                  '&:hover:not(.Mui-selected)': {
                    backgroundColor: 'rgb(var(--color-background))',
                    color: 'rgb(var(--color-text))',
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DataTable);
