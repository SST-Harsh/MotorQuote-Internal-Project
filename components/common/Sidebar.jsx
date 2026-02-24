'use client';
import { useState, useEffect } from 'react';
import { LogOut, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import userService from '@/services/userService';
const SidebarNavItem = ({ item, isActive, onItemClick, pathname, isOpen }) => {
  const [isSubOpen, setIsSubOpen] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isSubActive = hasSubItems && item.subItems.some((sub) => pathname === sub.href);

  useEffect(() => {
    if (isSubActive) setIsSubOpen(true);
  }, [isSubActive]);

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsSubOpen(!isSubOpen)}
          className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 group/item
                        ${
                          isSubActive || isSubOpen
                            ? 'bg-sidebar-active-bg text-sidebar-active-text shadow-md'
                            : 'text-sidebar-text hover:bg-sidebar-hover/10 hover:text-sidebar-heading'
                        }`}
        >
          <span className="flex items-center gap-4 min-w-0">
            <span
              className={`flex h-8 w-8 items-center text-xl justify-center rounded-lg transition-colors shrink-0
                            ${isSubActive ? 'bg-sidebar-active-bg/10' : 'bg-transparent group-hover/item:bg-sidebar-active-bg/5'}
                        `}
            >
              {item.icon}
            </span>
            <span
              className={`${isOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'} transition-opacity duration-500 delay-100 whitespace-nowrap truncate `}
            >
              {item.label}
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'} ${isSubOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isSubOpen && (
          <div className="space-y-1 overflow-hidden transition-all duration-500 delay-100">
            {item.subItems.map((subItem) => {
              const isChildActive = pathname === subItem.href;
              return (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  onClick={onItemClick}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors group/subitem
                                        ${
                                          isChildActive
                                            ? 'text-sidebar-active-text bg-sidebar-active-bg/5'
                                            : 'text-sidebar-text hover:text-sidebar-heading hover:bg-sidebar-hover/10'
                                        }`}
                >
                  <span className="flex items-center gap-4 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center shrink-0 ml-[10px]">
                      {subItem.icon || <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </span>
                    <span
                      className={`${isOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'} transition-opacity duration-500 delay-100 whitespace-nowrap truncate `}
                    >
                      {subItem.label}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      onClick={onItemClick}
      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 group/item
                ${
                  isActive
                    ? 'bg-sidebar-active-bg text-sidebar-active-text shadow-md'
                    : 'text-sidebar-text hover:bg-sidebar-hover/10 hover:text-sidebar-heading'
                }`}
    >
      <span className="flex items-center gap-4 min-w-0">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors shrink-0
                    ${isActive ? 'bg-sidebar-active-bg/10' : 'bg-transparent group-hover/item:bg-sidebar-active-bg/5'}
                `}
        >
          {item.icon}
        </span>
        <span
          className={`${isOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'} transition-opacity duration-500 delay-100 whitespace-nowrap truncate `}
        >
          {item.label}
        </span>
      </span>

      {item.badge && (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${isOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'} transition-opacity duration-500 delay-100
                    ${
                      isActive
                        ? 'bg-sidebar-active-bg/10 text-sidebar-active-text border-transparent'
                        : 'bg-sidebar-active-bg text-sidebar-active-text border-transparent'
                    }
                `}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
};

const SidebarNav = ({ sections = [], onItemClick, isOpen }) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-4 scrollbar-hide hover:scrollbar-default transition-all">
      {sections.map((section) => (
        <div key={section.title}>
          <p
            className={`text-xs font-bold uppercase tracking-wider text-sidebar-text/70 mb-4 px-2 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'} transition-opacity duration-500 delay-100 whitespace-nowrap truncate`}
          >
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                isActive={pathname === item.href}
                onItemClick={onItemClick}
                pathname={pathname}
                isOpen={isOpen}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};

import { useLanguage } from '@/context/LanguageContext';
import { translateUserRole } from '@/utils/i18n';

export default function Sidebar({ sections, isOpen, onClose, user: propUser }) {
  const sectionsToRender = sections || [];
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();

  // Fallback for user display
  const getDisplayName = () => {
    const u = user || propUser;
    if (u && u.first_name && u.last_name) return `${u.first_name} ${u.last_name}`;
    if (u && u.name) return u.name;
    return t('common.user', 'User');
  };
  const displayName = getDisplayName();

  const getDisplayRole = () => {
    const role = user?.role || propUser?.role || 'user';
    return translateUserRole(role, t);
  };
  const displayRole = getDisplayRole();

  const u = user || propUser;
  const displayAvatar =
    u?.avatar ||
    u?.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`group/sidebar peer fixed top-0 start-0 h-screen bg-sidebar-bg border-e border-sidebar-border flex flex-col z-50 transition-all duration-500 delay-100 ease-in-out
        ${isOpen ? 'translate-x-0 w-[280px]' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:w-[88px] lg:hover:w-[280px]
      `}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10 overflow-hidden">
          <div className="flex items-center gap-4 min-w-[240px]">
            <div className="w-10 h-10 bg-sidebar-active-bg rounded-xl flex items-center justify-center text-black font-bold text-xl shrink-0">
              M
            </div>
            <div
              className={`${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-500 delay-100`}
            >
              <h1
                className="text-xl leading-none text-[rgb(var(--color-text-muted))] tracking-wide whitespace-nowrap"
                style={{ fontFamily: 'var(--font-racing-sans), sans-serif' }}
              >
                MotorQuote
              </h1>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ms-auto lg:hidden text-[rgb(var(--color-text-muted))] hover:bg-white/5 p-2 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNav sections={sectionsToRender} onItemClick={onClose} isOpen={isOpen} />

        <div className="p-4 border-t border-white/10 overflow-hidden">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 min-w-[240px]">
            <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 shadow-sm overflow-hidden relative shrink-0">
              <Image
                key={displayAvatar}
                src={displayAvatar}
                alt={displayName}
                fill
                className="object-cover"
                sizes="40px"
                unoptimized={true}
                onError={(e) => {
                  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                    e.currentTarget.srcset = fallback;
                  }
                }}
              />
            </div>

            <div
              className={`flex-1 min-w-0 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-500 delay-100`}
            >
              <p className="text-sm font-bold text-[rgb(var(--color-text-muted))] truncate">
                {displayName}
              </p>
              <p className="text-xs text-[rgb(var(--color-text-muted))] truncate">{displayRole}</p>
            </div>

            <button
              className={`${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-500 delay-100 p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg`}
              title={t('logout')}
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
