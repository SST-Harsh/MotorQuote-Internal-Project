'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { locale, currentLanguage, supportedLanguages, changeLanguage, isLoading, t } =
    useLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (langCode) => {
    if (langCode === locale) {
      setIsOpen(false);
      return;
    }

    await changeLanguage(langCode);
    setIsOpen(false);
  };

  const getFlagUrl = (code) => {
    const mapping = {
      en: 'us',
      es: 'es',
      ar: 'sa',
      hi: 'in',
      gu: 'in',
    };
    return `https://flagcdn.com/w40/${mapping[code] || 'us'}.png`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Select Language"
      >
        {/* <Globe size={18} className="text-[rgb(var(--color-text-muted))]" /> */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getFlagUrl(currentLanguage.code)}
          alt={currentLanguage.name}
          className="w-6 h-4 object-cover rounded-sm border border-gray-100" // Added border for better visibility on white bg
        />
        <span className="text-sm font-medium text-[rgb(var(--color-text))] hidden sm:inline">
          {currentLanguage.code.toUpperCase()}
        </span>
        <svg
          className={`w-4 h-4 text-[rgb(var(--color-text-muted))] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 max-w-[calc(100vw-2rem)] bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl z-[9999] overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-[rgb(var(--color-border))]">
            <p className="text-xs font-semibold text-[rgb(var(--color-text-muted))] px-3 py-1">
              {t('common.selectLanguage', 'SELECT LANGUAGE')}
            </p>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isLoading}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                  locale === lang.code
                    ? 'bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))]'
                    : 'hover:bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFlagUrl(lang.code)}
                    alt={lang.name}
                    className="w-6 h-4 object-cover rounded-sm border border-gray-200"
                  />
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                </div>
                {locale === lang.code && (
                  <Check size={16} className="text-[rgb(var(--color-primary))]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
