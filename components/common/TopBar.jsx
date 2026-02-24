'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Input from './Input';
import { Search, Menu, Loader2, X } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationCenter from './NotificationCenter';
import LanguageSwitcher from './LanguageSwitcher';
import api from '@/utils/api';
import userService from '@/services/userService';

import { useAuth } from '../../context/AuthContext';

import { useTranslation } from '@/context/LanguageContext';
import { formatDate } from '@/utils/i18n';

const TopBar = ({ title, onMenuClick }) => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (!user) return;

      try {
        let results = [];

        // 1. Search Quotes
        const quotesData = await import('@/services/quoteService').then((m) =>
          m.default.getQuotes({ search: searchTerm, limit: 5 })
        );
        const quotes = Array.isArray(quotesData)
          ? quotesData
          : quotesData.quotes || quotesData.data || [];

        results.push(
          ...quotes.map((q) => ({
            type: 'Quote',
            title: `#${q.id} - ${q.vehicle_info?.year || ''} ${q.vehicle_info?.make || ''} ${q.vehicle_info?.model || ''}`,
            subtitle: q.customer_name || q.clientName,
            date: formatDate(q.created_at || q.date),
            url: '/quotes',
            data: q,
          }))
        );

        if (user.role === 'super_admin') {
          try {
            const dealersData = await import('@/utils/api').then((m) =>
              m.default.get('/dealerships', { params: { search: searchTerm, limit: 3 } })
            );
            const dealers = dealersData.data?.data || dealersData.data || [];

            results.push(
              ...dealers.map((d) => ({
                type: 'Dealership',
                title: d.name,
                subtitle: d.location || d.email,
                url: '/dealerships',
                data: d,
              }))
            );
          } catch (e) {
            console.error('Dealer search error', e);
          }
        }

        if (['super_admin', 'admin'].includes(user.role)) {
          try {
            const usersData = await import('@/utils/api').then((m) =>
              m.default.get('/users', { params: { search: searchTerm, limit: 3 } })
            );
            const users = usersData.data?.data || usersData.data || [];

            results.push(
              ...users.map((u) => ({
                type: 'User',
                title: u.name,
                subtitle: u.email,
                url: '/users',
                data: u,
              }))
            );
          } catch (e) {
            console.error('User search error', e);
          }
        }

        setSuggestions(results.slice(0, 8)); // Limit dropdown
        setShowSuggestions(true);
      } catch (error) {
        console.error('Global search failed', error);
        setSuggestions([]);
      }
    }, 500); // 500ms Debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    // Logic moved to useEffect for debouncing
  };

  const handleSuggestionClick = (item) => {
    router.push(`${item.url}?highlight=${item.data.id}`);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[rgb(var(--color-background))]/80 backdrop-blur-md px-4 sm:px-6 py-4 transition-all duration-300">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div
          className={`flex items-center gap-3 md:gap-4 flex-shrink-0 ${showMobileSearch ? 'hidden md:flex' : 'flex'}`}
        >
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] rounded-xl transition-colors flex-shrink-0"
          >
            <Menu size={24} />
          </button>

          <h2 className="text-lg md:text-xl font-bold text-[rgb(var(--color-text))] tracking-tight truncate">
            {title}
          </h2>
        </div>

        {/* Mobile Search Overlay/Toggle Area */}
        <div className={`flex-1 px-2 md:hidden ${showMobileSearch ? 'block' : 'hidden'}`}>
          <div className="relative">
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              autoFocus
              icon={Search}
              className="mb-0 w-full h-10 text-sm shadow-sm"
              inputClassName="bg-[rgb(var(--color-surface))] border-none rounded-full"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onBlur={() => {
                setTimeout(() => {
                  if (!searchTerm) setShowMobileSearch(false);
                  setShowSuggestions(false);
                }, 200);
              }}
            />
            <button
              onClick={() => {
                setShowMobileSearch(false);
                setSearchTerm('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
            >
              <X size={16} />
            </button>
          </div>
          {/* Mobile Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
              {suggestions.map((item, idx) => (
                <div
                  key={`mob-${item.type}-${idx}`}
                  onClick={() => handleSuggestionClick(item)}
                  className="px-4 py-3 hover:bg-[rgb(var(--color-background))] cursor-pointer rounded-xl"
                >
                  <p className="text-sm font-medium text-[rgb(var(--color-text))]">{item.title}</p>
                  <p className="text-xs text-[rgb(var(--color-text-muted))]">{item.subtitle}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 max-w-2xl px-4 hidden md:block relative">
          <div className="relative group">
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              icon={isNavigating ? Loader2 : Search}
              iconClassName={isNavigating ? 'animate-spin text-blue-500' : ''}
              className="mb-0 w-full transition-transform duration-200"
              inputClassName="bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))] rounded-full shadow-sm hover:shadow-md transition-shadow px-6 py-3"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchTerm) setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto p-2">
              {suggestions.map((item, idx) => (
                <div
                  key={`${item.type}-${idx}`}
                  onClick={() => handleSuggestionClick(item)}
                  className="px-4 py-3 hover:bg-[rgb(var(--color-background))] cursor-pointer rounded-xl group transition-colors mb-1 last:mb-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] px-2 py-0.5 rounded-full">
                      {item.type}
                    </span>
                    {item.date && (
                      <span className="text-xs text-[rgb(var(--color-text))]">{item.date}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-[rgb(var(--color-text))] mt-0.5 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 justify-end bg-[rgb(var(--color-surface))] p-1.5 rounded-full shadow-sm border border-[rgb(var(--color-border))]">
          {!showMobileSearch && (
            <button
              onClick={() => setShowMobileSearch(true)}
              className="md:hidden p-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] rounded-full"
            >
              <Search size={20} />
            </button>
          )}
          <div className="flex items-center gap-1 sm:gap-2 px-1">
            <LanguageSwitcher />
            <div className="w-px h-6 bg-[rgb(var(--color-border))] mx-1"></div>
            <NotificationCenter />
            <div className="w-px h-6 bg-[rgb(var(--color-border))] mx-1"></div>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
