'use client';

import { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageOnboarding({ onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const { supportedLanguages, changeLanguage } = useLanguage();

  useEffect(() => {
    // Check if user has already selected a language
    const hasSelectedLanguage = localStorage.getItem('language');
    const isFirstLogin = localStorage.getItem('isFirstLogin') === 'true';

    if (!hasSelectedLanguage && isFirstLogin) {
      setIsOpen(true);
    }
  }, []);

  const handleLanguageSelect = (langCode) => {
    setSelectedLang(langCode);
  };

  const handleContinue = async () => {
    // Save first login flag
    localStorage.setItem('isFirstLogin', 'false');

    // Change language using context
    await changeLanguage(selectedLang);

    setIsOpen(false);
    if (onComplete) onComplete(selectedLang);
  };

  if (!isOpen) return null;

  const selectedLanguage = supportedLanguages.find((l) => l.code === selectedLang);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary))/0.8] p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Globe size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Welcome to MotorQuote! 🎉</h2>
              <p className="text-white/90 mt-1">Let&apos;s get started by choosing your language</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-[rgb(var(--color-text-muted))] mb-6 text-center">
            Select your preferred language. You can change this later in settings.
          </p>

          {/* Language Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedLang === lang.code
                    ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] shadow-lg'
                    : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))/0.5]'
                }`}
              >
                <div className="text-5xl mb-3">{lang.flag}</div>
                <div className="text-sm font-bold text-[rgb(var(--color-text))]">
                  {lang.nativeName}
                </div>
                <div className="text-xs text-[rgb(var(--color-text-muted))] mt-1">{lang.name}</div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleContinue}
              className="flex-1 px-6 py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
            >
              Continue with {selectedLanguage?.nativeName}
            </button>
          </div>

          <p className="text-xs text-[rgb(var(--color-text-muted))] text-center mt-4">
            You can change your language preference anytime in Settings → Preferences
          </p>
        </div>
      </div>
    </div>
  );
}
