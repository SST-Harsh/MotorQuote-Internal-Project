"use client";
import { useState, useEffect } from "react";
import { Search, ArrowUpDown, X } from "lucide-react";
import { Pagination } from "@mui/material";

const DataTable = ({
    data = [],
    columns = [],
    searchKeys = ['name'],
    filterOptions = [],
    onSelectionChange,
    itemsPerPage = 3,
    searchPlaceholder = "Search...",
    highlightId = null,
    extraControls = null
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeHighlightId, setActiveHighlightId] = useState(highlightId);

    useEffect(() => {
        setActiveHighlightId(highlightId);
        if (highlightId) {
            const timer = setTimeout(() => {
                setActiveHighlightId(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [highlightId]);

    const filteredData = data.filter(item => {
        const matchesSearch = searchKeys.some(key => {
            const val = (item[key]?.toString() || "").toLowerCase();
            return val.includes(searchTerm.toLowerCase());
        });
        if (!matchesSearch) return false;

        for (const [key, value] of Object.entries(filters)) {
            if (value && value !== 'all') {
                const itemVal = (item[key]?.toString() || "").toLowerCase().trim();
                const filterVal = value.toString().toLowerCase().trim();
                if (itemVal !== filterVal) return false;
            }
        }

        return true;
    });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const getVal = (obj, path) => path.split('.').reduce((o, i) => o?.[i], obj);

        const valA = getVal(a, sortConfig.key);
        const valB = getVal(b, sortConfig.key);

        // Numeric Sort
        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }

        // String Sort (Default)
        const strA = (valA?.toString() || "").toLowerCase();
        const strB = (valB?.toString() || "").toLowerCase();

        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const displayedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const ids = displayedData.map(d => d.id);
            setSelectedIds(ids);
            onSelectionChange && onSelectionChange(ids);
        } else {
            setSelectedIds([]);
            onSelectionChange && onSelectionChange([]);
        }
    };

    const handleSelectOne = (id) => {
        let newIds;
        if (selectedIds.includes(id)) {
            newIds = selectedIds.filter(sid => sid !== id);
        } else {
            newIds = [...selectedIds, id];
        }
        setSelectedIds(newIds);
        onSelectionChange && onSelectionChange(newIds);
    };

    const isAllSelected = displayedData.length > 0 && displayedData.every(d => selectedIds.includes(d.id));

    const getCellValue = (item, col) => {
        if (typeof col.accessor === 'function') return col.accessor(item);
        return item[col.accessor];
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[rgb(var(--color-surface))] p-4 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm">

                {/* Search */}
                <div className="relative w-full  md:flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full h-10 pl-10 pr-4 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] outline-none transition-all text-[rgb(var(--color-text))]"
                    />
                </div>
                {extraControls && (
                    <div className="flex-shrink-0">
                        {extraControls}
                    </div>
                )}
                {filterOptions.length > 0 && (
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        {filterOptions.map((filter) => (
                            <select
                                key={filter.key}
                                value={filters[filter.key] || 'all'}
                                onChange={(e) => { setFilters(prev => ({ ...prev, [filter.key]: e.target.value })); setCurrentPage(1); }}
                                className="h-10 px-3 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] min-w-[140px] text-[rgb(var(--color-text))]"
                            >
                                <option value="all">All {filter.label}</option>
                                {filter.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ))}
                        {(searchTerm || Object.values(filters).some(v => v !== 'all' && v)) && (
                            <button
                                onClick={() => { setSearchTerm(""); setFilters({}); setCurrentPage(1); }}
                                className="h-10 px-3 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))/0.9] rounded-xl transition-colors"
                                title="Clear Filters"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* --- TABLE --- */}
            <div className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl shadow-sm overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[rgb(var(--color-border))]">
                        <thead>
                            <tr className="bg-[rgb(var(--color-background))/0.5]">
                                {onSelectionChange && (
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                )}
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        className={`px-6 py-4 text-left text-xs font-bold text-[rgb(var(--color-text-muted))]   uppercase tracking-wider ${col.sortable ? 'cursor-pointer group hover:bg-[rgb(var(--color-background))]' : ''} ${col.className || ''}`}
                                        onClick={() => col.sortable && handleSort(col.sortKey || (typeof col.accessor === 'string' ? col.accessor : null))}
                                    >
                                        <div className={`flex items-center gap-2 ${col.className?.includes('text-center') || col.className?.includes('justify-center') ? 'justify-center' : ''}`}>
                                            {col.header}
                                            {col.sortable && (
                                                <ArrowUpDown size={14} className={`text-gray-400 opacity-0 group-hover:opacity-100 ${sortConfig.key === (col.sortKey || col.accessor) ? 'opacity-100 text-blue-600' : ''}`} />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgb(var(--color-border))]">
                            {displayedData.length > 0 ? (
                                displayedData.map((item) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    const isHighlighted = activeHighlightId && (item.id === activeHighlightId || item.id === `#${activeHighlightId}`);
                                    return (
                                        <tr
                                            key={item.id}
                                            id={`row-${item.id}`}
                                            className={`group transition-colors duration-500
                                                ${isHighlighted ? 'bg-[rgb(var(--color-primary))]/50 duration-500 animate-pulse' : ''}
                                                ${isSelected ? 'bg-[rgb(var(--color-primary))/0.05]' : 'hover:bg-[rgb(var(--color-background))]'}
                                            `}
                                        >
                                            {onSelectionChange && (
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectOne(item.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                            )}

                                            {columns.map((col, idx) => (
                                                <td key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                                                    {getCellValue(item, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="p-12 text-center text-gray-400">
                                        No results found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                {totalPages > 0 && (
                    <div className="px-6 py-4 border-t border-[rgb(var(--color-border))] flex items-center justify-between bg-[rgb(var(--color-surface))]">
                        <span className="text-xs font-medium text-[rgb(var(--color-text))]">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedData.length)} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
                        </span>

                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={(e, value) => setCurrentPage(value)}
                            shape="rounded"
                            color="primary"
                            size="small"
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    color: 'rgb(var(--color-text))',
                                    borderColor: 'rgb(var(--color-border))',
                                    '&:hover': {
                                        backgroundColor: 'rgb(var(--color-surface-hover))',
                                    },
                                    '&.Mui-selected': {
                                        backgroundColor: 'rgb(var(--color-primary))',
                                        color: '#fff',
                                        '&:hover': {
                                            backgroundColor: 'rgb(var(--color-primary-dark))',
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;