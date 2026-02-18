'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Activity, Edit2, Trash2, Calendar } from 'lucide-react';
import Image from 'next/image';

export default function DetailViewModal({
  isOpen,
  onClose,
  data,
  title = 'Details',
  onEdit,
  onDelete,
  sections = [],
  statusMap = {},
  activityContent = null,
  logsContent = null,
  showActivityTab = true,
  mode = 'modal', // 'modal' | 'drawer'
  maxWidth = 'max-w-5xl',
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !data || !mounted) return null;

  const defaultStatusColors = {
    active:
      'bg-[rgb(var(--color-success))/0.1] text-[rgb(var(--color-success))] border-[rgb(var(--color-success))/0.2]',
    pending:
      'bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))/0.2]',
    inactive:
      'bg-[rgb(var(--color-text))/0.1] text-[rgb(var(--color-text))] border-[rgb(var(--color-text))/0.2]',
    suspended:
      'bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] border-[rgb(var(--color-error))/0.2]',
  };

  const colors = { ...defaultStatusColors, ...statusMap };
  const statusStr = typeof data.status === 'string' ? data.status : 'active';
  const status = statusStr.toLowerCase();
  const statusStyle = colors[status] || colors.active;

  const displayName = data.name || 'Unknown';
  const displayRole = data.role || '';
  const displayId = data.code || data.id || 'N/A';
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString();
  };
  const joinedDate = formatDate(data.joinedDate) || formatDate(data.createdAt) || 'Recent';

  // Animation & Layout Logic
  const containerClasses =
    mode === 'drawer'
      ? 'fixed inset-0 z-[200] flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-300'
      : 'fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300';

  const contentClasses =
    mode === 'drawer'
      ? `relative bg-[rgb(var(--color-surface))] w-full ${maxWidth} h-full shadow-2xl overflow-hidden border-l border-[rgb(var(--color-border))] flex flex-col animate-in slide-in-from-right duration-500`
      : `relative bg-[rgb(var(--color-surface))] w-full ${maxWidth} rounded-3xl shadow-2xl overflow-hidden border border-[rgb(var(--color-border))] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300`;

  return createPortal(
    <div className={containerClasses}>
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className={contentClasses}>
        <div className="relative bg-[rgb(var(--color-background))] border-b border-[rgb(var(--color-border))] p-5 md:p-8 md:pr-16 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface))] rounded-full hover:text-[rgb(var(--color-text))] transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-purple-100 p-0.5 shadow-lg shadow-purple-100/20 overflow-hidden">
              <div className="w-full h-full bg-[rgb(var(--color-surface))] rounded-[14px] flex items-center justify-center overflow-hidden">
                {data.profile_picture ? (
                  <Image
                    src={data.profile_picture}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold bg-gradient-to-br from-[rgb(var(--color-text))] to-[rgb(var(--color-text))] bg-clip-text text-transparent uppercase">
                    {displayName.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left min-w-0 w-full">
              <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[rgb(var(--color-text))] mb-1 truncate max-w-md mx-auto md:mx-0">
                    {displayName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[rgb(var(--color-text-muted))] text-sm">
                    {displayRole && (
                      <span className="flex items-center gap-1">
                        <Shield size={14} /> {displayRole}
                      </span>
                    )}
                    <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-border))]"></span>
                    <span className="text-xs font-mono opacity-70">ID: {displayId}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${statusStyle}`}
                >
                  {data.status || 'Unknown'}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-2.5 py-1 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-xs text-[rgb(var(--color-text-muted))] flex items-center gap-1.5">
                  <Calendar size={12} /> Joined {joinedDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center md:absolute md:bottom-8 md:right-8 mt-6 md:mt-0">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(data);
                  onClose();
                }}
                className="px-4 py-2 bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Edit2 size={16} /> <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(data.id);
                  onClose();
                }}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all active:scale-95"
              >
                <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>

        {(() => {
          const visibleTabs = [
            'profile',
            ...(showActivityTab ? ['activity'] : []),
            ...(logsContent ? ['communications'] : []),
          ].filter((v, i, a) => a.indexOf(v) === i);

          if (visibleTabs.length <= 1) return null;
          return (
            <div className="flex border-b border-[rgb(var(--color-border))] px-5 md:px-8 bg-[rgb(var(--color-surface))] overflow-x-auto no-scrollbar gap-6 flex-shrink-0 relative z-10">
              {visibleTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 md:pb-4 pt-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap px-1 ${
                    activeTab === tab
                      ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]'
                      : 'border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:border-[rgb(var(--color-border))]'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Details
                </button>
              ))}
            </div>
          );
        })()}

        <div className="p-5 md:p-8 overflow-y-auto bg-[rgb(var(--color-surface))] flex-1 min-h-0">
          {activeTab === 'profile' && (
            <div
              className={`grid ${sections.length === 1 || maxWidth.includes('max-w-xl') || maxWidth.includes('max-w-lg') || maxWidth.includes('max-w-md') ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-x-8 md:gap-x-12 gap-y-6 md:gap-y-8 pb-8`}
            >
              {sections.map((section, idx) => {
                const SectionIcon = section.icon || Shield;
                return (
                  <div key={idx} className="space-y-4 md:space-y-6">
                    <h3 className="text-[rgb(var(--color-text))] font-bold text-base md:text-lg flex items-center gap-2 pb-2 border-b border-[rgb(var(--color-border))] md:border-0">
                      <SectionIcon size={18} className="text-[rgb(var(--color-primary))]" />
                      {section.title}
                    </h3>
                    <div className="space-y-1 md:space-y-4">
                      {section.customContent
                        ? section.customContent
                        : section.fields?.map((field, fIdx) => (
                            <DetailRow
                              key={fIdx}
                              label={field.label}
                              value={field.value !== undefined ? field.value : data[field.key]}
                              isCopyable={field.copyable}
                            />
                          ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'activity' &&
            (activityContent ? (
              <div className="space-y-6 pb-6">{activityContent}</div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[rgb(var(--color-background))] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity size={32} className="text-[rgb(var(--color-text-muted))]" />
                </div>
                <h3 className="text-[rgb(var(--color-text))] text-lg font-semibold">
                  No recent activity
                </h3>
                <p className="text-[rgb(var(--color-text-muted))] text-sm mt-2">
                  This entity hasn&apos;t performed any actions lately.
                </p>
              </div>
            ))}

          {activeTab === 'communications' && logsContent && (
            <div className="space-y-6 pb-6">{logsContent}</div>
          )}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

function DetailRow({ label, value, isCopyable }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-[rgb(var(--color-border))] border-opacity-40 last:border-0 hover:bg-[rgb(var(--color-background))] px-3 rounded-xl transition-colors -mx-3">
      <span className="text-[rgb(var(--color-text-muted))] text-sm font-medium mt-0.5 min-w-[100px]">
        {label}
      </span>
      <span
        className={`text-[rgb(var(--color-text))] text-sm font-medium text-right flex-1 ml-4 break-words break-all ${
          isCopyable
            ? 'select-all cursor-pointer hover:text-[rgb(var(--color-primary))] transition-colors'
            : ''
        }`}
      >
        {value ?? <span className="opacity-30">-</span>}
      </span>
    </div>
  );
}
