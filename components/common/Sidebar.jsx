'use client';
import React from 'react';
import { LogOut, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

const SidebarNavItem = ({ item, isActive, onItemClick, pathname }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isSubActive = hasSubItems && item.subItems.some((sub) => pathname === sub.href);

  React.useEffect(() => {
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
          <div className="pl-4 space-y-1">
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

export default function Sidebar({ sections, isOpen, onClose, user: propUser }) {
  const sectionsToRender = sections || [];
  const { user: contextUser, logout } = useAuth();

  const displayUser = propUser || contextUser;

  return (
    <>
      <aside
        className={`
        fixed top-0 left-0 h-screen w-[280px] bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] 
        flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* 1. HEADER LOGO */}
        <div className="h-20 flex items-center px-6 border-b border-[rgb(var(--color-border))]">
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            {/* <div className="w-9 h-9 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[rgb(var(--color-primary)/0.2)]">
              <span className="font-bold text-lg">M</span>
            </div> */}
            <Image
              src="/assets/image.png"
              alt="MotorQuote Logo"
              width={48}
              height={48}
              className="w-9 h-9 rounded-xl object-contain"
              priority
            />
            {/* Logo Text */}
            <div>
              <h1
                className="text-xl leading-none text-[rgb(var(--color-text))]"
                style={{ fontFamily: 'Racing Sans One, sans-serif' }}
              >
                MotorQuote
              </h1>
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase tracking-widest mt-1 font-semibold">
                Dealer Admin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] p-2 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNav sections={sectionsToRender} onItemClick={onClose} />
        <div className="p-4 border-t border-[rgb(var(--color-border))]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
            {displayUser ? (
              <>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-surface))] border-2 border-[rgb(var(--color-surface))] shadow-sm overflow-hidden relative">
                  <Image
                    src={displayUser?.avatar || '/assets/avatar-placeholder.jpg'}
                    alt={displayUser?.name || 'User'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>

                {/* Text Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[rgb(var(--color-text))] truncate">
                    {displayUser.name}
                  </p>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] truncate">
                    {displayUser.role}
                  </p>
                </div>

                {/* Logout Button */}
                <button
                  className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-surface))] rounded-lg transition-colors"
                  title="Sign out"
                  onClick={logout}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              /* Skeleton State */
              <>
                <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-surface))] animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-[rgb(var(--color-surface))] rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-[rgb(var(--color-surface))] rounded w-1/2 animate-pulse" />
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
