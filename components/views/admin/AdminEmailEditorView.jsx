'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Eye, Send as SendIcon, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import cmsService from '../../../services/cmsService';
import { useAuth } from '../../../context/AuthContext';

const SYSTEM_FOOTER = `
<br/>
<hr style="border: 0; border-top: 1px solid rgb(var(--color-border));"/>
<p style="font-size: 10px; color: rgb(var(--color-text-muted)); font-family: sans-serif;">
    This is a system-generated email from MotorQuote.<br/>
    Please do not reply.
</p>
`;

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

export default function AdminEmailEditorView() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id');
  const { user } = useAuth();
  const textareaRef = useRef(null);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    templateKey: '',
    subject: '',
    category: 'system',
    bodyHtml: '',
    bodyText: '',
    isActive: false,
    variables: [],
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const loadTemplate = React.useCallback(async () => {
    if (!templateId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
          variables: data.variables || [],
          bodyHtml: (data.bodyHtml || data.body_html || data.body || '')
            .replace(/<html><body>/gi, '')
            .replace(/<\/body><\/html>/gi, '')
            .trim(),
          bodyText: data.bodyText || data.body_text || '',
          isActive: data.isActive ?? data.is_active ?? data.status === 'Active',
        });
      }
    } catch (error) {
      console.error('Failed to load template', error);
      Swal.fire('Error', 'Failed to load template', 'error');
      router.push('/notifications/email');
    } finally {
      setIsLoading(false);
    }
  }, [templateId, router]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTemplateData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBodyChange = (e) => {
    const value = e.target.value;
    setTemplateData((prev) => ({
      ...prev,
      bodyHtml: value,
      bodyText: value,
    }));
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

  const handleSave = async () => {
    setValidationErrors({});

    try {
      await emailTemplateValidationSchema.validate(templateData, { abortEarly: false });
    } catch (err) {
      const errors = {};
      if (err.inner) {
        err.inner.forEach((error) => {
          errors[error.path] = error.message;
        });
      }
      setValidationErrors(errors);
      return;
    }

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
      Swal.fire('Error', 'Failed to save template', 'error');
    }
  };

  const handleSendTest = () => {
    Swal.fire({
      title: 'Send Test Email',
      input: 'email',
      inputLabel: 'Send test to:',
      inputValue: user?.email || '',
      showCancelButton: true,
      confirmButtonText: 'Send',
      showLoaderOnConfirm: true,
      preConfirm: async (email) => {
        try {
          await cmsService.sendTestEmail(templateId, email);
          return true;
        } catch (error) {
          Swal.showValidationMessage(`Request failed: ${error}`);
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Sent!', 'Test email has been sent successfully.', 'success');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-background))] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/notifications/email"
            className="p-2 rounded-lg hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold font-racing">
            {templateId ? 'Edit Email Template' : 'Create Email Template'}
          </h1>
        </div>
      </div>

      <div className="bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] p-6 space-y-8 shadow-sm">
        {/* Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[rgb(var(--color-background))] p-4 rounded-xl border border-dashed border-[rgb(var(--color-border))]">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))] flex items-center gap-1">
              {templateId ? (
                <>
                  <Lock size={10} /> Name
                </>
              ) : (
                'Template Name'
              )}
            </label>
            {templateId ? (
              <p className="text-sm font-semibold">{templateData.name}</p>
            ) : (
              <div>
                <input
                  type="text"
                  name="name"
                  value={templateData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Dealer Welcome"
                  className={`w-full bg-[rgb(var(--color-surface))] border rounded-lg px-2 py-1 text-sm focus:outline-none ${
                    validationErrors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[rgb(var(--color-border))] focus:border-[rgb(var(--color-primary))]'
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-[10px] mt-0.5">{validationErrors.name}</p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))] flex items-center gap-1">
              {templateId ? (
                <>
                  <Lock size={10} /> Key
                </>
              ) : (
                'Template Key'
              )}
            </label>
            {templateId ? (
              <p className="text-sm font-mono">{templateData.templateKey}</p>
            ) : (
              <div>
                <input
                  type="text"
                  name="templateKey"
                  value={templateData.templateKey}
                  onChange={handleInputChange}
                  placeholder="e.g. dealer_staff_welcome"
                  className={`w-full bg-[rgb(var(--color-surface))] border rounded-lg px-2 py-1 text-sm font-mono focus:outline-none ${
                    validationErrors.templateKey
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[rgb(var(--color-border))] focus:border-[rgb(var(--color-primary))]'
                  }`}
                />
                {validationErrors.templateKey && (
                  <p className="text-red-500 text-[10px] mt-0.5">{validationErrors.templateKey}</p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))] flex items-center gap-1">
              {templateId ? (
                <>
                  <Lock size={10} /> Category
                </>
              ) : (
                'Target Role / Category'
              )}
            </label>
            {templateId ? (
              <p className="text-sm">{templateData.category}</p>
            ) : (
              <select
                name="category"
                value={templateData.category}
                onChange={handleInputChange}
                className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[rgb(var(--color-primary))]"
              >
                <option value="">Select Role/Category</option>
                <option value="dealermanager">Dealer Manager</option>
                <option value="dealerstaff">Dealer Staff</option>
              </select>
            )}
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
              Subject Line
            </label>
            <input
              type="text"
              name="subject"
              value={templateData.subject}
              onChange={handleInputChange}
              placeholder="e.g. Welcome to MotorQuote!"
              className={`w-full bg-[rgb(var(--color-background))] border rounded-lg px-4 py-3 text-sm focus:outline-none transition-all font-medium ${
                validationErrors.subject
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-[rgb(var(--color-border))] focus:border-[rgb(var(--color-primary))]'
              }`}
            />
            {validationErrors.subject && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.subject}</p>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6 min-h-[400px]">
            <div className="flex-1 flex flex-col space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                Email Body
              </label>
              <div
                className={`flex-1 bg-[rgb(var(--color-background))] rounded-xl border overflow-hidden flex flex-col ${
                  validationErrors.bodyHtml ? 'border-red-500' : 'border-[rgb(var(--color-border))]'
                }`}
              >
                <textarea
                  ref={textareaRef}
                  value={templateData.bodyHtml || ''}
                  onChange={handleBodyChange}
                  className="w-full h-full p-6 bg-transparent focus:outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="Write your email content here..."
                />
              </div>
              {validationErrors.bodyHtml && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.bodyHtml}</p>
              )}
            </div>

            <div className="w-full lg:w-80 flex flex-col space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))]">
                Available Variables
              </label>
              <div className="flex-1 bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] p-4 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {(templateData.variables.length > 0
                    ? templateData.variables
                    : [
                        { name: 'userName', description: 'User Name' },
                        { name: 'userEmail', description: 'User Email' },
                        { name: 'companyName', description: 'Company Name' },
                        { name: 'primaryColor', description: 'Primary Branding Color' },
                        { name: 'logoUrl', description: 'Company Logo URL' },
                        { name: 'supportEmail', description: 'Support Contact Email' },
                        { name: 'quoteLink', description: 'Direct Link to Quote' },
                      ]
                  ).map((v) => (
                    <button
                      key={v.name}
                      onClick={() => insertToken(v.name)}
                      className="px-2 py-1.5 bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-primary))]/10 border border-[rgb(var(--color-border))] rounded text-xs font-mono text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] transition-all"
                    >
                      {`{{${v.name}}}`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[rgb(var(--color-text-muted))] mt-4 italic">
                  Click a variable to insert it at the cursor position.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="flex gap-4">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-6 py-2.5 rounded-xl bg-[rgb(var(--color-info))] text-white font-bold hover:bg-[rgb(var(--color-info-dark))] transition-colors shadow-lg"
          >
            Preview
          </button>
          <button
            onClick={handleSendTest}
            className="px-6 py-2.5 rounded-xl bg-[rgb(var(--color-primary))] text-white font-bold hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg flex items-center gap-2"
          >
            <SendIcon size={18} /> Send Test
          </button>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface))] font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 rounded-xl bg-[rgb(var(--color-primary))] text-white font-bold hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--color-border))]">
              <h2 className="text-lg font-bold">Preview: {templateData.name}</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 hover:bg-[rgb(var(--color-background))] rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[rgb(var(--color-background))] p-8">
              <div
                className="mx-auto bg-[rgb(var(--color-surface))] rounded-lg shadow-sm border border-[rgb(var(--color-border))] overflow-hidden p-8 prose prose-sm max-w-none text-[rgb(var(--color-text))]"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
              />
            </div>
            <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
