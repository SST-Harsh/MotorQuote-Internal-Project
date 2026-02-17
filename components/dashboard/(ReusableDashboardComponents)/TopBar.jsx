"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Input from "../../common/Input";
import Image from 'next/image';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import ThemeSwitcher from '../../common/ThemeSwitcher';

import { useAuth } from "../../../context/AuthContext";
import { useNotifications } from "../../../context/NotificationContext";

const TopBar = ({ title, onMenuClick }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allData, setAllData] = useState([]);

  const { unreadCount, userNotifications, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;

    const quotes = JSON.parse(localStorage.getItem('quotes_data') || '[]');
    const dealerships = JSON.parse(localStorage.getItem('dealerships') || '[]');
    const managers = JSON.parse(localStorage.getItem('managers_data') || '[]');
    const sellers = JSON.parse(localStorage.getItem('sellers_data') || '[]');
    const users = JSON.parse(localStorage.getItem('mock_users_db') || '[]');

    let allItems = [];

    if (user.role === 'super_admin') {
      allItems = [
        ...quotes.map(q => ({ type: 'Quote', title: `${q.id} - ${q.vehicle}`, subtitle: q.customerName, date: q.date, url: '/super-admin/quotes', data: q })),
        ...dealerships.map(d => ({ type: 'Dealership', title: d.name, subtitle: d.location, url: '/super-admin/dealerships', data: d })),
        ...managers.map(m => ({ type: 'Manager', title: m.name, subtitle: m.email, url: '/super-admin/users', data: m })),
        ...sellers.map(s => ({ type: 'Seller', title: s.name, subtitle: s.email, url: '/super-admin/users', data: s })),
        ...users.map(u => ({ type: 'User', title: u.name, subtitle: u.email, url: '/super-admin/users', data: u })),
      ];
    }
    else if (user.role === 'admin') {
      allItems = [
        ...quotes.map(q => ({ type: 'Quote', title: `${q.id} - ${q.vehicle}`, subtitle: q.customerName, date: q.date, url: '/admin/quotes', data: q })),
        ...sellers.map(s => ({ type: 'Seller', title: s.name, subtitle: s.email, url: '/admin/sellers', data: s })),
      ];
    }
    else if (user.role === 'seller') {
      allItems = [
        ...quotes.map(q => ({ type: 'Quote', title: `${q.id} - ${q.vehicle}`, subtitle: q.customerName, date: q.date, url: '/admin/quotes', data: q })),
      ];
    }
    else if (user.role === 'dealer') {
      allItems = [
        ...quotes.map(q => ({ type: 'Quote', title: `${q.id} - ${q.vehicle}`, subtitle: q.customerName, date: q.date, url: '/dealer/quotes', data: q })),
        ...dealerships.map(d => ({ type: 'Dealership', title: d.name, subtitle: d.location, url: '/dealer/dealerships', data: d })),
      ];
    }

    setAllData(allItems);
  }, [user]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim().length > 0) {
      const lowerTerm = term.toLowerCase();
      const filtered = allData.filter(item =>
        item.title.toLowerCase().includes(lowerTerm) ||
        item.subtitle.toLowerCase().includes(lowerTerm) ||
        item.type.toLowerCase().includes(lowerTerm)
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item) => {
    router.push(`${item.url}?highlight=${item.data.id}`);
    setSearchTerm("");
    setShowSuggestions(false);
  };

  const handleClearNotifications = () => {
    clearAllNotifications();
    setShowNotifications(false);
  }

  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] px-6 py-4 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">

        {/* Left Side: Hamburger + Title */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-lg transition-colors flex-shrink-0"
          >
            <Menu size={24} />
          </button>

          <h2 className="text-lg md:text-xl font-bold text-[rgb(var(--color-text))] tracking-tight truncate">
            {title}
          </h2>
        </div>

        <div className="flex-1 max-w-2xl px-4 hidden md:block relative">
          <Input
            type="text"
            placeholder="Search quotes, dealers..."
            icon={Search}
            className="mb-0 w-full"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (searchTerm) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <div
                  key={`${item.type}-${idx}`}
                  onClick={() => handleSuggestionClick(item)}
                  className="px-4 py-3 hover:bg-[rgb(var(--color-background))] cursor-pointer border-b border-[rgb(var(--color-border))] last:border-0 group transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] px-2 py-0.5 rounded-full">
                      {item.type}
                    </span>
                    {item.date && <span className="text-xs text-[rgb(var(--color-text))]">{item.date}</span>}
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

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end">
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-lg text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-primary))] transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[rgb(var(--color-error))] border-2 border-[rgb(var(--color-surface))]" />
              )}
            </button>

            {showNotifications && (
              <div className="fixed inset-x-4 top-[70px] sm:absolute sm:top-12 sm:right-0 sm:inset-auto sm:w-80 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-background))]">
                  <h3 className="font-semibold text-sm text-[rgb(var(--color-text))]">Notifications</h3>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-[rgb(var(--color-primary))] hover:underline">
                        Mark all read
                      </button>
                    )}
                    <button onClick={handleClearNotifications} className="text-xs text-[rgb(var(--color-primary))] hover:underline">
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {userNotifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[rgb(var(--color-text-muted))]">
                      No notifications
                    </div>
                  ) : (
                    userNotifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b border-[rgb(var(--color-border))] last:border-0 hover:bg-[rgb(var(--color-background))] transition-colors cursor-pointer ${!notif.readBy.includes(user?.id) ? 'bg-[rgb(var(--color-primary))/0.05]' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-[rgb(var(--color-text))]">{notif.title}</span>
                          <span className="text-[10px] text-[rgb(var(--color-text-muted))]">{new Date(notif.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-2">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};

export default TopBar;