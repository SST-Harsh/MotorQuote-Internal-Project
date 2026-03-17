'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Monitor, Palette, Droplets } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, color: 'bg-white' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-gray-900' },
    { id: 'slate', label: 'Slate', icon: Monitor, color: 'bg-slate-900' },
    { id: 'luxury', label: 'Luxury', icon: Droplets, color: 'bg-neutral-900' },
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
        className={`
                    relative h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300
                    ${
                      isOpen
                        ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgb(var(--color-primary))]/30 scale-110'
                        : 'text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] shadow-sm'
                    }
                `}
        title="Change Theme"
      >
        <Palette size={20} className={isOpen ? 'animate-spin-slow' : ''} />
        <style jsx global>{`
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(180deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 0.6s ease-in-out;
          }
        `}</style>
      </button>

      {isOpen && (
        <div className="absolute top-14 right-0 w-64 bg-[rgb(var(--color-surface))]/90 backdrop-blur-2xl border border-[rgb(var(--color-border))] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] p-2 z-[9999] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-3 py-2 flex items-center justify-between border-b border-[rgb(var(--color-border))]/50 mb-1">
            <span className="text-[10px] font-black text-[rgb(var(--color-text-muted))] uppercase tracking-widest">
              Theme Preference
            </span>
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400/50" />
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400/50" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`
                                        w-full text-left px-3 py-3 flex items-center gap-3 rounded-xl transition-all duration-200 group
                                        ${
                                          isActive
                                            ? 'bg-[rgb(var(--color-primary))] text-white shadow-md shadow-[rgb(var(--color-primary))]/20'
                                            : 'text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] hover:translate-x-1'
                                        }
                                    `}
                >
                  <div
                    className={`
                                        p-2 rounded-lg shrink-0 transition-colors
                                        ${
                                          isActive
                                            ? 'bg-white/20'
                                            : 'bg-[rgb(var(--color-background))] group-hover:bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]/50'
                                        }
                                    `}
                  >
                    <Icon
                      size={16}
                      className={isActive ? 'text-white' : 'text-[rgb(var(--color-primary))]'}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-sm leading-none">{t.label}</p>
                    <p
                      className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-white/70' : 'text-[rgb(var(--color-text-muted))]'}`}
                    >
                      {t.id === 'light'
                        ? 'Bright & Clean'
                        : t.id === 'dark'
                          ? 'Modern Dark'
                          : t.id === 'slate'
                            ? 'Deep Slate'
                            : 'Premium Luxury'}
                    </p>
                  </div>

                  {isActive ? (
                    <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  ) : (
                    <div className="w-8 h-1.5 rounded-full bg-[rgb(var(--color-background))] overflow-hidden border border-[rgb(var(--color-border))]/30">
                      <div
                        className={`h-full w-1/3 ${t.id === 'light' ? 'bg-indigo-500' : t.id === 'dark' ? 'bg-amber-500' : t.id === 'slate' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[rgb(var(--color-border))]/50 px-2 pb-1">
            <p className="text-[9px] text-[rgb(var(--color-text-muted))] font-medium italic text-center">
              Personalize your workspace experience
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
