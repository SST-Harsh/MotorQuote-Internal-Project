"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Monitor, Palette, Droplets } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const themes = [
    { id: 'light', label: 'Light', icon: Sun, color: 'bg-white' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-gray-900' },
    { id: 'slate', label: 'Slate', icon: Monitor, color: 'bg-slate-900' },
    { id: 'luxury', label: 'Luxury', icon: Droplets, color: 'bg-neutral-900' },
];

export default function ThemeSwitcher() {
    const { theme, changeTheme, } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);


    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
                <div className="absolute top-12 right-0 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                        Select Theme
                    </div>
                    {themes.map((t) => {
                        const Icon = t.icon;
                        const isActive = theme === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => handleThemeChange(t.id)}
                                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${isActive
                                    ? 'bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))]'
                                    : 'text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'
                                    }`}
                            >
                                <Icon size={16} />
                                <span className="flex-1 font-medium text-sm">{t.label}</span>
                                {isActive && <div className="h-2 w-2 rounded-full bg-[rgb(var(--color-primary))]" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
