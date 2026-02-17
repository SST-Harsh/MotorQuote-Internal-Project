import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';

export default function FilterDrawer({ isOpen, onClose, onApply, onReset, children, title = "Filters" }) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-[rgb(var(--color-surface))] shadow-2xl border-l border-[rgb(var(--color-border))] flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--color-border))]">
                    <div className="flex items-center gap-2 text-[rgb(var(--color-text))]">
                        <Filter size={20} className="text-[rgb(var(--color-primary))]" />
                        <h2 className="text-lg font-bold">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[rgb(var(--color-background))] rounded-full text-[rgb(var(--color-text-muted))] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {children}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.5] flex gap-3">
                    <button
                        onClick={onReset}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] font-medium transition-colors"
                    >
                        <RotateCcw size={18} />
                        Reset
                    </button>
                    <button
                        onClick={() => { onApply?.(); onClose(); }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--color-primary))] text-white font-medium hover:bg-[rgb(var(--color-primary-dark))] shadow-lg shadow-[rgb(var(--color-primary)/0.25)] transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    );
}
