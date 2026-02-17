"use client";
import React from 'react';
import { Palette, Sun, Moon, Monitor, Droplets } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const themes = [
    { id: 'light', label: 'Light', icon: Sun, color: 'bg-white border-gray-200' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-gray-900 border-gray-800' },
    { id: 'slate', label: 'Slate', icon: Monitor, color: 'bg-slate-900 border-slate-800' },
    { id: 'luxury', label: 'Luxury', icon: Droplets, color: 'bg-neutral-900 border-neutral-800' },
];

export default function AppearanceSettings() {
    const { theme, changeTheme, } = useTheme();

    return (
        <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8">
            <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
                <Palette size={20} className="text-[rgb(var(--color-primary))]" />
                Appearance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {themes.map((t) => {
                    const Icon = t.icon;
                    const isActive = theme === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => changeTheme(t.id)}
                            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200
                            ${isActive
                                    ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.05]'
                                    : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary)/0.5)]'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]'}`}>
                                <Icon size={24} />
                            </div>
                            <span className={`font-semibold text-sm ${isActive ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text))]'}`}>
                                {t.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
