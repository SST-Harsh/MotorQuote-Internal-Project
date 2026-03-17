'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import cmsService from '../../../services/cmsService';
import { useAuth } from '../../../context/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import CustomSelect from '@/components/common/CustomSelect';
import { useConfig } from '@/context/ConfigContext';
import { useRef } from 'react';

// StatusBadge component remains same

const StatusBadge = ({ status }) => {
  const styles = {
    Active:
      'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] border-[rgb(var(--color-success))]/20',
    Draft:
      'bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))]/20',
    Disabled:
      'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border-[rgb(var(--color-border))]',
    'System Locked':
      'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] border-[rgb(var(--color-error))]/20',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status] || styles['Draft']}`}
    >
      {status}
    </span>
  );
};

// Validation Schema for Email Template
const emailTemplateValidationSchema = yup.object({
  name: yup
    .string()
    .required('Template name is required')
    .min(3, 'Name must be at least 3 characters'),
  subject: yup
    .string()
    .required('Subject line is required')
    .min(5, 'Subject must be at least 5 characters'),
  templateKey: yup
    .string()
    .required('Template key is required')
    .matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores allowed'),
  category: yup.string().required('Category is required'),
  bodyHtml: yup
    .string()
    .required('Email body is required')
    .min(10, 'Body must be at least 10 characters'),
});

export default function CreateEmailTemplateView() {
  const { config } = useConfig();
  const { branding } = config;

  const SYSTEM_FOOTER = `
    <br/>
    <hr style="border: 0; border-top: 1px solid rgb(var(--color-border));"/>
    <p style="font-size: 10px; color: rgb(var(--color-text-muted)); font-family: sans-serif;">
        This is a system-generated email from ${branding.appName}.<br/>
        Please do not reply.
    </p>
    `;

  const searchParams = useSearchParams();
  const templateId = searchParams.get('id');
  const { user } = useAuth();
  const router = useRouter();

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const textareaRef = useRef(null);

  const commonVariables = [
    { name: 'userName', description: 'Name of the recipient' },
    { name: 'appName', description: 'Application name' },
    { name: 'loginLink', description: 'Link to login page' },
    { name: 'supportEmail', description: 'Support contact email' },
  ];

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    templateKey: '',
    subject: '',
    category: 'system',
    bodyHtml: `Hi {{userName}},\n\nWelcome to ${branding.appName}.`,
    bodyText: `Hi {{userName}},\n\nWelcome to ${branding.appName}.`,
    variables: [],
    isActive: false,
  });

  const [initialData, setInitialData] = useState(null);

  const isDirty = React.useMemo(() => {
    if (!templateId) return true;
    if (!initialData) return false;
    return JSON.stringify(templateData) !== JSON.stringify(initialData);
  }, [templateData, initialData, templateId]);

  const loadTemplate = React.useCallback(async () => {
    try {
      const data = await cmsService.getEmailTemplateById(templateId);
      if (data) {
        const processedData = {
          ...data,
          name: data.name || '',
          description: data.description || '',
          templateKey: data.templateKey || data.template_key || '',
          subject: data.subject || '',
          category: data.category || 'system',
          // Clean up bodyHtml to remove <html><body> wrapper for better editing experience
          bodyHtml: (data.bodyHtml || data.body_html || data.body || '')
            .replace(/<html><body>/gi, '')
            .replace(/<\/body><\/html>/gi, '')
            .replace(/^<p>/i, '') // Optional: remove starting paragraph tag if desired, or keep structure
            .replace(/<\/p>$/i, '')
            .trim(),
          bodyText:
            data.bodyText ||
            data.body_text ||
            (data.bodyHtml || data.body_html || data.body || '').replace(/<[^>]*>/g, ''),
          variables: data.variables || [],
          isActive: data.isActive ?? data.is_active ?? data.status === 'Active',
        };
        setTemplateData(processedData);
        setInitialData(JSON.parse(JSON.stringify(processedData)));
      }
    } catch (error) {
      console.error('Failed to load template', error);
      Swal.fire('Error', 'Failed to load template', 'error');
    }
  }, [templateId]);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId, loadTemplate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateData((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-generate templateKey from subject for NEW templates
      // Only if it's currently empty or matches the previous auto-generated value
      if (name === 'subject' && !templateId) {
        const prevAutoKey = prev.subject
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^\w]/g, '')
          .slice(0, 50);
        if (!prev.templateKey || prev.templateKey === prevAutoKey) {
          newData.templateKey = value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w]/g, '')
            .slice(0, 50);
          // Also clear templateKey error if it was auto-generated
          if (errors.templateKey) setErrors((errs) => ({ ...errs, templateKey: null }));
        }
      }

      return newData;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleBodyChange = (content) => {
    setTemplateData((prev) => ({
      ...prev,
      bodyHtml: content,
      bodyText: content.replace(/<[^>]*>?/gm, ''),
    }));
    if (errors.bodyHtml) setErrors((prev) => ({ ...prev, bodyHtml: null }));
  };

  const insertVariable = (varName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = templateData.bodyHtml || '';
    const insertion = `{{${varName}}}`;

    const newText = text.substring(0, start) + insertion + text.substring(end);

    setTemplateData((prev) => ({
      ...prev,
      bodyHtml: newText,
      bodyText: newText.replace(/<[^>]*>?/gm, ''),
    }));

    // Focus and set cursor position after react update (approximate)
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 0);
  };

  const handleSave = async () => {
    setGeneralError(null);
    setErrors({});

    try {
      await emailTemplateValidationSchema.validate(templateData, { abortEarly: false });
    } catch (err) {
      const newErrors = {};
      if (err.inner) {
        err.inner.forEach((error) => {
          newErrors[error.path] = error.message;
        });
      }
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    processSave();
  };

  const processSave = async () => {
    try {
      const payload = {
        ...templateData,
        id: templateId,
        is_active: templateData.isActive,
      };

      await cmsService.saveEmailTemplate(payload);

      Swal.fire({
        title: 'Saved!',
        text: `Template ${templateId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        router.push('/notifications/email');
      });
    } catch (error) {
      console.error('Save failed', error);
      setGeneralError(
        error.response?.data?.message ||
          error.message ||
          'Failed to save template. Please check your inputs and try again.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-[rgb(var(--color-text))] p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.back()}
          className="flex w-fit items-center gap-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Templates</span>
        </button>
        <div className="mt-2">
          <PageHeader
            title={templateId ? 'Edit Template' : 'Create New Template'}
            subtitle={
              templateData.name ||
              (templateId ? 'Modify existing template' : 'Define a new email communication')
            }
          />
        </div>
      </div>

      {generalError && (
        <div className="bg-[rgb(var(--color-error))]/10 border border-[rgb(var(--color-error))]/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <Info className="text-[rgb(var(--color-error))] shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-[rgb(var(--color-error))]">
              Unable to Save Template
            </h4>
            <p className="text-sm text-[rgb(var(--color-error))]/80 mt-1">{generalError}</p>
          </div>
        </div>
      )}

      <div className="bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] p-4 sm:p-6 space-y-6 sm:space-y-8 shadow-sm">
        {/* Row 1: Name & Subject */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={templateData.name}
              onChange={handleInputChange}
              placeholder="e.g. New Member Welcome"
              className={`w-full bg-[rgb(var(--color-background))] border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-all font-medium ${errors.name ? 'border-red-500 ring-1 ring-red-50' : 'border-[rgb(var(--color-border))]'}`}
            />
            {errors.name && (
              <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={templateData.subject}
              onChange={handleInputChange}
              placeholder={`e.g. Welcome to ${branding.appName}!`}
              className={`w-full bg-[rgb(var(--color-background))] border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-all font-medium ${errors.subject ? 'border-red-500 ring-1 ring-red-50' : 'border-[rgb(var(--color-border))]'}`}
            />
            {errors.subject && (
              <p className="text-[10px] text-red-500 font-bold uppercase">{errors.subject}</p>
            )}
          </div>
        </div>

        {/* Row 2: Category, Type (Key), Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Category
            </label>
            <CustomSelect
              name="category"
              value={templateData.category}
              onChange={(e) => handleInputChange(e)} // handleInputChange expects an e.target object
              options={[
                { value: 'Onboarding', label: 'Onboarding' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Support', label: 'Support' },
                { value: 'System', label: 'System' },
              ]}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Type / Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="templateKey"
              value={templateData.templateKey}
              onChange={handleInputChange}
              placeholder="e.g. welcome_email_v1"
              className={`w-full bg-[rgb(var(--color-background))] border rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors ${errors.templateKey ? 'border-red-500 ring-1 ring-red-50' : 'border-[rgb(var(--color-border))]'}`}
            />
            {errors.templateKey && (
              <p className="text-[10px] text-red-500 font-bold uppercase">{errors.templateKey}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Status
            </label>
            <CustomSelect
              name="isActive"
              value={templateData.isActive ? 'true' : 'false'}
              onChange={(e) =>
                setTemplateData((p) => ({ ...p, isActive: e.target.value === 'true' }))
              }
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Disabled / Draft' },
              ]}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Editor */}
          <div className="flex flex-col space-y-2 flex-1 min-h-[400px] sm:min-h-[500px]">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Email Body <span className="text-red-500">*</span>
            </label>
            <div
              className={`flex-1 bg-[rgb(var(--color-background))] rounded-xl border overflow-hidden flex flex-col relative h-full ${errors.bodyHtml ? 'border-red-500 ring-4 ring-red-50' : 'border-[rgb(var(--color-border))]'}`}
            >
              <textarea
                ref={textareaRef}
                name="bodyHtml"
                value={templateData.bodyHtml || ''}
                onChange={(e) => handleBodyChange(e.target.value)}
                className="flex-1 p-4 bg-transparent text-sm font-medium resize-none focus:outline-none min-h-[350px] sm:min-h-[450px]"
                placeholder="Write your email content here..."
              />
            </div>
            {errors.bodyHtml && (
              <p className="text-[10px] text-red-500 font-bold uppercase">{errors.bodyHtml}</p>
            )}
          </div>

          {/* Variables Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="p-4 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--color-text-muted))] mb-4 flex items-center gap-2">
                <Info size={14} className="text-[rgb(var(--color-primary))]" />
                Variables
              </h4>
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] mb-4 italic">
                Click to insert at cursor position
              </p>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {(templateData.variables?.length > 0
                  ? templateData.variables
                  : commonVariables
                ).map((v) => (
                  <button
                    key={v.name}
                    onClick={() => insertVariable(v.name)}
                    className="w-full text-left p-2 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] hover:shadow-sm transition-all group"
                  >
                    <code className="text-[11px] font-bold text-[rgb(var(--color-primary))] group-hover:scale-105 transition-transform inline-block">
                      {'{{'}
                      {v.name}
                      {'}}'}
                    </code>
                    <p className="text-[9px] text-[rgb(var(--color-text-muted))] mt-1 line-clamp-1">
                      {v.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-[rgb(var(--color-primary))]/5 border border-[rgb(var(--color-primary))]/10 rounded-xl">
              <h5 className="text-[10px] font-bold uppercase text-[rgb(var(--color-primary))] mb-2 tracking-wider">
                Pro Tip
              </h5>
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] leading-relaxed">
                You can also manually type variables using the{' '}
                <code className="text-[rgb(var(--color-primary))]">{'{{variableName}}'}</code>{' '}
                syntax.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] text-sm sm:text-base font-bold transition-colors border border-transparent hover:border-[rgb(var(--color-border))]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 rounded-xl bg-[rgb(var(--color-primary))] text-white text-sm sm:text-base font-bold hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg shadow-[rgb(var(--color-primary))/0.2] hover:-translate-y-1 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {templateId ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
