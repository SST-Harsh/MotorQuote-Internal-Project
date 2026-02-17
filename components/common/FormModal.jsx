'use client';
import React, { useState, useEffect } from 'react';
import * as yup from 'yup';
import { X, Save, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import CustomDateTimePicker from './CustomDateTimePicker';

export default function GenericFormModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialData,
  fields = [],
  validationSchema,
  subtitle = 'Fill in the details below.',
  ...props
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAllFields = (fieldsList) => {
    let all = [];
    fieldsList.forEach((f) => {
      if (f.type === 'group' || f.type === 'row') {
        all = [...all, ...f.fields];
      } else {
        all.push(f);
      }
    });
    return all;
  };

  useEffect(() => {
    if (isOpen) {
      const initialValues = {};
      const flatFields = getAllFields(fields);

      flatFields.forEach((field) => {
        let defaultValue = field.defaultValue || '';
        if (field.name === 'status') defaultValue = 'active';
        if (field.type === 'checkbox-group') defaultValue = [];

        initialValues[field.name] = initialData?.[field.name] || defaultValue;
      });

      if (initialData?.id) {
        initialValues.id = initialData.id;
      }

      if (initialData) {
        Object.keys(initialData).forEach((key) => {});
      }

      setFormData(initialValues);
      setErrors({});
    }
  }, [isOpen, fields, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    const flatFields = getAllFields(fields);
    const fieldConfig = flatFields.find((f) => f.name === name);

    if (fieldConfig?.format === 'phone') {
      finalValue = value.replace(/[^0-9]/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      if (validationSchema) {
        await validationSchema.validate(formData, { abortEarly: false });
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

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

  const renderField = (field, idx) => {
    const Icon = field.icon;
    const isSelect = field.type === 'select';
    const isCheckboxGroup = field.type === 'checkbox-group';
    const error = errors[field.name];

    if (isCheckboxGroup) {
      return (
        <div key={idx} className={field.className || 'space-y-2'}>
          <label className="text-sm font-semibold text-[rgb(var(--color-text))]">
            {field.label}
          </label>
          <div className="grid grid-cols-2 gap-2 p-3 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-[rgb(var(--color-surface))] p-1.5 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  name={field.name}
                  value={opt.value}
                  checked={
                    Array.isArray(formData[field.name]) && formData[field.name].includes(opt.value)
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const current = Array.isArray(formData[field.name]) ? formData[field.name] : [];
                    let newValues;
                    if (e.target.checked) {
                      newValues = [...current, val];
                    } else {
                      newValues = current.filter((v) => v !== val);
                    }
                    setFormData((prev) => ({ ...prev, [field.name]: newValues }));
                  }}
                  className="w-4 h-4 rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
                />
                <span className="text-sm text-[rgb(var(--color-text))]">{opt.label}</span>
              </label>
            ))}
          </div>
          {error && (
            <p className="text-xs text-[rgb(var(--color-error))] font-medium mt-1">{error}</p>
          )}
        </div>
      );
    }

    if (field.type === 'custom') {
      return (
        <div key={idx} className={field.className || 'space-y-1.5'}>
          {field.label && (
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">
              {field.label}
            </label>
          )}
          {field.component}
        </div>
      );
    }

    return (
      <div key={idx} className={field.className || 'space-y-1.5'}>
        <label className="text-sm font-semibold text-[rgb(var(--color-text))]">{field.label}</label>
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text))] pointer-events-none">
              <Icon size={18} />
            </div>
          )}

          {isSelect ? (
            <div className="relative">
              <select
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 bg-[rgb(var(--color-background))] border rounded-xl text-sm outline-none appearance-none cursor-pointer transition-all
                                    ${error ? 'border-[rgb(var(--color-error))] focus:ring-1 focus:ring-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]'}
                                `}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text))] pointer-events-none">
                <ChevronDown size={16} />
              </div>
            </div>
          ) : field.type === 'datetime-local' ? (
            <CustomDateTimePicker
              placeholder={field.placeholder}
              value={formData[field.name]}
              disablePast
              onChange={(newValue) => {
                setFormData((prev) => ({ ...prev, [field.name]: newValue }));
                if (errors[field.name]) {
                  setErrors((prev) => ({ ...prev, [field.name]: undefined }));
                }
              }}
              error={error}
            />
          ) : field.type === 'textarea' ? (
            <textarea
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 h-11 bg-[rgb(var(--color-background))] border rounded-xl text-sm outline-none transition-all
                                ${error ? 'border-[rgb(var(--color-error))] focus:ring-1 focus:ring-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]'}
                            `}
            />
          ) : (
            <input
              type={field.type || 'text'}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              onClick={(e) => {
                if (['date', 'datetime-local', 'time'].includes(field.type)) {
                  try {
                    e.target.showPicker();
                  } catch (err) {
                    // Fallback or ignore if not supported
                  }
                }
              }}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 h-11 bg-[rgb(var(--color-background))] border rounded-xl text-sm outline-none transition-all
                                ${error ? 'border-[rgb(var(--color-error))] focus:ring-1 focus:ring-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]'}
                            `}
            />
          )}
        </div>
        {error && (
          <p className="text-xs text-[rgb(var(--color-error))] font-medium mt-1">{error}</p>
        )}
      </div>
    );
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 h-full z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-[rgb(var(--color-surface))] rounded-2xl w-full ${props.maxWidth || 'max-w-lg'} shadow-2xl border border-[rgb(var(--color-border))] overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]">
          <div>
            <h2 className="text-xl font-bold text-[rgb(var(--color-text))]">{title}</h2>
            <p className="text-sm text-[rgb(var(--color-text))]">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {fields.map((field, idx) => {
            if (field.type === 'group' || field.type === 'row') {
              return (
                <div key={idx}>
                  {field.title && (
                    <h3 className="text-sm uppercase tracking-wider text-[rgb(var(--color-text))] font-bold mb-3 mt-1">
                      {field.title}
                    </h3>
                  )}
                  <div className={field.className || 'grid grid-cols-2 gap-4'}>
                    {field.fields.map((subField, subIdx) =>
                      renderField(subField, `${idx}-${subIdx}`)
                    )}
                  </div>
                </div>
              );
            }
            return renderField(field, idx);
          })}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg shadow-lg shadow-[rgb(var(--color-primary)/0.3)] hover:bg-[rgb(var(--color-primary-dark))] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
