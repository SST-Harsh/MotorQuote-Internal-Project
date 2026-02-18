import React from 'react';
import TagBadge from './TagBadge';

/**
 * Tag List Component
 * Simple list of tags (read-only)
 */
const TagList = ({ tags = [], limit = 0, className = '' }) => {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;

  const displayTags = limit > 0 ? tags.slice(0, limit) : tags;
  const remaining = limit > 0 ? Math.max(0, tags.length - limit) : 0;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {displayTags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} size="xs" />
      ))}
      {remaining > 0 && (
        <span
          className="
                        text-[10px] text-[rgb(var(--color-text-muted))] font-extrabold px-2 py-0.5 
                        bg-[rgb(var(--color-surface))]/80 backdrop-blur-sm border border-[rgb(var(--color-border))] rounded-full
                        shadow-[0_1px_2px_rgba(0,0,0,0.05)] whitespace-nowrap
                        hover:bg-[rgb(var(--color-surface))] hover:shadow-md transition-all cursor-default
                    "
          title={`${remaining} more tags`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
};

export default TagList;
