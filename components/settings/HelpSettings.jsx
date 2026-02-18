'use client';
import React from 'react';
import { HelpCircle, Mail, Phone, Book, FileText, ExternalLink } from 'lucide-react';

export default function HelpSettings() {
  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8 animate-fade-in">
      <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
        <HelpCircle size={20} className="text-[rgb(var(--color-primary))]" />
        Help & Support
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Support */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[rgb(var(--color-text))] border-b border-[rgb(var(--color-border))] pb-2">
            Contact Support
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
              <Mail className="text-[rgb(var(--color-primary))]" size={20} />
              <div>
                <p className="text-sm font-medium text-[rgb(var(--color-text))]">Email Us</p>
                <a
                  href="mailto:support@motorquote.com"
                  className="text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] transition-colors"
                >
                  support@motorquote.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
              <Phone className="text-[rgb(var(--color-primary))]" size={20} />
              <div>
                <p className="text-sm font-medium text-[rgb(var(--color-text))]">Call Us</p>
                <a
                  href="tel:+18001234567"
                  className="text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] transition-colors"
                >
                  +1 (800) 123-4567
                </a>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                  Mon-Fri, 9am - 6pm EST
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-[rgb(var(--color-text))] border-b border-[rgb(var(--color-border))] pb-2">
            Resources
          </h3>
          <div className="space-y-2">
            <a
              href="/terms"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-[rgb(var(--color-background))] transition-colors group border border-transparent hover:border-[rgb(var(--color-border))]"
            >
              <div className="flex items-center gap-3">
                <Book
                  size={18}
                  className="text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))]"
                />
                <span className="text-sm text-[rgb(var(--color-text))]">
                  User Guide & Documentation
                </span>
              </div>
              <ExternalLink size={14} className="text-[rgb(var(--color-text-muted))]" />
            </a>
            <a
              href="/faq"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-[rgb(var(--color-background))] transition-colors group border border-transparent hover:border-[rgb(var(--color-border))]"
            >
              <div className="flex items-center gap-3">
                <HelpCircle
                  size={18}
                  className="text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))]"
                />
                <span className="text-sm text-[rgb(var(--color-text))]">
                  Frequently Asked Questions
                </span>
              </div>
              <ExternalLink size={14} className="text-[rgb(var(--color-text-muted))]" />
            </a>
            <a
              href="/privacy"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-[rgb(var(--color-background))] transition-colors group border border-transparent hover:border-[rgb(var(--color-border))]"
            >
              <div className="flex items-center gap-3">
                <FileText
                  size={18}
                  className="text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))]"
                />
                <span className="text-sm text-[rgb(var(--color-text))]">
                  Privacy Policy & Terms
                </span>
              </div>
              <ExternalLink size={14} className="text-[rgb(var(--color-text-muted))]" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[rgb(var(--color-border))] text-center">
        <p className="text-xs text-[rgb(var(--color-text-muted))]">
          MotorQuote v2.4.0 &copy; 2026 Moh Enterprises. All rights reserved.
        </p>
      </div>
    </div>
  );
}
