'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Monitor, Palette, Droplets } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '@/context/LanguageContext';

export default function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'light', label: t('theme.light'), icon: Sun, color: 'bg-white' },
    { id: 'dark', label: t('theme.dark'), icon: Moon, color: 'bg-gray-900' },
    { id: 'slate', label: t('theme.slate'), icon: Monitor, color: 'bg-slate-900' },
    { id: 'luxury', label: t('theme.luxury'), icon: Droplets, color: 'bg-neutral-900' },
  ];
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newThemeId) => {
    changeTheme(newThemeId);
    setIsOpen(false);
  };
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 flex items-center justify-center rounded-lg text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-primary))] transition-colors"
        title="Change Theme"
      >
        <Palette size={20} />
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-56 sm:w-64 max-w-[calc(100vw-2rem)] bg-[rgb(var(--color-surface))]/95 backdrop-blur-xl border border-[rgb(var(--color-border))] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] py-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-[rgb(var(--color-border))]">
          <div className="px-4 py-2 text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest">
            {t('theme.preference')}
          </div>
          <div className="space-y-1 p-1">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] shadow-sm'
                      : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))]'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-[rgb(var(--color-surface))]' : 'bg-[rgb(var(--color-background))] group-hover:bg-[rgb(var(--color-surface))]'}`}
                  >
                    <Icon
                      size={14}
                      className={
                        isActive
                          ? 'text-[rgb(var(--color-primary))]'
                          : 'text-[rgb(var(--color-text-muted))]'
                      }
                    />
                  </div>
                  <span className="flex-1 font-semibold text-sm">{t.label}</span>
                  {isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--color-primary))] shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
