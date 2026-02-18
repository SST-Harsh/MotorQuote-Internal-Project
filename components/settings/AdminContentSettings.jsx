'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Shield } from 'lucide-react';
import cmsService from '@/services/cmsService';
import Loader from '@/components/common/Loader';
import Swal from 'sweetalert2';

export default function AdminContentSettings() {
  const [activeTab, setActiveTab] = useState('terms');
  const [loading, setLoading] = useState(false);

  // Singleton Content State (Terms/Privacy)
  const [singletonData, setSingletonData] = useState({ title: '', content: '' });

  const loadContent = React.useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'terms') {
        const data = await cmsService.getTerms();
        setSingletonData(data);
      } else if (activeTab === 'privacy') {
        const data = await cmsService.getPrivacy();
        setSingletonData(data);
      }
    } catch (error) {
      console.error('Failed to load content', error);
      Swal.fire('Error', 'Failed to load content. You may not have permission.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  if (loading && !singletonData.id) return <Loader />;

  const Icon = activeTab === 'terms' ? FileText : Shield;
  const title = activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy';

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden p-4  flex flex-col">
      <div className="p-6 md:p-8 border-b border-[rgb(var(--color-border))] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
          <FileText size={20} className="text-[rgb(var(--color-primary))]" />
          Content Management
        </h2>
        <div className="relative  min-w-[240px]">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] font-medium focus:ring-2 focus:ring-[rgb(var(--color-primary))] outline-none appearance-none cursor-pointer shadow-sm transition-all hover:border-[rgb(var(--color-primary))]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: `right 0.8rem center`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: `1.2em 1.2em`,
            }}
          >
            <option value="terms">Terms & Conditions</option>
            <option value="privacy">Privacy Policy</option>
          </select>
        </div>
      </div>

      <div className="bg-[rgb(var(--color-surface))] mt-4 rounded-2xl shadow-xl overflow-y-auto h-[calc(100vh-200px)] border border-[rgb(var(--color-border))] max-w-4xl mx-auto">
        <div className="bg-[rgb(var(--color-primary))] px-6 py-8 sm:px-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
            <Icon size={180} />
          </div>
          <h1 className="text-3xl font-bold relative z-10 text-white">
            {singletonData.title || title}
          </h1>
          <p className="mt-2 text-white opacity-80 relative z-10 text-sm">
            Last Updated:{' '}
            {singletonData.lastEdited
              ? new Date(singletonData.lastEdited).toLocaleDateString()
              : 'Recently'}
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="prose max-w-xl text-[rgb(var(--color-text))]">
            <div
              className="html-content"
              dangerouslySetInnerHTML={{
                __html: singletonData.content || `<p>No content available.</p>`,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[rgb(var(--color-surface))] px-6 py-4 border-t border-[rgb(var(--color-border))] text-center text-xs text-[rgb(var(--color-text-muted))]">
          &copy; {new Date().getFullYear()} MotorQuote Ltd. All rights reserved.
        </div>
      </div>
    </div>
  );
}
