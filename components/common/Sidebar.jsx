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
  const isSubActive =
    hasSubItems &&
    item.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + '/'));

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
              // Find the best matching sub-item among siblings
              const isBestMatch = (s) =>
                pathname === s.href || (s.href !== '/' && pathname.startsWith(s.href + '/'));
              const matchingSiblings = item.subItems.filter(isBestMatch);
              // If multiple match, the one with the longest href is the most specific
              const bestMatch = matchingSiblings.sort((a, b) => b.href.length - a.href.length)[0];
              const isChildActive = bestMatch && subItem.href === bestMatch.href;
              return (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  onClick={onItemClick}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                                        ${
                                          isChildActive
                                            ? 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)] shadow-sm'
                                            : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'
                                        }`}
                >
                  <span className="flex items-center gap-3">
                    {subItem.icon && (
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors
                                                ${isChildActive ? 'bg-[rgb(var(--color-surface))/0.5]' : 'bg-transparent'}
                                            `}
                      >
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
                isActive={
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href + '/'))
                }
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

import { useConfig } from '@/context/ConfigContext';

export default function Sidebar({ sections, isOpen, onClose, user: propUser }) {
  const { config } = useConfig();
  const { branding } = config;
  const sectionsToRender = sections || [];
  const { user, logout } = useAuth();

  // Fallback for user display
  const getDisplayName = () => {
    const u = user || propUser;
    if (u && u.first_name && u.last_name) return `${u.first_name} ${u.last_name}`;
    if (u && u.name) return u.name;
    return 'User';
  };
  const displayName = getDisplayName();

  const getDisplayRole = () => {
    const role = user?.role || propUser?.role || 'user';
    // Capitalize role as fallback
    return role
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  const displayRole = getDisplayRole();

  // Use u (resolved user) for avatar as well
  const u = user || propUser;
  const displayAvatar = u?.avatar || u?.profile_picture || '/assets/avatar-placeholder.png';

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
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="h-20 flex items-center px-6 border-b border-[rgb(var(--color-border))]">
          <div className="flex items-center gap-3">
            <Image
              src={branding.logoUrl || '/assets/image.png'}
              alt={`${branding.appName} Logo`}
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
                {branding.appName}
              </h1>
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase tracking-widest mt-1 font-semibold">
                Sell Made Simple
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
                  e.currentTarget.src = '/assets/avatar-placeholder.png';
                  e.currentTarget.srcset = '/assets/avatar-placeholder.png';
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
              title="Logout"
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
