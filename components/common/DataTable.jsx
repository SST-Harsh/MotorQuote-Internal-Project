'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, ArrowUpDown, X, Filter, ChevronDown, MoreHorizontal } from 'lucide-react';
import Input from './Input';
import CustomSelect from './CustomSelect';
import { Pagination, TablePagination } from '@mui/material';
import Image from 'next/image';
import { usePreference } from '@/context/PreferenceContext';
import FilterButton from './FilterButton';
import { usePathname } from 'next/navigation';
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
  serverTotalItems = undefined, // New: support total items explicitly
  serverCurrentPage = 1,
  onServerPageChange,
  onServerRowsPerPageChange, // New: notify parent of limit changes
  manualFiltering = false,
  onSearchChange,
  searchValue, // Optional controlled search value (for external reset/sync)
  onRowClick,
  onFilterClick, // New: standard filter button handler
  showFilter = !!onFilterClick, // New: toggle standard filter button
  onClearFilters, // New: clear filter button handler
  showClearFilter = false, // New: toggle clear filter button
  externalFilters = {}, // New: external filters from parent (for filter drawer integration)
  onRemoveExternalFilter, // New: remove individual external filter
  highlightDuration = 2000,
  hideFilterDropdowns = false, // New: toggle to hide redundant dropdowns when filter drawer is used
  persistenceKey = null, // Optional key for sessionStorage persistence (route-scoped)
}) => {
  const pathname = usePathname();
  const { preferences = {} } = usePreference() || {};
  const effectiveItemsPerPage =
    itemsPerPage !== 5 ? itemsPerPage : preferences?.items_per_page || 10;

  // Helper to get route-scoped storage key
  const storageKey = useMemo(
    () => (persistenceKey ? `dt_state_${persistenceKey}_${pathname}` : null),
    [persistenceKey, pathname]
  );

  // Check if we should load persisted state (only on initial load/refresh, not on internal navigation)
  const isRefresh = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [rowsPerPage, setRowsPerPage] = useState(() => {
    if (typeof window === 'undefined') return effectiveItemsPerPage;
    if (storageKey && isRefresh) {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.rowsPerPage) return parsed.rowsPerPage;
        }
      } catch (e) {
        console.error('Failed to load rowsPerPage from storage', e);
      }
    }
    return effectiveItemsPerPage;
  });

  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 1;
    if (storageKey && isRefresh) {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.currentPage) return parsed.currentPage;
        }
      } catch (e) {
        console.error('Failed to load currentPage from storage', e);
      }
    }
    return 1;
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    if (searchValue !== undefined) return searchValue;
    if (typeof window === 'undefined' || !storageKey || !isRefresh) return '';
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.searchTerm !== undefined) return parsed.searchTerm;
      }
    } catch (e) {
      console.error('Failed to load searchTerm from storage', e);
    }
    return '';
  });

  const [filters, setFilters] = useState(() => {
    if (typeof window === 'undefined' || !storageKey || !isRefresh) return {};
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.filters) return parsed.filters;
      }
    } catch (e) {
      console.error('Failed to load filters from storage', e);
    }
    return {};
  });

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState(externalSelectedIds || []);
  const [activeHighlightId, setActiveHighlightId] = useState(highlightId);

  // Persistence Saving
  useEffect(() => {
    if (!storageKey) return;
    const state = {
      rowsPerPage,
      currentPage,
      // Only persist these if they are not being controlled externally
      // ...(searchValue === undefined && { searchTerm }),
      filters,
    };
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  }, [storageKey, rowsPerPage, currentPage, filters]);

  // Update the last path visited to enable refresh-persistence vs navigation-reset
  useEffect(() => {
    sessionStorage.setItem('app_last_path', pathname);
  }, [pathname]);

  // Sync with external selection
  useEffect(() => {
    if (externalSelectedIds !== undefined) {
      setSelectedIds(externalSelectedIds);
    }
  }, [externalSelectedIds]);

  // Sync internal searchTerm when controlled searchValue changes externally (e.g. clear filters)
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== searchTerm) {
      setSearchTerm(searchValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const processedHighlight = useRef(null);
  const tableRef = useRef(null);

  const filteredData = useMemo(() => {
    if (manualFiltering) return data;

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
  }, [data, searchTerm, filters, searchKeys, manualFiltering]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortConfig.key) return 0;

      const getVal = (obj, path) => {
        if (!path) return null;
        if (typeof path === 'function') return path(obj);
        return path
          .toString()
          .split('.')
          .reduce((o, i) => o?.[i], obj);
      };

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

  const totalPages = serverSide ? serverTotalPages : Math.ceil(sortedData.length / rowsPerPage);

  const displayedData = serverSide
    ? sortedData
    : sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    if (!serverSide && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, serverSide]);

  useEffect(() => {
    if (highlightId && sortedData.length > 0) {
      if (processedHighlight.current === highlightId) return;

      const index = sortedData.findIndex(
        (item) => item?.id?.toString() === highlightId?.toString()
      );
      if (index !== -1) {
        if (!serverSide) {
          const targetPage = Math.floor(index / rowsPerPage) + 1;
          if (currentPage !== targetPage) {
            setCurrentPage(targetPage);
            return; // Wait for re-render on the target page
          }
        }

        // If we reach here, we are on the correct page
        processedHighlight.current = highlightId;
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
            url.searchParams.delete('highlightId');
            window.history.replaceState({}, '', url);
          }
        }, highlightDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightId, sortedData, rowsPerPage, currentPage, serverSide, highlightDuration]);

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
          else if (badgeConfig.yellow?.some((v) => bVal === v.toLowerCase()))
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

          let displayValue = rawValue;
          if (bVal === 'converted' || bVal === 'sold' || bVal === 'sold_out' || bVal === '') {
            displayValue = 'Sold Out';
          }

          return (
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide inline-block border ${badgeColor}`}
            >
              {displayValue}
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
              {rawValue ? new Date(rawValue).toLocaleDateString() : 'N/A'}
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
    const newPage = value + 1;
    if (serverSide) {
      onServerPageChange?.(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
    if (serverSide) {
      onServerPageChange?.(1); // Reset to page 1 for server-side
      onServerRowsPerPageChange?.(newRowsPerPage);
    }
  };

  useEffect(() => {
    if (serverSide && serverCurrentPage) {
      setCurrentPage(serverCurrentPage);
    }
  }, [serverSide, serverCurrentPage]);

  useEffect(() => {
    if (serverSide && itemsPerPage && itemsPerPage !== rowsPerPage) {
      setRowsPerPage(itemsPerPage);
    }
  }, [itemsPerPage, serverSide, rowsPerPage]);

  return (
    <div className={`w-full flex flex-col gap-4 ${className}`}>
      <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden shadow-sm">
        {/* Unified Control Panel Header - Improved Responsiveness */}
        <div className="flex flex-col p-4 pb-2 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.02] gap-4">
          {/* Primary Control Row: Search and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            {/* Search Container */}
            <div className="relative w-full md:w-auto md:flex-1 group min-w-0">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  if (onSearchChange) onSearchChange(val);
                  if (!serverSide) setCurrentPage(1);
                }}
                icon={Search}
                rightIcon={searchTerm ? X : null}
                onRightIconClick={() => {
                  setSearchTerm('');
                  setFilters({});
                  onSearchChange?.('');
                  onClearFilters?.();
                  if (!serverSide) setCurrentPage(1);
                }}
                className="mb-0 w-full"
                inputClassName="h-11 pl-11 shadow-sm hover:border-[rgb(var(--color-border-hover))]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
              {showFilter && onFilterClick && (
                <FilterButton
                  onClick={onFilterClick}
                  active={Object.values(externalFilters).some(
                    (val) => val && (Array.isArray(val) ? val.length > 0 : val !== '')
                  )}
                />
              )}

              {extraControls}

              {!hideFilterDropdowns &&
                filterOptions.map((filter) => (
                  <div
                    key={filter.key}
                    className={`relative flex-shrink-0 ${filter.className || ''}`}
                  >
                    <CustomSelect
                      key={filter.key}
                      value={filters[filter.key] || 'all'}
                      options={[{ value: 'all', label: filter.label }, ...filter.options]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters((prev) => ({ ...prev, [filter.key]: val }));
                        if (!serverSide) setCurrentPage(1);
                      }}
                      placeholder={filter.label}
                      size="md"
                    />
                  </div>
                ))}

              {!searchTerm &&
                (() => {
                  const hasInternalFilters = Object.values(filters).some(
                    (val) => val && val !== 'all'
                  );
                  const hasExternalFilters = Object.values(externalFilters).some(
                    (val) => val && (Array.isArray(val) ? val.length > 0 : val !== '')
                  );
                  const shouldShowClear =
                    showClearFilter || hasInternalFilters || hasExternalFilters;

                  if (!shouldShowClear) return null;

                  return (
                    <button
                      onClick={() => {
                        setFilters({});
                        onClearFilters?.();
                        if (!serverSide) setCurrentPage(1);
                      }}
                      className="flex items-center gap-2 h-11 px-4 bg-[rgb(var(--color-error))]/10 border border-[rgb(var(--color-error))]/20 rounded-xl text-sm font-semibold text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/20 hover:border-[rgb(var(--color-error))]/30 transition-all shadow-sm shrink-0"
                    >
                      <X size={16} />
                      <span>Clear Results</span>
                    </button>
                  );
                })()}
            </div>
          </div>

          {/* Secondary Row: Active Filter Chips */}
          {!searchTerm &&
            (Object.keys(filters).filter((k) => filters[k] && filters[k] !== 'all').length > 0 ||
              Object.keys(externalFilters).filter((k) => {
                const val = externalFilters[k];
                return val && (Array.isArray(val) ? val.length > 0 : val !== '');
              }).length > 0) && (
              <div className="flex flex-wrap items-center gap-2 animate-fade-in -mt-2">
                {/* Internal dropdown filters */}
                {filterOptions.map((filter) => {
                  const selectedValue = filters[filter.key];
                  if (!selectedValue || selectedValue === 'all') return null;

                  const optionLabel =
                    filter.options.find((opt) => opt.value === selectedValue)?.label ||
                    selectedValue;

                  return (
                    <div
                      key={`internal-${filter.key}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--color-primary))/0.08] text-[rgb(var(--color-primary))] text-xs font-semibold rounded-lg border border-[rgb(var(--color-primary))/0.15] shadow-sm"
                    >
                      <span className="opacity-70">{filter.label}:</span>
                      <span>{optionLabel}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFilters((prev) => {
                            const newFilters = { ...prev };
                            delete newFilters[filter.key];
                            return newFilters;
                          });
                          if (!serverSide) setCurrentPage(1);
                        }}
                        className="ml-1 hover:bg-[rgb(var(--color-primary))/0.15] rounded-md p-0.5 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}

                {/* External filters from filter drawer */}
                {Object.entries(externalFilters).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0) || value === '')
                    return null;

                  let displayValue = value;
                  let label = key
                    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
                    .trim();

                  // Try to get human-readable label from filterOptions
                  const filterConfig = filterOptions.find((f) => f.key === key);
                  if (filterConfig) {
                    if (Array.isArray(value)) {
                      const labels = value
                        .map((v) => filterConfig.options.find((opt) => opt.value === v)?.label || v)
                        .filter(Boolean);
                      displayValue = labels.join(', ');
                    } else {
                      const opt = filterConfig.options.find((opt) => opt.value === value);
                      if (opt) displayValue = opt.label;
                    }
                    label = filterConfig.label;
                  } else if (
                    typeof value === 'string' &&
                    (key.toLowerCase().includes('date') || key.toLowerCase().includes('at'))
                  ) {
                    // Auto-format dates if they look like ISO strings or keys contain "date"/"at"
                    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
                      displayValue = formatDate(value);
                    }
                  }

                  return (
                    <div
                      key={`external-${key}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--color-primary))/0.08] text-[rgb(var(--color-primary))] text-xs font-semibold rounded-lg border border-[rgb(var(--color-primary))/0.15] shadow-sm"
                    >
                      <span className="opacity-70">{label}:</span>
                      <span>{displayValue}</span>
                      {onRemoveExternalFilter && (
                        <button
                          type="button"
                          onClick={() => onRemoveExternalFilter(key)}
                          className="ml-1 hover:bg-[rgb(var(--color-primary))/0.15] rounded-md p-0.5 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse" ref={tableRef}>
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
                    onClick={() => col.sortable && handleSort(col.sortKey || col.accessor)}
                    className={`
                                            px-4 py-3 text-[11px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider whitespace-nowrap select-none border-b border-[rgb(var(--color-border))]
                                            ${col.sortable ? 'cursor-pointer hover:text-[rgb(var(--color-text))] group' : ''}
                                            ${col.className || ''}
                                        `}
                  >
                    <div
                      className={`flex items-center gap-0.5 ${col.className?.includes('text-center') ? 'justify-center' : ''}`}
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
                        No data found
                      </p>
                      <p className="text-sm text-[rgb(var(--color-text-muted))] max-w-[280px] leading-relaxed mx-auto">
                        We couldn&apos;t find any results matching your current filters. Try
                        adjusting your search or date range.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="px-4 py-2 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.3]">
          <TablePagination
            component="div"
            count={
              serverSide
                ? serverTotalItems !== undefined
                  ? serverTotalItems
                  : serverTotalPages * rowsPerPage
                : sortedData.length
            }
            page={currentPage - 1}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage="Rows per page:"
            sx={{
              border: 'none',
              color: 'rgb(var(--color-text-muted))',
              fontSize: '0.75rem',
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                margin: 0,
                fontSize: '0.75rem',
                fontWeight: 500,
              },
              '.MuiTablePagination-select': {
                fontWeight: 600,
                color: 'rgb(var(--color-text))',
              },
              '.MuiTablePagination-actions': {
                marginLeft: '1rem',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(DataTable);
