'use client';
import React, { useState, useEffect } from 'react';
import * as yup from 'yup';
import { X, Save, ChevronDown, Eye, EyeOff, Edit3, Plus, AlertCircle, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import CustomDateTimePicker from './CustomDateTimePicker';
import { useTranslation } from '@/context/LanguageContext';

export default function GenericFormModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialData,
  fields = [],
  validationSchema,
  subtitle = 'Please enter the details below.',
  isEditMode = false,
  mode = 'modal',
  hideFooter = false,
  ...props
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- LOGIC HELPERS ---
  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const getAllFields = (fieldsList) => {
    let all = [];
    fieldsList.forEach((f) => {
      if (f.type === 'group' || f.type === 'row') all = [...all, ...f.fields];
      else all.push(f);
    });
    return all;
  };

  useEffect(() => {
    if (isOpen) {
      const initialValues = {};
      const flatFields = getAllFields(fields);

      flatFields.forEach((field) => {
        let defaultValue = field.defaultValue || '';
        if (field.name === 'status') defaultValue = 'Active';
        if (field.type === 'checkbox-group') defaultValue = [];
        initialValues[field.name] = initialData?.[field.name] || defaultValue;
      });

      if (initialData?.id) initialValues.id = initialData.id;
      setFormData(initialValues);
      setErrors({});
    }
  }, [isOpen, initialData, fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    const flatFields = getAllFields(fields);
    const fieldConfig = flatFields.find((f) => f.name === name);
    if (fieldConfig?.format === 'phone') finalValue = value.replace(/[^0-9]/g, '');

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      if (validationSchema) {
        await validationSchema.validate(formData, {
          abortEarly: false,
          context: props.validationContext,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate loading feel
      onSave(formData);
      onClose();
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const validationErrors = {};
        err.inner.forEach((error) => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
      } else {
        console.error('Form submission error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMPONENT RENDERERS ---

  const FieldLabel = ({ label, required }) => (
    <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const ErrorMessage = ({ error }) =>
    error ? (
      <div className="flex items-center gap-1 mt-1.5 text-xs text-red-500 font-medium">
        <AlertCircle size={12} />
        <span>{error}</span>
      </div>
    ) : null;

  const renderField = (field, idx) => {
    const Icon = field.icon;
    const isSelect = field.type === 'select';
    const isCheckboxGroup = field.type === 'checkbox-group';
    const error = errors[field.name];
    const isRequired = validationSchema?.fields?.[field.name]?.exclusiveTests?.required;

    // Wrapper styles based on error state
    const inputWrapperClass = `
            relative flex items-center transition-all duration-200
            bg-[rgb(var(--color-background))] 
            border rounded-xl overflow-hidden
            ${
              error
                ? 'border-red-300 ring-2 ring-red-50'
                : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary)/0.5)] focus-within:ring-2 focus-within:ring-[rgb(var(--color-primary)/0.1)] focus-within:border-[rgb(var(--color-primary))]'
            }
        `;

    if (isCheckboxGroup) {
      return (
        <div key={idx} className={field.className || 'space-y-2'}>
          <FieldLabel label={field.label} required={isRequired} />
          <div className="grid grid-cols-2 gap-3 p-4 bg-[rgb(var(--color-background)/0.5)] border border-[rgb(var(--color-border))] rounded-xl">
            {field.options?.map((opt) => {
              const isChecked =
                Array.isArray(formData[field.name]) && formData[field.name].includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`
                                        flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all border
                                        ${
                                          isChecked
                                            ? 'bg-[rgb(var(--color-surface))] border-[rgb(var(--color-primary))] shadow-sm'
                                            : 'border-transparent hover:bg-[rgb(var(--color-background))]'
                                        }
                                    `}
                >
                  <div
                    className={`
                                        w-5 h-5 rounded flex items-center justify-center transition-colors border
                                        ${isChecked ? 'bg-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]' : 'bg-white border-[rgb(var(--color-border))]'}
                                    `}
                  >
                    {isChecked && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    name={field.name}
                    value={opt.value}
                    checked={isChecked}
                    onChange={(e) => {
                      const val = e.target.value;
                      const current = Array.isArray(formData[field.name])
                        ? formData[field.name]
                        : [];
                      const newValues = e.target.checked
                        ? [...current, val]
                        : current.filter((v) => v !== val);
                      setFormData((prev) => ({ ...prev, [field.name]: newValues }));
                    }}
                    className="hidden"
                  />
                  <span
                    className={`text-sm font-medium ${isChecked ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text))]'}`}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
          <ErrorMessage error={error} />
        </div>
      );
    }

    if (field.type === 'custom') {
      return (
        <div key={idx} className={field.className || 'space-y-1.5'}>
          {field.label && <FieldLabel label={field.label} required={isRequired} />}
          {field.component}
        </div>
      );
    }

    if (field.type === 'datetime') {
      return (
        <div key={idx} className={field.className || 'space-y-1.5'}>
          <FieldLabel label={field.label} required={isRequired} />
          <CustomDateTimePicker
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={(dateStr) => {
              setFormData((prev) => ({ ...prev, [field.name]: dateStr }));
              if (errors[field.name]) setErrors((prev) => ({ ...prev, [field.name]: undefined }));
            }}
            error={errors[field.name]}
          />
        </div>
      );
    }

    if (field.type === 'file') {
      return (
        <div key={idx} className={field.className || 'space-y-1.5'}>
          <FieldLabel label={field.label} required={isRequired} />
          <div
            className={`
                        relative flex items-center transition-all duration-200
                        bg-[rgb(var(--color-background))] 
                        border rounded-xl overflow-hidden p-1
                        ${
                          error
                            ? 'border-red-300 ring-2 ring-red-50'
                            : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary)/0.5)]'
                        }
                    `}
          >
            <input
              type="file"
              name={field.name}
              multiple={field.multiple}
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setFormData((prev) => ({ ...prev, [field.name]: files }));
                if (errors[field.name]) setErrors((prev) => ({ ...prev, [field.name]: undefined }));
              }}
              className="w-full text-sm text-[rgb(var(--color-text-muted))]
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-xs file:font-bold file:uppercase file:tracking-wide
                                file:bg-[rgb(var(--color-primary)/0.1)] file:text-[rgb(var(--color-primary))]
                                hover:file:bg-[rgb(var(--color-primary)/0.2)] file:cursor-pointer cursor-pointer"
            />
            {Icon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none">
                <Icon size={18} />
              </div>
            )}
          </div>
          <ErrorMessage error={error} />
        </div>
      );
    }

    return (
      <div key={idx} className={field.className || 'space-y-1.5'}>
        <FieldLabel label={field.label} required={isRequired} />

        <div className={inputWrapperClass}>
          {Icon && (
            <div className="pl-3 text-[rgb(var(--color-text-muted))]">
              <Icon size={18} />
            </div>
          )}

          {isSelect ? (
            <div className="relative w-full">
              <select
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                className={`w-full ${Icon ? 'pl-2' : 'pl-4'} pr-10 py-3 sm:py-3.5 bg-transparent text-sm sm:text-base font-medium text-[rgb(var(--color-text))] outline-none appearance-none cursor-pointer min-h-[44px]`}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none">
                <ChevronDown size={16} />
              </div>
            </div>
          ) : field.type === 'textarea' ? (
            <textarea
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              rows={3}
              className={`w-full ${Icon ? 'pl-2' : 'pl-4'} pr-4 py-3 bg-transparent text-sm font-medium text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted)/0.5)] outline-none resize-none`}
            />
          ) : (
            <>
              <input
                type={
                  field.type === 'password'
                    ? showPasswords[field.name]
                      ? 'text'
                      : 'password'
                    : field.type || 'text'
                }
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                className={`w-full ${Icon ? 'pl-2' : 'pl-4'} ${field.type === 'password' ? 'pr-10' : 'pr-4'} py-3 bg-transparent text-sm font-medium text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted)/0.5)] outline-none`}
                onWheel={(e) => e.target.blur()} // Prevent scrolling number inputs
              />
              {field.type === 'password' && (
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(field.name)}
                  className="px-3 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
                >
                  {showPasswords[field.name] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            </>
          )}
        </div>
        <ErrorMessage error={error} />
      </div>
    );
  };

  if (!isOpen || !mounted) return null;

  const isDrawer = mode === 'drawer';
  const wrapperClass = isDrawer
    ? 'fixed inset-0 h-full z-[9999] flex justify-end items-stretch p-0'
    : 'fixed inset-0 h-full z-[9999] flex items-center justify-center p-4';

  const containerClass = isDrawer
    ? `relative bg-[rgb(var(--color-surface))] w-full ${props.maxWidth || 'max-w-xl'} shadow-2xl border-l border-[rgb(var(--color-border))] flex flex-col h-full`
    : `relative bg-[rgb(var(--color-surface))] rounded-2xl w-full ${props.maxWidth || 'max-w-2xl'} shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] border border-[rgb(var(--color-border))] overflow-hidden flex flex-col max-h-[90vh]`;

  return createPortal(
    <div className={wrapperClass}>
      {/* Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-[rgb(var(--color-text))]/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.5]">
          <div className="flex items-center gap-4">
            <div
              className={`p-2.5 rounded-xl ${isEditMode ? 'bg-amber-50 text-amber-600' : 'bg-[rgb(var(--color-primary)/0.1)] text-[rgb(var(--color-primary))]'}`}
            >
              {isEditMode ? <Edit3 size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[rgb(var(--color-text))] tracking-tight">
                {title}
              </h2>
              <p className="text-sm text-[rgb(var(--color-text-muted))]">
                {subtitle === 'Please enter the details below.' ? t('form.enterDetails') : subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-error))] hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {fields.map((field, idx) => {
              if (field.showIf && !field.showIf(formData)) return null;

              if (field.type === 'group' || field.type === 'row') {
                const visibleFields = field.fields.filter((f) => !f.showIf || f.showIf(formData));
                if (visibleFields.length === 0) return null;

                return (
                  <div
                    key={idx}
                    className="bg-[rgb(var(--color-background))/0.3)] p-5 rounded-2xl border border-[rgb(var(--color-border)/0.5)]"
                  >
                    {field.title && (
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
                          {field.title}
                        </h3>
                        <div className="h-[1px] flex-1 bg-[rgb(var(--color-border))]" />
                      </div>
                    )}
                    <div className={field.className || 'grid grid-cols-1 sm:grid-cols-2 gap-5'}>
                      {field.fields.map((subField, subIdx) => {
                        if (subField.showIf && !subField.showIf(formData)) return null;
                        return renderField(subField, `${idx}-${subIdx}`);
                      })}
                    </div>
                  </div>
                );
              }
              return renderField(field, idx);
            })}
          </div>
        </form>

        {/* Footer Actions */}
        {!hideFooter && (
          <div className="px-6 py-5 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.5] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-xl shadow-lg shadow-[rgb(var(--color-primary)/0.25)] hover:bg-[rgb(var(--color-primary-dark))] hover:translate-y-[-1px] active:translate-y-[1px] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('form.saving')}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditMode ? t('form.saveChanges') : t('form.add')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
