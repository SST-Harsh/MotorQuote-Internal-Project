'use client';
import { useState, useEffect } from 'react';
import { LogOut, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import userService from '@/services/userService';
const SidebarNavItem = ({ item, isActive, onItemClick, pathname }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isSubActive = hasSubItems && item.subItems.some((sub) => pathname === sub.href);

  useEffect(() => {
    if (isSubActive) setIsOpen(true);
  }, [isSubActive]);

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 group
                        ${
                          isSubActive || isOpen
                            ? 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-surface))]'
                            : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-text))]'
                        }`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center text-xl justify-center rounded-lg transition-colors
                            ${isSubActive ? 'bg-[rgb(var(--color-primary))/0.1]' : 'bg-transparent group-hover:bg-[rgb(var(--color-surface))]'}
                        `}
            >
              {item.icon}
            </span>
            {item.label}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="ps-4 space-y-1">
            {item.subItems.map((subItem) => {
              const isChildActive = pathname === subItem.href;
              return (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  onClick={onItemClick}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors
                                        ${
                                          isChildActive
                                            ? 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.05]'
                                            : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'
                                        }`}
                >
                  <span className="flex items-center gap-3">
                    {subItem.icon && (
                      <span className="flex h-5 w-5 items-center justify-center">
                        {subItem.icon}
                      </span>
                    )}
                    {subItem.label}
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
      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 group
                ${
                  isActive
                    ? 'bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))] shadow-sm'
                    : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-text))]'
                }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors
                    ${isActive ? 'bg-[rgb(var(--color-surface))/0.5]' : 'bg-transparent group-hover:bg-[rgb(var(--color-surface))]'}
                `}
        >
          {item.icon}
        </span>
        {item.label}
      </span>

      {item.badge && (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border
                    ${
                      isActive
                        ? 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-primary))] border-transparent shadow-sm'
                        : 'bg-[rgb(var(--color-primary))] text-white border-transparent'
                    }
                `}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
};

const SidebarNav = ({ sections = [], onItemClick }) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))] mb-4 px-2">
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
  // Improved User Display Logic
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

  // Use u (resolved user) for avatar as well
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
        className={`
        fixed top-0 start-0 h-screen w-[280px] bg-[rgb(var(--color-surface))] border-e border-[rgb(var(--color-border))] 
        flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="h-20 flex items-center px-6 border-b border-[rgb(var(--color-border))]">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/image.png"
              alt="MotorQuote Logo"
              width={48}
              height={48}
              className="w-9 h-9 rounded-xl object-contain"
              priority
            />
            <div>
              <h1
                className="text-xl leading-none text-[rgb(var(--color-text))]"
                style={{ fontFamily: 'var(--font-racing-sans), sans-serif' }}
              >
                MotorQuote
              </h1>
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase tracking-widest mt-1 font-semibold">
                {t('sellMadeSimple')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ms-auto lg:hidden text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] p-2 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNav sections={sectionsToRender} onItemClick={onClose} />

        <div className="p-4 border-t border-[rgb(var(--color-border))]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
            <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-surface))] border-2 border-[rgb(var(--color-surface))] shadow-sm overflow-hidden relative">
              <Image
                key={displayAvatar} // Force re-mount if prop changes
                src={displayAvatar}
                alt={displayName}
                fill
                className="object-cover"
                sizes="40px"
                unoptimized={true} // Skip server-side optimization to prevent crashes on bad URLs
                onError={(e) => {
                  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                    e.currentTarget.srcset = fallback;
                  }
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[rgb(var(--color-text))] truncate">
                {displayName}
              </p>
              <p className="text-xs text-[rgb(var(--color-text-muted))] truncate">{displayRole}</p>
            </div>

            <button
              className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-surface))] rounded-lg transition-colors"
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
