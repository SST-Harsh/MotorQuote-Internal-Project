import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import tagService from '@/services/tagService';
import TagBadge from './TagBadge';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';

const TagInput = ({
  selectedTags: propSelectedTags,
  value,
  onChange,
  type = null,
  placeholder = 'Add tags...',
  readOnly = false,
  canCreate = false,
}) => {
  const { t } = useTranslation('common');
  const { user } = useAuth();

  const selectedTags = useMemo(() => value || propSelectedTags || [], [value, propSelectedTags]);

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const allowCreate = canCreate || isAdmin;

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await tagService.autocompleteTags(inputValue, type, 5);
        console.log('[TagInput] Raw results from service:', results);
        const safeResults = Array.isArray(results) ? results : [];
        console.log('[TagInput] Safe results (array check):', safeResults);

        const filtered = safeResults.filter(
          (tag) => !selectedTags.some((selected) => String(selected.id) === String(tag.id))
        );
        console.log('[TagInput] Filtered suggestions:', filtered);
        console.log('[TagInput] Selected tags:', selectedTags);
        setSuggestions(filtered);
      } catch (error) {
        console.error('Failed to fetch tag suggestions', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, type, selectedTags]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTag = (tag) => {
    if (!selectedTags.some((t) => String(t.id) === String(tag.id))) {
      onChange([...selectedTags, tag]);
    }
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId) => {
    onChange(selectedTags.filter((t) => String(t.id) !== String(tagId)));
  };

  const handleCreateTag = async () => {
    if (!allowCreate || !inputValue.trim()) return;

    setIsLoading(true);
    try {
      const newTagPayload = {
        name: inputValue.trim().toLowerCase().replace(/\s+/g, '-'),
        type: type || 'general',
        colour: '#3B82F6',
      };
      const newTag = await tagService.createTag(newTagPayload);
      handleSelectTag(newTag);
    } catch (error) {
      console.error('Failed to create tag', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exactMatch = suggestions.find(
        (s) => s.name?.toLowerCase() === inputValue.toLowerCase()
      );
      if (exactMatch) {
        handleSelectTag(exactMatch);
      } else if (allowCreate && inputValue.length > 2) {
        handleCreateTag();
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`
                flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[rgb(var(--color-surface))]
                ${readOnly ? 'bg-[rgb(var(--color-background))] cursor-not-allowed opacity-60' : 'focus:ring-0'}
                transition-all duration-300
            `}
      >
        {selectedTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onDelete={!readOnly ? handleRemoveTag : undefined} />
        ))}

        {!readOnly && (
          <div className="flex-1 min-w-[120px] relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedTags.length === 0 ? placeholder : ''}
              className="w-full border-none p-0 focus:ring-0 text-sm placeholder:text-[rgb(var(--color-text-muted))] font-medium bg-transparent"
            />
          </div>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && !readOnly && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[rgb(var(--color-surface))] rounded-2xl shadow-xl border border-[rgb(var(--color-border))] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden min-w-[300px]">
          {isLoading ? (
            <div className="px-5 py-4 text-sm text-[rgb(var(--color-text-muted))] flex items-center justify-center gap-3 italic">
              <Loader2 size={16} className="animate-spin text-[rgb(var(--color-primary))]" />
              <span>Searching tags...</span>
            </div>
          ) : (
            <>
              {suggestions.length > 0 && (
                <div className="max-h-68 overflow-y-auto no-scrollbar">
                  <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Suggested Tags
                  </div>
                  {suggestions.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleSelectTag(tag)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Use TagBadge for preview */}
                        <TagBadge tag={tag} size="sm" className="pointer-events-none" />
                      </div>
                      {tag.usage_count >= 0 && (
                        <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-background))] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          {tag.usage_count} USES
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {suggestions.length === 0 && !inputValue && (
                <div className="px-5 py-4 text-sm text-[rgb(var(--color-text-muted))] italic text-center">
                  Start typing to find tags...
                </div>
              )}

              {suggestions.length === 0 && inputValue && (
                <div className="p-3">
                  {allowCreate ? (
                    <div className="space-y-2">
                      <div className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                        No matches found
                      </div>
                      <button
                        onClick={handleCreateTag}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all font-bold border border-blue-100 border-dashed"
                      >
                        <Plus size={16} strokeWidth={3} />
                        <span>
                          CREATE &quot;<span className="uppercase">{inputValue}</span>&quot;
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="px-5 py-4 text-sm text-[rgb(var(--color-text-muted))] text-center italic">
                      No matches found
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TagInput;
