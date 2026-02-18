'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, X, Eye, Send as SendIcon, Info, Lock, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import cmsService from '../../../services/cmsService';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import PageHeader from '@/components/common/PageHeader';

const SYSTEM_FOOTER = `
<br/>
<hr style="border: 0; border-top: 1px solid rgb(var(--color-border));"/>
<p style="font-size: 10px; color: rgb(var(--color-text-muted)); font-family: sans-serif;">
    This is a system-generated email from MotorQuote.<br/>
    Please do not reply.
</p>
`;

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
  const { t: tCommon } = useTranslation('common');
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id');
  const { user } = useAuth();
  const textareaRef = useRef(null);
  const router = useRouter();

  const [tagSearch, setTagSearch] = useState('');
  const [showSchemaBuilder, setShowSchemaBuilder] = useState(false);
  const [errors, setErrors] = useState({});

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    templateKey: '',
    subject: '',
    category: 'system',
    bodyHtml: 'Hi {{userName}},\n\nWelcome to MotorQuote.',
    bodyText: 'Hi {{userName}},\n\nWelcome to MotorQuote.',
    isActive: false,
    variables: [{ name: 'userName', type: 'string', required: true, description: 'User name' }],
  });

  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const loadTemplate = React.useCallback(async () => {
    try {
      const data = await cmsService.getEmailTemplateById(templateId);
      if (data) {
        setTemplateData({
          ...data,
          name: data.name || '',
          description: data.description || '',
          templateKey: data.templateKey || data.template_key || '',
          subject: data.subject || '',
          category: data.category || 'system',
          // Ensure defaults if missing, handling both camelCase and snake_case
          variables: data.variables || [],
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
          isActive: data.isActive ?? data.is_active ?? data.status === 'Active',
        });
      }
    } catch (error) {
      console.error('Failed to load template', error);
      Swal.fire('Error', 'Failed to load template', 'error');
    }
  }, [templateId]);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else if (user?.email) {
      setTestEmail(user.email);
    }
  }, [templateId, loadTemplate, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleBodyChange = (e) => {
    const value = e.target.value;
    setTemplateData((prev) => ({
      ...prev,
      bodyHtml: value,
      bodyText: value,
    }));
    if (errors.bodyHtml) setErrors((prev) => ({ ...prev, bodyHtml: null }));
  };

  const insertToken = (tokenName) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateData.bodyHtml;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);

      const newToken = `{{${tokenName}}}`;
      const newText = before + newToken + after;

      setTemplateData((prev) => ({
        ...prev,
        bodyHtml: newText,
        bodyText: newText,
      }));

      // We need to wait for render to set cursor position, doing it in a timeout essentially
      setTimeout(() => {
        const newCursorPos = start + newToken.length;
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
        textarea.focus();
      }, 0);
    }
  };

  const getPreviewHtml = () => {
    const bodyContent = (templateData.bodyHtml || '').replace(/\n/g, '<br/>');

    let previewHtml = `
            <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: rgb(var(--color-text));">
                ${bodyContent}
            </div>
            ${SYSTEM_FOOTER}
        `;

    templateData.variables.forEach((v) => {
      previewHtml = previewHtml.replaceAll(
        `{{${v.name}}}`,
        `<span style="background-color: rgb(var(--color-primary)/0.1); color: rgb(var(--color-primary)); padding: 2px 4px; border-radius: 4px; font-size: 0.9em;">[${v.description}]</span>`
      );
    });
    return previewHtml;
  };

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testEmail) return;

    setSendingTest(true);
    try {
      await cmsService.sendTestEmail(templateId, testEmail);
      Swal.fire({
        title: 'Sent!',
        text: 'Test email has been sent successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      setIsTestEmailModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Error', text: 'Failed to send test email.', icon: 'error' });
    } finally {
      setSendingTest(false);
    }
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

  // Variable Management
  const addVariable = () => {
    setTemplateData((prev) => ({
      ...prev,
      variables: [...prev.variables, { name: '', type: 'string', required: true, description: '' }],
    }));
  };

  const updateVariable = (index, field, value) => {
    const newVars = [...templateData.variables];
    newVars[index][field] = value;
    setTemplateData((prev) => ({ ...prev, variables: newVars }));
  };

  const removeVariable = (index) => {
    const newVars = templateData.variables.filter((_, i) => i !== index);
    setTemplateData((prev) => ({ ...prev, variables: newVars }));
  };

  const filteredTags = templateData.variables.filter(
    (v) =>
      (v.name || '').toLowerCase().includes(tagSearch.toLowerCase()) ||
      v.description?.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] p-3 sm:p-6 space-y-4 sm:space-y-6">
      <PageHeader
        title={templateId ? 'Edit Template' : 'Create New Template'}
        subtitle={
          templateData.name ||
          (templateId ? 'Modify existing template' : 'Define a new email communication')
        }
        icon={
          <Link href="/notifications/email">
            <ArrowLeft size={20} />
          </Link>
        }
      />

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
              placeholder="e.g. Welcome to MotorQuote!"
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
            <select
              name="category"
              value={templateData.category}
              onChange={handleInputChange}
              className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors appearance-none"
            >
              <option value="Onboarding">Onboarding</option>
              <option value="Marketing">Marketing</option>
              <option value="Support">Support</option>
              <option value="System">System</option>
            </select>
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
            <select
              name="isActive"
              value={templateData.isActive}
              onChange={(e) =>
                setTemplateData((p) => ({ ...p, isActive: e.target.value === 'true' }))
              }
              className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors appearance-none"
            >
              <option value="true">Active</option>
              <option value="false">Disabled / Draft</option>
            </select>
          </div>
        </div>

        {/* Row 3: Editor & Merge Tags (Split) */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-[400px] sm:min-h-[500px]">
          {/* Left: Editor */}
          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                Email Body <span className="text-red-500">*</span>
              </label>
            </div>
            <div
              className={`flex-1 bg-[rgb(var(--color-background))] rounded-xl border overflow-hidden flex flex-col relative h-full ${errors.bodyHtml ? 'border-red-500 ring-4 ring-red-50' : 'border-[rgb(var(--color-border))]'}`}
            >
              <textarea
                ref={textareaRef}
                value={templateData.bodyHtml || ''}
                onChange={handleBodyChange}
                className="w-full h-full p-6 bg-transparent focus:outline-none resize-none font-mono text-sm leading-relaxed text-[rgb(var(--color-text))]"
                placeholder="Write your email content here..."
              />
            </div>
            {errors.bodyHtml && (
              <p className="text-[10px] text-red-500 font-bold uppercase">{errors.bodyHtml}</p>
            )}
          </div>

          {/* Right: Merge Tags */}
          <div className="w-full lg:w-80 flex flex-col space-y-2 min-h-[300px] lg:min-h-0">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Dynamic Variables
            </label>
            <div className="flex-1 bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] p-3 sm:p-4 flex flex-col space-y-4 sm:space-y-6 overflow-hidden">
              {/* 1. Quick Insert */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[rgb(var(--color-text-muted))]">
                  Quick Insert
                </label>
                <div className="flex flex-wrap gap-2">
                  {['userName', 'userEmail', 'companyName', 'actionUrl', 'date'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertToken(v)}
                      className="px-2 py-1.5 bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-primary))]/10 border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] rounded text-xs font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] transition-all flex items-center gap-1 group"
                    >
                      <span className="opacity-50 group-hover:opacity-100">+</span>
                      <span className="font-mono">{`{{${v}}}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-[rgb(var(--color-text-muted))]">
                    Detected
                  </label>
                  {(() => {
                    const getVars = (str) => {
                      const vars = new Set();
                      const regex = /{{([^}]+)}}/g;
                      let match;
                      while ((match = regex.exec(str)) !== null) {
                        vars.add(match[1].trim());
                      }
                      return vars;
                    };
                    const subVars = getVars(templateData.subject || '');
                    const textVars = getVars(templateData.bodyText || ''); // Scan text version
                    const htmlVars = getVars(templateData.bodyHtml || '');

                    const count = new Set([...subVars, ...textVars, ...htmlVars]).size;
                    return count > 0 ? (
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">
                        {count} found
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="bg-[rgb(var(--color-surface))] rounded-lg border border-[rgb(var(--color-border))] p-3 min-h-[100px] max-h-[200px] overflow-y-auto custom-scrollbar">
                  {(() => {
                    const getVars = (str) => {
                      const vars = new Set();
                      const regex = /{{([^}]+)}}/g;
                      let match;
                      while ((match = regex.exec(str)) !== null) {
                        vars.add(match[1].trim());
                      }
                      return vars;
                    };
                    const vars = [
                      ...new Set([
                        ...getVars(templateData.subject || ''),
                        ...getVars(templateData.bodyText || ''),
                        ...getVars(templateData.bodyHtml || ''),
                      ]),
                    ];

                    if (vars.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-2">
                          {vars.map((v) => (
                            <span
                              key={v}
                              className="px-2 py-1 bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] rounded text-xs font-mono border border-[rgb(var(--color-primary))]/20 flex items-center gap-1"
                            >
                              <span className="font-bold">{v}</span>
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center p-2 opacity-50">
                        <p className="text-[10px] italic">
                          Type <code className="text-blue-600">{`{{variable}}`}</code> in the
                          content
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 3. Defined/Schema Variables (Toggle) */}
              <div className="pt-4 border-t border-[rgb(var(--color-border))] mt-auto">
                <button
                  onClick={() => setShowSchemaBuilder(!showSchemaBuilder)}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-[rgb(var(--color-surface))] transition-colors group"
                >
                  <div className="text-left">
                    <span className="block text-xs font-bold text-[rgb(var(--color-text))]">
                      Variable Schema
                    </span>
                    <span className="block text-[10px] text-[rgb(var(--color-text-muted))]">
                      Define types & descriptions
                    </span>
                  </div>
                  <span
                    className={`text-[rgb(var(--color-text-muted))] transform transition-transform ${showSchemaBuilder ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {showSchemaBuilder && (
          <div className="border border-[rgb(var(--color-border))] rounded-xl p-4 bg-[rgb(var(--color-background))]">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                Defined Variables
              </label>
              <button
                onClick={addVariable}
                className="text-xs bg-[rgb(var(--color-primary))] text-white px-2 py-1 rounded hover:bg-[rgb(var(--color-primary-dark))]"
              >
                + Add New Definition
              </button>
            </div>
            <div className="space-y-2">
              {templateData.variables.map((v, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Name (e.g. userName)"
                    value={v.name}
                    onChange={(e) => updateVariable(idx, 'name', e.target.value)}
                    className="flex-1 text-xs border bg-[rgb(var(--color-surface))] rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    placeholder="Desc"
                    value={v.description}
                    onChange={(e) => updateVariable(idx, 'description', e.target.value)}
                    className="flex-1 text-xs border bg-[rgb(var(--color-surface))]  rounded px-2 py-1"
                  />
                  <select
                    value={v.required}
                    onChange={(e) => updateVariable(idx, 'required', e.target.value === 'true')}
                    className="text-xs border bg-[rgb(var(--color-surface))] rounded px-2 py-1"
                  >
                    <option value="true">Required</option>
                    <option value="false">Optional</option>
                  </select>
                  <button
                    onClick={() => removeVariable(idx)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 pt-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-2 sm:order-1">
          <button
            onClick={handlePreview}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl bg-[rgb(var(--color-info))] text-white text-sm sm:text-base font-bold hover:bg-[rgb(var(--color-info-dark))] transition-all shadow-lg shadow-[rgb(var(--color-info))/0.2] hover:-translate-y-1 active:translate-y-0"
          >
            Preview Email
          </button>
          <button
            onClick={() => setIsTestEmailModalOpen(true)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] text-sm sm:text-base font-bold hover:bg-[rgb(var(--color-background))] transition-all shadow-sm hover:-translate-y-1 active:translate-y-0"
          >
            Send Test Email
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 order-1 sm:order-2">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] text-sm sm:text-base font-bold transition-colors border border-transparent hover:border-[rgb(var(--color-border))]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 rounded-xl bg-[rgb(var(--color-primary))] text-white text-sm sm:text-base font-bold hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg shadow-[rgb(var(--color-primary))/0.2] hover:-translate-y-1 active:translate-y-0"
          >
            Create Template
          </button>
        </div>
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--color-border))]">
              <h2 className="text-lg font-bold">Email Preview</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 hover:bg-[rgb(var(--color-background))] rounded-full transition-colors font-bold text-[rgb(var(--color-text-muted))]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[rgb(var(--color-background))] p-8">
              <div className="max-w-[600px] mx-auto bg-[rgb(var(--color-surface))] rounded-lg shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
                <div className="p-6 md:p-8">
                  <h1 className="text-xl md:text-2xl font-bold text-[rgb(var(--color-text))] mb-6 border-b border-[rgb(var(--color-border))] pb-4">
                    {templateData.subject || '(No Subject)'}
                  </h1>
                  <div
                    className="p-2 prose prose-sm max-w-none text-[rgb(var(--color-text))] font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-xl hover:bg-[rgb(var(--color-primary-dark))] shadow-lg shadow-[rgb(var(--color-primary)/0.2)] transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[rgb(var(--color-border))]">
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-background))/0.5]">
              <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Send Test Email</h3>
              <button
                onClick={() => setIsTestEmailModalOpen(false)}
                className="p-1 hover:bg-[rgb(var(--color-background))] rounded-full transition-colors"
              >
                <X size={20} className="text-[rgb(var(--color-text-muted))]" />
              </button>
            </div>
            <form onSubmit={handleSendTest} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] transition-all"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsTestEmailModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[rgb(var(--color-border))] font-bold text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--color-primary))] text-white font-bold hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg shadow-[rgb(var(--color-primary))/0.2] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sendingTest ? (
                    'Sending...'
                  ) : (
                    <>
                      <SendIcon size={16} /> Send Test
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
