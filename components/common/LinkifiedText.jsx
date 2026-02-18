'use client';
import React from 'react';

const LinkifiedText = ({ text, className = '' }) => {
  if (!text) return null;

  // URL Regex: detects http, https, and www
  // Also handles email addresses
  const urlRegex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) => {
        // If the part index is odd (i % 2 === 1), it's a match from the capturing group
        if (i % 2 === 1) {
          const isEmail = part.includes('@') && !part.startsWith('http');
          const href = isEmail
            ? `mailto:${part}`
            : part.startsWith('www.')
              ? `https://${part}`
              : part;

          return (
            <a
              key={i}
              href={href}
              target={isEmail ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className="text-[rgb(var(--color-primary))] hover:underline break-all font-bold"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

export default LinkifiedText;
