'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronUp, MessageCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import Loader from './Loader';

export default function FAQView({ fetcher, title = 'Frequently Asked Questions' }) {
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const data = await fetcher();
        // Ensure data is array
        const validData = Array.isArray(data) ? data : [];
        setFaqs(validData);
        setFilteredFaqs(validData);
      } catch (error) {
        console.error('Failed to load FAQs', error);
      } finally {
        setLoading(false);
      }
    };
    loadFaqs();
  }, [fetcher]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFaqs(faqs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = faqs.filter(
        (faq) =>
          faq.title.toLowerCase().includes(query) || faq.content.toLowerCase().includes(query)
      );
      setFilteredFaqs(filtered);
    }
    setOpenIndex(null); // Close all on search
  }, [searchQuery, faqs]);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Link
              href="/login"
              className="flex items-center text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Login
            </Link>
          </div>

          <h1 className="text-4xl font-extrabold text-[rgb(var(--color-text))] sm:text-5xl tracking-tight">
            {title}
          </h1>
          <p className="text-lg text-[rgb(var(--color-text-muted))] max-w-2xl mx-auto">
            Have questions? We&apos;re here to help. browse through the most common questions below
            or search for specific topics.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className="text-[rgb(var(--color-text-muted))] group-focus-within:text-[rgb(var(--color-primary))] transition-colors"
              size={20}
            />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))] transition-all shadow-sm hover:shadow-md"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div
                key={faq.id || index}
                className={`bg-[rgb(var(--color-surface))] rounded-xl border transition-all duration-200 overflow-hidden
                                    ${
                                      openIndex === index
                                        ? 'border-[rgb(var(--color-primary))] shadow-lg ring-1 ring-[rgb(var(--color-primary)/0.1)]'
                                        : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))]/30 shadow-sm hover:shadow-md'
                                    }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span
                    className={`font-bold text-lg ${openIndex === index ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text))]'}`}
                  >
                    {faq.title}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp
                      className="text-[rgb(var(--color-primary))] flex-shrink-0 ml-4"
                      size={20}
                    />
                  ) : (
                    <ChevronDown
                      className="text-[rgb(var(--color-text-muted))] flex-shrink-0 ml-4"
                      size={20}
                    />
                  )}
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-6 pb-6 pt-0 text-[rgb(var(--color-text-muted))] leading-relaxed border-t border-transparent">
                    <div className="prose max-w-none text-[rgb(var(--color-text-muted))] space-y-2">
                      {/* Basic HTML rendering for answer content */}
                      {faq.content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-[rgb(var(--color-surface))] rounded-2xl border border-dashed border-[rgb(var(--color-border))]">
              <HelpCircle className="mx-auto h-12 w-12 text-[rgb(var(--color-border))] mb-3" />
              <h3 className="text-lg font-medium text-[rgb(var(--color-text))]">
                No questions found
              </h3>
              <p className="text-[rgb(var(--color-text-muted))] mt-1">
                Try adjusting your search terms.
              </p>
            </div>
          )}
        </div>

        {/* Contact Support CTA */}
        <div className="text-center pt-8 pb-4">
          <p className="text-[rgb(var(--color-text-muted))] mb-4">Still have questions?</p>
          <Link
            href="/contact" // Assuming a contact page exists, or mailto
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl text-[rgb(var(--color-text))] font-semibold hover:bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-primary))]/30 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary))]/20"
            onClick={(e) => {
              e.preventDefault();
              // Placeholder action
              alert('Contact support feature coming soon!');
            }}
          >
            <MessageCircle size={18} />
            <span>Contact Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
