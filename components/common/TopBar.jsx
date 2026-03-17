'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Input from './Input';
import { Search, Menu, Loader2, X, Trash2 } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationCenter from './NotificationCenter';
import api from '@/utils/api';
import userService from '@/services/userService';
import { canViewNotifications } from '@/utils/roleUtils';
import { useAuth } from '../../context/AuthContext';

import { formatDate } from '@/utils/i18n';
import {
  Building2,
  Users,
  FileText,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Bell,
  Mail,
  History,
  Shield,
  Tag,
  Fingerprint,
  Megaphone,
  BarChart,
  BarChart2,
  ClipboardClock,
  Car,
  UserX,
} from 'lucide-react';
const SEARCHABLE_PAGES = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'dealer_manager', 'support_staff'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['super_admin', 'dealer_manager', 'support_staff'],
  },
  { label: 'Suspended Users', href: '/suspended-users', icon: UserX, roles: ['super_admin'] },
  {
    label: 'Dealerships',
    href: '/dealerships',
    icon: Building2,
    roles: ['super_admin', 'dealer_manager'],
  },
  {
    label: 'Quotes',
    href: '/quotes',
    icon: FileText,
    roles: ['super_admin', 'dealer_manager', 'support_staff'],
  },
  { label: 'Reports', href: '/reports', icon: BarChart2, roles: ['super_admin', 'dealer_manager'] },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['super_admin', 'dealer_manager', 'support_staff'],
  },
  {
    label: 'Support Tickets',
    href: '/support',
    icon: HelpCircle,
    roles: ['super_admin', 'dealer_manager', 'support_staff'],
  },
  { label: 'User Lookup', href: '/users', icon: Users, roles: ['support_staff'] },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['super_admin', 'dealer_manager'],
  },
  {
    label: 'Session Management',
    href: '/session_management',
    icon: History,
    roles: ['super_admin', 'dealer_manager'],
  },
  { label: 'Audit Logs', href: '/audit-logs', icon: ClipboardClock, roles: ['super_admin'] },
  // System Management / Content
  {
    label: 'Trash Management',
    href: '/trash',
    icon: Trash2,
    roles: ['super_admin', 'dealer_manager', 'support_staff'],
  },
  { label: 'Roles & Permissions', href: '/roles', icon: Shield, roles: ['super_admin'] },
  { label: 'Tags', href: '/tags', icon: Tag, roles: ['super_admin', 'dealer_manager'] },
  {
    label: 'Impersonation History',
    href: '/impersonation-history',
    icon: Fingerprint,
    roles: ['super_admin'],
  },
  { label: 'CMS', href: '/cms', icon: FileText, roles: ['super_admin'] },
  { label: 'Pricing Config', href: '/cms/config', icon: Settings, roles: ['super_admin'] },
  {
    label: 'Broadcasting',
    href: '/notifications',
    icon: Megaphone,
    roles: ['super_admin', 'dealer_manager'],
  },
  {
    label: 'Email Notifications',
    href: '/notifications/email',
    icon: Mail,
    roles: ['super_admin'],
  },
];

const TopBar = ({ title, onMenuClick }) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Helper to safely get entity ID from string or object
  const getDId = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return String(obj.id || obj._id || obj.value || '');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSearching(false);
        return;
      }

      if (!user) return;

      try {
        let results = [];
        const term = searchTerm.trim().toLowerCase();
        const searchVal = searchTerm.trim();

        // Prepare managedIds for Dealer/Dealer Manager scoping in multiple search blocks
        const managedIds = [];
        if (['dealer_manager', 'dealer'].includes(user?.role)) {
          managedIds.push(...(user.dealerships || []).map((d) => String(d.id || d)));
          if (user.dealership_id) managedIds.push(String(user.dealership_id));
        }

        // 1. Search Pages (Navigation)
        const matchedPages = SEARCHABLE_PAGES.filter(
          (page) => page.roles.includes(user.role) && page.label.toLowerCase().includes(term)
        );
        results.push(
          ...matchedPages.map((p) => ({
            type: 'Page',
            title: p.label,
            subtitle: `Go to ${p.label}`,
            url: p.href,
            icon: p.icon,
            data: { id: p.href },
          }))
        );

        // 3. Search Dealerships — Backend scopes by role context
        let matchedDealershipIds = [];
        if (['super_admin', 'dealer_manager', 'support_staff'].includes(user.role)) {
          try {
            const endpoint =
              user.role === 'super_admin' || user.role === 'support_staff'
                ? '/admin/dealerships'
                : '/dealerships';
            const dealersData = await import('@/utils/api').then((m) =>
              m.default.get(endpoint, { params: { search: searchVal, limit: 10 } })
            );
            let dealers =
              dealersData.data?.dealerships || dealersData.data?.data || dealersData.data || [];

            if (user.role === 'dealer_manager') {
              dealers = dealers.filter((d) => {
                const dealerId = String(d.id);
                const isManaged = managedIds.includes(dealerId);
                const isOwner =
                  String(d.dealer_owner || d.dealer_owner_id || '') === String(user.id);
                return isManaged || isOwner;
              });
            }

            matchedDealershipIds = dealers.map((d) => String(d.id));

            results.push(
              ...dealers.slice(0, 3).map((d) => ({
                type: 'Dealership',
                title: d.name,
                subtitle: `${d.primary_admin_name || d.dealer_owner_name || 'No Manager Assigned'} | ${d.location || d.email}`,
                url: '/dealerships',
                icon: Car,
                data: { id: d.id, ...d },
              }))
            );
          } catch (e) {
            console.error('Dealer search error', e);
          }
        }

        // 2. Search Quotes — use the same endpoint as the quote view for each role
        try {
          const isDealerMod = ['dealer_manager', 'dealer', 'staff'].includes(user.role);
          const quoteService = await import('@/services/quoteService').then((m) => m.default);

          // Parallel search:
          // 1. Direct term search (relying on backend to match)
          // 2. Recent quotes fetch (to filter client-side for vehicles/models if backend is restricted)
          const searchPromises = [
            quoteService.getQuotes({
              search: searchVal,
              limit: 15,
              _useDealerEndpoint: isDealerMod,
            }),
            quoteService.getQuotes({ limit: 40, _useDealerEndpoint: isDealerMod }),
          ];

          if (matchedDealershipIds.length > 0) {
            // If we found dealerships, also search for quotes specifically in those dealerships
            matchedDealershipIds.slice(0, 5).forEach((dId) => {
              searchPromises.push(
                quoteService.getQuotes({
                  dealership_id: dId,
                  limit: 5,
                  _useDealerEndpoint: isDealerMod,
                })
              );
            });
          }

          const searchResults = await Promise.all(searchPromises);

          // Flatten and de-duplicate with robust check
          let allQuotesFlat = [];
          searchResults.forEach((res) => {
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res && Array.isArray(res.quotes)) list = res.quotes;
            else if (res && res.data && Array.isArray(res.data.quotes)) list = res.data.quotes;
            else if (res && Array.isArray(res.data)) list = res.data;

            allQuotesFlat.push(...list);
          });

          // De-duplicate by ID
          const seenIds = new Set();
          let quotes = allQuotesFlat.filter((q) => {
            if (seenIds.has(q.id)) return false;
            seenIds.add(q.id);
            return true;
          });

          if (['dealer_manager', 'dealer', 'staff'].includes(user.role)) {
            quotes = quotes.filter((q) => {
              const qDealerId = getDId(q.dealership) || String(q.dealership_id || '');
              if (managedIds.length > 0) return managedIds.includes(qDealerId);
              return true;
            });
          }
          // Note: super_admin and support_staff see all quotes via backend scoping

          results.push(
            ...quotes.slice(0, 10).map((q) => {
              const qDId = getDId(q.dealership) || String(q.dealership_id || '');
              const dealerName =
                q.dealership_name ||
                q.dealership?.name ||
                (user.role === 'dealer_manager' && String(user.dealership_id) === qDId
                  ? user.dealership?.name
                  : null) ||
                (managedIds.includes(qDId)
                  ? (user.dealerships || []).find((d) => String(d.id || d) === qDId)?.name
                  : null);

              // Robust vehicle info extraction
              const vInfo =
                (typeof q.vehicle_info === 'object' ? q.vehicle_info : null) ||
                (typeof q.vehicle_details === 'object' ? q.vehicle_details : null) ||
                (typeof q.vehicle === 'object' ? q.vehicle : null) ||
                {};

              const vehicleStr =
                q.vehicle_name ||
                q.car_name ||
                q.vehicle_display ||
                q.vehicle_title ||
                (typeof q.vehicle === 'string' ? q.vehicle : '') ||
                (typeof q.vehicle_info === 'string' ? q.vehicle_info : '') ||
                (typeof q.vehicle_details === 'string' ? q.vehicle_details : '') ||
                `${vInfo.year || q.year || vInfo.vehicle_year || ''} ${vInfo.make || q.make || vInfo.vehicle_make || ''} ${vInfo.model || q.model || vInfo.vehicle_model || ''}`.trim();

              const vinStr =
                vInfo.vin || q.vin || vInfo.vehicle_vin
                  ? ` | VIN: ${vInfo.vin || q.vin || vInfo.vehicle_vin}`
                  : '';
              const customerName = q.customer_name || q.clientName || q.customer || 'N/A';

              return {
                type: 'Quote',
                title: `${customerName}${vehicleStr ? ' — ' + vehicleStr : ''}`,
                subtitle: `${dealerName ? dealerName + ' | ' : ''}${vehicleStr || 'Direct Quote'}${vinStr}`,
                date: formatDate(q.created_at || q.date),
                url: '/quotes',
                icon: FileText,
                data: { id: q.id, ...q },
              };
            })
          );
        } catch (e) {
          console.error('Quote search error', e);
        }

        // 4. Search Users — super_admin and support_staff (support_staff sees sellers only)
        if (['super_admin', 'support_staff'].includes(user.role)) {
          try {
            const usersData = await import('@/utils/api').then((m) =>
              m.default.get('/users', { params: { search: searchVal, limit: 15 } })
            );
            let users = usersData.data?.data || usersData.data || [];
            // Support staff can only look up sellers
            if (user.role === 'support_staff') {
              users = users.filter((u) => (u.role || '').toLowerCase() === 'seller');
            }
            results.push(
              ...users.slice(0, 3).map((u) => ({
                type: 'User',
                title: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
                subtitle: `${u.email} | ${u.role?.name || u.role}`,
                url: '/users',
                icon: Users,
                data: { id: u.id, ...u },
              }))
            );
          } catch (e) {
            console.error('User search error', e);
          }
        }

        // 5. Search Staff (Dealer/Staff/Manager)
        if (['dealer_manager', 'dealer', 'staff'].includes(user.role)) {
          try {
            const staffData = await import('@/services/userService').then((m) =>
              m.default.getDealerStaff({ search: searchVal, limit: 10 })
            );
            let staff = staffData.data?.staff || staffData.data || staffData || [];

            // Filter out super_admins and other higher managers if needed, and ensure they belong to managed dealerships
            staff = staff.filter((u) => {
              const roleName = (u.role?.name || u.role || '').toLowerCase();
              if (roleName === 'super_admin' || roleName === 'dealer_manager') return false;

              // If we have managedIds from global scope, check if staff belongs to one
              if (managedIds.length > 0) {
                const uDealerId = getDId(u.dealership) || String(u.dealership_id || '');
                return managedIds.includes(uDealerId);
              }
              return true;
            });

            results.push(
              ...staff.slice(0, 3).map((u) => ({
                type: 'Staff',
                title: u.name || `${u.first_name} ${u.last_name}`,
                subtitle: `${u.email} | ${u.role?.name || u.role || 'Staff'}`,
                url: '/users',
                icon: Users,
                data: { id: u.id, ...u },
              }))
            );
          } catch (e) {
            console.error('Staff search error', e);
          }
        }
        // 6. Search Notifications
        if (canViewNotifications(user)) {
          try {
            const notificationsData = await import('@/services/notificationService').then((m) =>
              m.default.getAllNotifications({ search: searchVal, limit: 10 })
            );
            const notifications = Array.isArray(notificationsData)
              ? notificationsData
              : notificationsData.data?.notifications ||
                notificationsData.data ||
                notificationsData ||
                [];

            results.push(
              ...notifications.slice(0, 3).map((n) => ({
                type: 'Notification',
                title: n.title,
                subtitle: n.message?.substring(0, 40) + (n.message?.length > 40 ? '...' : ''),
                url: '/notifications',
                icon: Bell,
                data: { id: n.id, ...n },
              }))
            );
          } catch (e) {
            console.error('Notification search error', e);
          }
        }

        // 7. Search Tags (Super Admin & Managers)
        if (['super_admin', 'dealer_manager'].includes(user.role)) {
          try {
            const tagService = await import('@/services/tagService').then((m) => m.default);
            // using getAllTags with search instead of autocomplete for broader matching
            const tags = await tagService.getAllTags({ search: searchVal, limit: 10 });

            results.push(
              ...tags.slice(0, 3).map((t) => ({
                type: 'Tag',
                title: t.name,
                subtitle: t.type ? `Type: ${t.type}` : 'Tag Management',
                url: '/tags',
                icon: Tag,
                data: { id: t.id, ...t },
              }))
            );
          } catch (e) {
            console.error('Tag search error', e);
          }
        }

        // 8. Search Audit Logs (Super Admin)
        if (user.role === 'super_admin') {
          try {
            const auditService = await import('@/services/auditService').then((m) => m.default);
            const auditData = await auditService.getAuditLogs({ search: searchVal, limit: 10 });
            const logs =
              auditData?.data?.logs ||
              auditData?.logs ||
              (Array.isArray(auditData) ? auditData : []);

            results.push(
              ...logs.slice(0, 3).map((log) => ({
                type: 'Audit Log',
                title: log.action || 'System Action',
                subtitle: `${log.resource_type || 'System'} | ${log.user?.email || 'System'}`,
                url: '/audit-logs',
                icon: ClipboardClock,
                data: { id: log.id, ...log },
              }))
            );
          } catch (e) {
            console.error('Audit search error', e);
          }
        }

        // 9. Search CMS Content (Super Admin)
        if (user.role === 'super_admin') {
          try {
            const cmsService = await import('@/services/cmsService').then((m) => m.default);
            const allCmsContent = await cmsService.getAllContent();
            const term = searchTerm.toLowerCase();
            const matchingCms = allCmsContent.filter(
              (c) =>
                c.title?.toLowerCase().includes(term) ||
                c.content_type?.toLowerCase().includes(term) ||
                c.slug?.toLowerCase().includes(term)
            );

            results.push(
              ...matchingCms.slice(0, 3).map((c) => ({
                type: 'CMS Content',
                title: c.title,
                subtitle: `Type: ${c.content_type || 'Page'}`,
                url: `/cms?tab=${c.content_type || 'faq'}`,
                icon: FileText,
                data: { id: c.id, ...c },
              }))
            );
          } catch (e) {
            console.error('CMS search error', e);
          }
        }

        // 10. Search Trash (Super Admin / Managers / Support)
        if (['super_admin', 'dealer_manager', 'support_staff'].includes(user.role)) {
          try {
            const trashService = await import('@/services/trashService').then((m) => m.default);
            const trashData = await trashService.getTrashItems({ search: searchVal, limit: 10 });
            const items =
              trashData?.data?.items ||
              trashData?.items ||
              (Array.isArray(trashData) ? trashData : []);

            results.push(
              ...items.slice(0, 3).map((item) => ({
                type: 'Trash Item',
                title: item.title || item.name || 'Deleted Item',
                subtitle: `Deleted ${item.deleted_type || 'Resource'}`,
                url: '/trash' + `?tab=${item.item_type || item.deleted_type || item.type}`,
                icon: Trash2,
                data: { id: item.id, ...item },
              }))
            );
          } catch (e) {
            console.error('Trash search error', e);
          }
        }

        // 11. Final client-side sanity check to ensure results match the term
        // This prevents permissive backends or mocks from showing unrelated items
        const searchTerms = term.split(/\s+/).filter(Boolean);
        const filteredResults = results.filter((res) => {
          if (searchTerms.length === 0) return true;

          const content =
            `${res.title || ''} ${res.subtitle || ''} ${res.type || ''}`.toLowerCase();
          // Ensure every keyword typed by the user matches something in the result
          return searchTerms.every((t) => content.includes(t));
        });

        setSuggestions(filteredResults.slice(0, 12));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Global search failed', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms Debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim().length > 0) {
      setIsSearching(true);
      setShowSuggestions(true);
    } else {
      setIsSearching(false);
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (item) => {
    const itemId = item.data?.id || item.data?._id || item.data?.value;
    if (itemId && item.type !== 'Page') {
      const separator = item.url.includes('?') ? '&' : '?';
      router.push(`${item.url}${separator}highlightId=${itemId}`);
    } else {
      router.push(item.url);
    }
    setSearchTerm('');
    setShowSuggestions(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[rgb(var(--color-surface))] border-b border-[rgb(var(--color-border))] px-6 py-4 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-lg transition-colors flex-shrink-0"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 max-w-2xl hidden md:block relative">
          <Input
            type="text"
            placeholder="Search..."
            icon={isNavigating ? Loader2 : Search}
            iconClassName={isNavigating ? 'animate-spin text-[rgb(var(--color-primary))]' : ''}
            rightIcon={searchTerm ? X : null}
            onRightIconClick={() => {
              setSearchTerm('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="mb-0 w-full"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (searchTerm) setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />

          {showSuggestions && (isSearching || searchTerm?.trim().length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-8 flex flex-col items-center justify-center text-[rgb(var(--color-text-muted))]">
                  <Loader2
                    className="animate-spin mb-3 text-[rgb(var(--color-primary))]"
                    size={28}
                  />
                  <p className="text-xs uppercase tracking-widest font-bold opacity-70">
                    Searching Application...
                  </p>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <div
                    key={`${item.type}-${idx}`}
                    onClick={() => handleSuggestionClick(item)}
                    className="px-4 py-3 hover:bg-[rgb(var(--color-background))] cursor-pointer border-b border-[rgb(var(--color-border))] last:border-0 group transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[rgb(var(--color-primary))]">
                          {item.icon && <item.icon size={14} />}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] px-2 py-0.5 rounded-full">
                          {item.type}
                        </span>
                      </div>
                      {item.date && (
                        <span className="text-xs text-[rgb(var(--color-text-muted))]">
                          {item.date}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5 truncate italic">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-[rgb(var(--color-text-muted))]">
                  <div className="w-12 h-12 bg-[rgb(var(--color-primary))/0.05] rounded-full flex items-center justify-center mb-3">
                    <Search size={24} className="opacity-40" />
                  </div>
                  <p className="text-sm font-bold text-[rgb(var(--color-text))] mb-1">
                    No results found
                  </p>
                  <p className="text-xs opacity-70">
                    We couldn&apos;t find anything matching &quot;{searchTerm}&quot;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-3 md:gap-4 flex-shrink-0 ${showMobileSearch ? 'hidden md:flex' : 'flex'}`}
        >
          <h2 className="text-lg md:text-xl font-bold text-[rgb(var(--color-text))] tracking-tight truncate">
            {title}
          </h2>
        </div>

        {/* Mobile Search Overlay/Toggle Area */}
        <div className={`flex-1 px-2 md:hidden ${showMobileSearch ? 'block' : 'hidden'}`}>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search Application..."
              autoFocus
              icon={Search}
              className="mb-0 w-full h-10 text-sm"
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
          {showSuggestions && (isSearching || searchTerm?.trim().length > 0) && (
            <div className="absolute left-4 right-4 top-full mt-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-6 flex flex-col items-center justify-center text-[rgb(var(--color-text-muted))]">
                  <Loader2
                    className="animate-spin mb-2 text-[rgb(var(--color-primary))]"
                    size={20}
                  />
                  <p className="text-xs uppercase tracking-widest font-semibold">Searching...</p>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <div
                    key={`mob-${item.type}-${idx}`}
                    onClick={() => handleSuggestionClick(item)}
                    className="px-4 py-3 hover:bg-[rgb(var(--color-background))] cursor-pointer border-b border-[rgb(var(--color-border))] last:border-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[rgb(var(--color-primary))]">
                          {item.icon && <item.icon size={12} />}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] px-2 py-0.5 rounded-full">
                          {item.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[rgb(var(--color-text))]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[rgb(var(--color-text-muted))] italic truncate">
                      {item.subtitle}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 flex flex-col items-center justify-center text-[rgb(var(--color-text-muted))] text-center">
                  <div className="w-10 h-10 bg-[rgb(var(--color-primary))/0.05] rounded-full flex items-center justify-center mb-2">
                    <Search size={20} className="opacity-40" />
                  </div>
                  <p className="text-sm font-bold text-[rgb(var(--color-text))] mb-1">No results</p>
                  <p className="text-[10px] opacity-70 px-4">
                    No matches for &quot;{searchTerm}&quot;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end">
          {!showMobileSearch && (
            <button
              onClick={() => setShowMobileSearch(true)}
              className="md:hidden p-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] rounded-lg"
            >
              <Search size={20} />
            </button>
          )}
          {canViewNotifications(user) && <NotificationCenter />}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
