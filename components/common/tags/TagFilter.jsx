import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import tagService from '@/services/tagService';
import { Check } from 'lucide-react';

/**
 * Tag Filter Component
 * Dropdown for filtering lists by tags with pointed "price tag" aesthetic
 */
const TagFilter = ({ selectedTags = [], onChange, type = null, options = null }) => {
  const { t } = useTranslation('common');
  const [availableTags, setAvailableTags] = useState(options || []);
  const [isLoading, setIsLoading] = useState(!options);

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        let apiTags = [];
        // Only fetch if type is provided OR if no options are passed (standard behavior)
        if (type || !options) {
          const params = { limit: 100 };
          if (type) params.type = type;
          const response = await tagService.getAllTags(params);
          apiTags = Array.isArray(response) ? response : response.data || [];
        }

        if (options && Array.isArray(options)) {
          // Merge options into apiTags, avoiding duplicates by ID or case-insensitive Name
          const merged = [...apiTags];
          const existingIds = new Set(apiTags.map((t) => t.id));
          const existingNames = new Set(apiTags.map((t) => (t.name || '').toLowerCase()));

          options.forEach((opt) => {
            if (
              opt &&
              opt.id &&
              !existingIds.has(opt.id) &&
              !existingNames.has((opt.name || '').toLowerCase())
            ) {
              merged.push(opt);
            }
          });
          setAvailableTags(merged);
        } else {
          setAvailableTags(apiTags);
        }
      } catch (error) {
        console.error('Failed to load filter tags', error);
        if (options) setAvailableTags(options);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [type, options]);

  const handleToggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-8 bg-gray-100 rounded-lg"></div>;
  }

  if (availableTags.length === 0) {
    return null;
  }

  // Clip path for pointed visual on the left
  const clipPathValue = 'polygon(0 50%, 10px 0, 100% 0, 100% 100%, 10px 100%)';

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-[rgb(var(--color-text-muted))] uppercase tracking-[0.2em] block">
          Filter by Tags
        </label>
        {selectedTags.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-[10px] font-bold text-red-500 uppercase hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const bgColor = isSelected ? tag.colour || '#3B82F6' : 'transparent';

          // Robust contrast calculation
          const contrastInfo = (() => {
            if (!bgColor || bgColor === 'transparent')
              return { text: 'rgb(var(--color-text-muted))', isLight: true };
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
              const yiq = (r * 299 + g * 587 + b * 114) / 1000;
              return {
                text: yiq >= 128 ? '#111827' : '#FFFFFF',
                isLight: yiq >= 128,
              };
            } catch (e) {
              return { text: '#FFFFFF', isLight: false };
            }
          })();

          const textColor = isSelected ? contrastInfo.text : 'rgb(var(--color-text-muted))';

          return (
            <div key={tag.id} className="relative inline-flex group drop-shadow-sm">
              <button
                onClick={() => handleToggleTag(tag.id)}
                className={`
                                    inline-flex items-center pl-4 pr-3 py-1.5 rounded-r-md text-[10px] font-black uppercase tracking-wider transition-all duration-300
                                    ${
                                      isSelected
                                        ? 'scale-105'
                                        : 'bg-[rgb(var(--color-surface))] hover:brightness-95 hover:bg-[rgb(var(--color-background))]'
                                    }
                                `}
                style={{
                  backgroundColor: isSelected ? bgColor : undefined,
                  color: textColor,
                  clipPath: clipPathValue,
                  // border fallback handled by shadow/bg since clip-path cuts borders
                }}
              >
                {/* Hole dot */}
                <span
                  className={`absolute left-[5px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-inner z-10 transition-opacity ${isSelected ? 'opacity-90' : 'opacity-40'}`}
                />

                {isSelected && <Check size={10} strokeWidth={4} className="mr-1.5 ml-1" />}
                <span className={isSelected ? '' : 'ml-1'}>{tag.name}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TagFilter;
