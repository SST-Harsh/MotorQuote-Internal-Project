import React from 'react';
import { X } from 'lucide-react';

/**
 * Tag Badge Component
 * Displays a single tag with dynamic color and a pointed "price tag" shape
 */
const TagBadge = ({ tag, onDelete, size = 'sm', className = '' }) => {
  const bgColor = tag.colour || '#3B82F6';

  // Calculate contrast and brightness info
  const contrastInfo = (() => {
    if (!bgColor) return { text: '#FFFFFF', isLight: false };
    const hex = bgColor.replace('#', '');
    const expandHex =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;

    try {
      const r = parseInt(expandHex.substr(0, 2), 16);
      const g = parseInt(expandHex.substr(2, 2), 16);
      const b = parseInt(expandHex.substr(4, 2), 16);
      if (isNaN(r) || isNaN(g) || isNaN(b)) return { text: '#FFFFFF', isLight: false };

      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return {
        text: yiq >= 128 ? '#111827' : '#FFFFFF',
        isLight: yiq >= 128,
      };
    } catch (e) {
      return { text: '#FFFFFF', isLight: false };
    }
  })();

  const textColor = contrastInfo.text;

  // Size classes - Adjusted for pointed shape padding
  const sizeClasses = {
    xs: 'pl-3 pr-1.5 py-0.5 text-[10px]',
    sm: 'pl-3.5 pr-2 py-0.5 text-xs',
    md: 'pl-4 pr-2.5 py-1 text-sm',
    lg: 'pl-5 pr-3 py-1.5 text-base',
  };

  const isDeleteable = !!onDelete;

  // Custom clip-path for the pointed tag shape
  // Point on left: polygon(0 50%, 10px 0, 100% 0, 100% 100%, 10px 100%)
  const clipPathValue = 'polygon(0 50%, 12px 0, 100% 0, 100% 100%, 12px 100%)';

  return (
    <div className={`relative inline-flex group ${className} shadow-sm drop-shadow-sm`}>
      {/* The Tag Body */}
      <span
        className={`
                    inline-flex items-center font-bold transition-all duration-300
                    hover:brightness-110 hover:translate-x-0.5
                    ${sizeClasses[size]}
                    rounded-r-md
                `}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          clipPath: clipPathValue,
          // textShadow: contrastInfo.isLight ? 'none' : '0 1px 1px rgba(0,0,0,0.1)'
        }}
      >
        {/* The "Hole" - purely decorative white dot positioned over the point area */}
        <span className="absolute left-[5px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-inner opacity-90 z-10" />

        <span className="truncate max-w-[150px] tracking-tight uppercase ml-1">{tag.name}</span>

        {isDeleteable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tag.id);
            }}
            className={`
                            ml-2 -mr-1 inline-flex p-0.5 shrink-0 items-center justify-center rounded-full 
                            transition-all hover:bg-black/20 focus:outline-none 
                            bg-black/5
                        `}
            aria-label={`Remove ${tag.name}`}
          >
            <X size={size === 'xs' ? 8 : 10} strokeWidth={4} />
          </button>
        )}
      </span>
    </div>
  );
};

export default TagBadge;
