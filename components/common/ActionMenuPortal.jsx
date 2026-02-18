import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ActionMenuPortal = ({ isOpen, onClose, position, triggerRect, align = 'end', children }) => {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState(() => {
    if (position) return position;
    if (triggerRect) {
      // Check for valid numbers (including 0)
      if (typeof triggerRect.left === 'number' && typeof triggerRect.bottom === 'number') {
        let initialLeft = triggerRect.left;
        if (align === 'end' && typeof triggerRect.right === 'number') {
          // Estimate width as 192px (w-48 class) to prevent jumping from left to right alignment
          initialLeft = triggerRect.right - 192;
        }
        return { top: triggerRect.bottom + 4, left: initialLeft };
      }
      // Fallback to mouse coordinates if rect dimensions are invalid
      if (typeof triggerRect.mouseX === 'number' && typeof triggerRect.mouseY === 'number') {
        const estimatedWidth = align === 'end' ? 192 : 0;
        return { top: triggerRect.mouseY + 10, left: triggerRect.mouseX - estimatedWidth };
      }
    }
    return { top: 0, left: 0 };
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle positioning based on triggerRect or minimal position object
  useLayoutEffect(() => {
    if (isOpen && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      if (triggerRect) {
        // Check if we have a valid DOMRect (non-zero dimensions/positions)
        // If the button is visible, it should have a width/height. If not, we might fall back to mouse coords.
        const hasLayout =
          triggerRect.width > 0 ||
          triggerRect.height > 0 ||
          triggerRect.top > 0 ||
          triggerRect.left > 0;

        if (hasLayout) {
          // New logic: Position based on trigger element rect
          top = triggerRect.bottom + 4; // Default: Open downwards

          // Horizontal alignment
          if (align === 'end') {
            left = triggerRect.right - menuRect.width;
          } else {
            left = triggerRect.left;
          }

          // --- Vertical flipping / adjustment ---
          const spaceBelow = window.innerHeight - top;
          const spaceAbove = triggerRect.top;

          // If not enough space below, and more space above, flip upwards
          if (spaceBelow < menuRect.height && spaceAbove > menuRect.height) {
            top = triggerRect.top - menuRect.height - 4;
          } else if (spaceBelow < menuRect.height) {
            if (top + menuRect.height > window.innerHeight) {
              top = window.innerHeight - menuRect.height - 10;
            }
          }
        } else if (
          typeof triggerRect.mouseX === 'number' &&
          typeof triggerRect.mouseY === 'number'
        ) {
          // Fallback: Use Mouse Coordinates if available and rect is zero/invalid
          // Position slightly below/right of cursor to mimic dropdown
          top = triggerRect.mouseY + 10;
          left = triggerRect.mouseX - (align === 'end' ? menuRect.width : 0);

          // Vertical adjustment for mouse position
          if (top + menuRect.height > window.innerHeight) {
            top = triggerRect.mouseY - menuRect.height - 10;
          }
        }
      } else if (position) {
        // Legacy components or manual positioning support
        top = position.top;
        left = position.left;
        // Preserve bottom if provided (for manual overflow handling)
        if (position.bottom !== undefined) {
          // Trust caller for vertical positioning if bottom is set
          // We still run horizontal safety checks below
        } else {
          // Only run vertical flipping logic if we are using 'top' positioning
          const spaceBelow = window.innerHeight - top;
          const spaceAbove = top;

          if (spaceBelow < menuRect.height + 20 && spaceAbove > menuRect.height + 20) {
            top = top - menuRect.height - (position.height > 0 ? 8 : 40);
          } else if (top + menuRect.height > window.innerHeight) {
            top = window.innerHeight - menuRect.height - 10;
          }
        }
      }

      // --- Horizontal safety check (keep in viewport) ---
      if (left + menuRect.width > window.innerWidth) {
        left = window.innerWidth - menuRect.width - 10;
      }
      if (left < 10) left = 10;

      setCoords({ top, left, bottom: position?.bottom });
    }
  }, [isOpen, position, triggerRect, align]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} aria-hidden="true" />
      <div
        ref={menuRef}
        className="fixed w-48 bg-[rgb(var(--color-surface))] rounded-lg shadow-xl border border-[rgb(var(--color-border))] z-[9999] overflow-y-auto"
        style={{
          top: coords.bottom !== undefined ? 'auto' : coords.top,
          bottom: coords.bottom,
          left: coords.left,
          maxHeight: 'calc(100vh - 20px)',
        }}
      >
        {children}
      </div>
    </>,
    document.getElementById('modal-root') || document.body
  );
};

export default ActionMenuPortal;
