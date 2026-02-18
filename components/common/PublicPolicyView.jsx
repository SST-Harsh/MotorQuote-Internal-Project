'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import Loader from './Loader';

export default function PublicPolicyView({ title, fetcher, type }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetcher();
        setData(result);
      } catch (error) {
        console.error('Failed to load policy', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetcher]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );

  const Icon = type === 'terms' ? FileText : Shield;

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* <div className="mb-6">
                    <Link href="/login" className="flex items-center text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] transition-colors">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Login
                    </Link>
                </div> */}

        <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-xl overflow-hidden border border-[rgb(var(--color-border))]">
          <div className="bg-[rgb(var(--color-primary))] px-6 py-8 sm:px-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3">
              <Icon size={180} />
            </div>
            <h1 className="text-3xl font-bold relative z-10">{title}</h1>
            <p className="mt-2 text-white/80 relative z-10 text-sm">
              Last Updated:{' '}
              {data?.lastEdited ? new Date(data.lastEdited).toLocaleDateString() : 'Recently'}
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="prose max-w-none text-[rgb(var(--color-text))]">
              {/* Render HTML content from CMS */}
              <div
                className="html-content"
                dangerouslySetInnerHTML={{
                  __html: data?.content || `<p>No content available for ${title}.</p>`,
                }}
              />

              {/* Basic Styling for HTML Content */}
              {/* <style jsx global>{`
                                .html-content h1 { font-size: 1.875rem; font-weight: 700; margin-bottom: 1rem; color: #111827; }
                                .html-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #374151; }
                                .html-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #4B5563; }
                                .html-content p { margin-bottom: 1rem; line-height: 1.625; }
                                .html-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                                .html-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
                                .html-content li { margin-bottom: 0.25rem; }
                                .html-content a { color: rgb(var(--color-primary)); text-decoration: underline; }
                                .html-content blockquote { border-left: 4px solid #E5E7EB; padding-left: 1rem; font-style: italic; color: #6B7280; }
                            `}</style> */}
            </div>
          </div>

          <div className="bg-[rgb(var(--color-background))] px-6 py-4 border-t border-[rgb(var(--color-border))] text-center text-xs text-[rgb(var(--color-text-muted))]">
            &copy; {new Date().getFullYear()} MotorQuote Ltd. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
