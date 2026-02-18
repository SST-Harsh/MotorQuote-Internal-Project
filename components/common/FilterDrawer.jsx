import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Filter, RotateCcw } from 'lucide-react';

export default function FilterDrawer({
  isOpen,
  onClose,
  onApply,
  onReset,
  children,
  title = 'Filters',
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[101] w-full md:w-[400px] bg-[rgb(var(--color-surface))] shadow-2xl border-l border-[rgb(var(--color-border))] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--color-border))]">
          <div className="flex items-center gap-2 text-[rgb(var(--color-text))]">
            <div className="p-2 bg-[rgb(var(--color-primary))/0.1] rounded-lg">
              <Filter size={20} className="text-[rgb(var(--color-primary))]" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgb(var(--color-background))] rounded-full text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

        {/* Footer */}
        <div className="p-6 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.5] flex gap-3">
          <button
            onClick={() => {
              onReset?.();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-error))/0.05] text-[rgb(var(--color-error))] font-medium transition-colors active:scale-[0.98]"
          >
            <RotateCcw size={18} />
            Clear Filters
          </button>
          <button
            onClick={() => {
              onApply?.();
              onClose();
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-[rgb(var(--color-primary))] text-white font-bold hover:bg-[rgb(var(--color-primary-dark))] shadow-lg shadow-[rgb(var(--color-primary)/0.25)] transition-all active:scale-[0.98]"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
