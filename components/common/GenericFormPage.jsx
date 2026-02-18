'use client';
import React, { useEffect } from 'react';
import { useForm, useWatch, Controller, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Save, ArrowLeft, X, Eye, EyeOff } from 'lucide-react';
import Input from './Input';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';

const FileInputField = ({ field, register, setValue, watch, error }) => {
  const [preview, setPreview] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const currentValue = watch(field.name);

  React.useEffect(() => {
    // Set initial preview from initialData if exists
    if (currentValue && typeof currentValue === 'string') {
      setPreview(currentValue);
    }
  }, [currentValue]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      if (field.onChange) {
        field.onChange(file);
      }
      setValue(field.name, file);
    }
  };

  const currentAvatar = preview || `https://ui-avatars.com/api/?name=User&background=random`; // Fallback

  return (
    <div className="mb-6">
      {field.label && (
        <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-3">
          {field.label}
        </label>
      )}

      <div
        className="relative group cursor-pointer w-fit"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-24 h-24 rounded-full bg-[rgb(var(--color-background))] relative overflow-hidden ring-4 ring-[rgb(var(--color-surface))] shadow-sm border border-[rgb(var(--color-border))]">
          <Image
            src={currentAvatar}
            alt="Preview"
            fill
            className="object-cover transition-opacity group-hover:opacity-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white drop-shadow-md"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={field.accept || 'image/*'}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {field.helpText && (
        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-3 max-w-xs">
          {field.helpText}
        </p>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const FieldRenderer = ({ field, control, register, errors, watch, setValue, getValues }) => {
  const { t } = useTranslation('common');
  const values = useWatch({ control });
  const [showPassword, setShowPassword] = React.useState(false);
  if (field.showIf && !field.showIf(values)) return null;

  const getNestedError = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((o, k) => (o && o[k] ? o[k] : undefined), obj);
  };

  const errorObj = getNestedError(errors, field.name);
  const error = errorObj?.message;

  if (field.type === 'section') {
    const Icon = field.icon;
    return (
      <div
        className={`space-y-4 ${field.className || ''} animate-in fade-in slide-in-from-bottom-2`}
      >
        {field.title && (
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider flex items-center gap-2">
            {Icon && <Icon size={16} className={field.iconClassName} />} {field.title}
          </h3>
        )}
        <div
          className={`bg-[rgb(var(--color-background))]/30 p-5 rounded-xl border border-[rgb(var(--color-border))] ${field.contentClassName || 'space-y-4'}`}
        >
          {field.fields.map((subField, idx) => (
            <FieldRenderer
              key={subField.name || idx}
              field={subField}
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              getValues={getValues}
            />
          ))}
        </div>
      </div>
    );
  }
  if (field.type === 'row') {
    // Use safe Tailwind classes instead of dynamic template strings
    const cols = field.cols || 2;
    const gridClass =
      cols === 2
        ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
        : cols === 3
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'
          : cols === 4
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
            : 'grid grid-cols-1 gap-4';

    return (
      <div className={gridClass}>
        {field.fields.map((subField, idx) => (
          <FieldRenderer
            key={subField.name || idx}
            field={subField}
            control={control}
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
            getValues={getValues}
          />
        ))}
      </div>
    );
  }

  if (field.type === 'custom') {
    return (
      <div className={field.className}>
        {field.label && (
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1.5">
            {field.label}
          </label>
        )}
        <Controller
          name={field.name}
          control={control}
          render={({ field: { value, onChange } }) => {
            if (field.component) {
              const Component = field.component;
              return (
                <Component
                  value={value}
                  onChange={onChange}
                  watch={watch}
                  getValues={getValues}
                  setValue={setValue}
                  error={error}
                  {...field.props}
                />
              );
            }
            if (field.render) {
              return field.render({
                value,
                onChange,
                register,
                errors,
                watch,
                setValue,
                control,
                getValues,
                error,
              });
            }
            return null;
          }}
        />
      </div>
    );
  }
  if (field.type === 'select') {
    const Icon = field.icon;
    const registration = register(field.name);
    return (
      <div>
        {field.label && (
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1.5">
            {field.label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
              size={18}
            />
          )}
          <select
            {...registration}
            onChange={(e) => {
              registration.onChange(e);
              if (field.onChange) {
                field.onChange(e.target.value, { setValue, getValues });
              }
            }}
            className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-10 py-2.5 sm:py-3 rounded-xl border ${error ? 'border-red-500' : 'border-[rgb(var(--color-border))]'} bg-[rgb(var(--color-surface))] focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none text-sm sm:text-base text-[rgb(var(--color-text))] min-h-[44px] cursor-pointer`}
            disabled={field.disabled}
          >
            <option value="" disabled>
              {field.placeholder || `${t('form.select')} ${field.label || 'Option'}`}
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[rgb(var(--color-text-muted))]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        {field.helpText && (
          <p className="text-xs text-[rgb(var(--color-text-muted))] mt-2">{field.helpText}</p>
        )}
      </div>
    );
  }

  if (field.type === 'checkbox-group') {
    return (
      <div className="bg-[rgb(var(--color-background))]/30 rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
        {field.description && (
          <div className="p-4 bg-[rgb(var(--color-background))] border-b border-[rgb(var(--color-border))]">
            <p className="text-xs text-[rgb(var(--color-text-muted))]">{field.description}</p>
          </div>
        )}
        <div className="divide-y divide-[rgb(var(--color-border))]">
          {field.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-3 p-4 hover:bg-[rgb(var(--color-background))]/50 cursor-pointer transition-colors group"
            >
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  value={opt.value}
                  {...register(field.name)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white checked:border-[rgb(var(--color-primary))] checked:bg-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1"
                />
                <svg
                  className="pointer-events-none absolute h-3.5 w-3.5 left-0.5 top-0.5 text-white opacity-0 peer-checked:opacity-100"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                  {opt.label}
                </p>
                {opt.description && (
                  <p className="text-xs text-[rgb(var(--color-text-muted))]">{opt.description}</p>
                )}
              </div>
            </label>
          ))}
        </div>
        {error && <p className="text-red-500 text-xs m-4">{error}</p>}
      </div>
    );
  }

  if (field.type === 'divider') {
    return <div className={`h-px bg-[rgb(var(--color-border))] ${field.className || ''}`} />;
  }

  if (field.type === 'file') {
    return (
      <FileInputField
        field={field}
        register={register}
        setValue={setValue}
        watch={watch}
        error={error}
      />
    );
  }

  const isPassword = field.type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : field.type || 'text';

  const registration = register(field.name);

  const handleChange = (e) => {
    registration.onChange(e);
    if (field.onChange) {
      field.onChange(e.target.value, { setValue, getValues });
    }
  };

  return (
    <Input
      label={field.label}
      placeholder={field.placeholder}
      type={inputType}
      icon={field.icon}
      className={field.className}
      error={error}
      rightIcon={isPassword ? (showPassword ? EyeOff : Eye) : field.rightIcon}
      onRightIconClick={isPassword ? () => setShowPassword(!showPassword) : field.onRightIconClick}
      name={registration.name}
      ref={registration.ref}
      onBlur={registration.onBlur}
      onChange={handleChange}
      {...field.props}
    />
  );
};

export default function GenericFormPage({
  initialData = {},
  fields = [],
  validationSchema,
  onSave,
  onCancel,
  title,
  subtitle,
  iconClassName,
  saveLabel,
}) {
  const isEditing = !!initialData?.id;

  const initialDataString = JSON.stringify(initialData);
  const stableInitialData = React.useMemo(() => JSON.parse(initialDataString), [initialDataString]);

  const getDefaultValues = React.useCallback(() => {
    const defaults = {};

    const getNestedValue = (obj, path) => {
      return path
        .split('.')
        .reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
    };

    const extractDefaults = (fieldList) => {
      fieldList.forEach((field) => {
        if (field.type === 'section' || field.type === 'row' || field.type === 'column') {
          if (field.fields) extractDefaults(field.fields);
        } else if (field.name) {
          const value = getNestedValue(stableInitialData, field.name);
          defaults[field.name] =
            value !== undefined
              ? value
              : field.defaultValue !== undefined
                ? field.defaultValue
                : '';
        }
      });
    };

    extractDefaults(fields);
    return defaults;
  }, [fields, stableInitialData]);

  const methods = useForm({
    resolver: validationSchema ? yupResolver(validationSchema) : undefined,
    context: { isEditing },
    defaultValues: getDefaultValues(),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = methods;
  const { t } = useTranslation('common');

  useEffect(() => {
    if (stableInitialData) {
      reset(getDefaultValues());
    }
  }, [stableInitialData, reset, getDefaultValues]);

  return (
    <FormProvider {...methods}>
      <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-[rgb(var(--color-border))] flex items-center justify-between sticky top-0 bg-[rgb(var(--color-surface))] z-10 transition-all">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[rgb(var(--color-background))] rounded-full transition-colors text-[rgb(var(--color-text-muted))]"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[rgb(var(--color-text))]">
                {title || (isEditing ? t('form.editTitle') : t('form.createTitle'))}
              </h2>
              <p className="text-sm text-[rgb(var(--color-text-muted))]">
                {subtitle || (isEditing ? t('form.editSubtitle') : t('form.createSubtitle'))}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-8 pt-8 pb-16 max-w-7xl mx-auto">
          <div
            className={`grid grid-cols-1 ${fields.some((f) => f.type === 'column') ? 'lg:grid-cols-2' : ''} gap-10 mb-12`}
          >
            {fields.map((field, idx) => {
              if (field.type === 'column') {
                return (
                  <div key={idx} className="space-y-10">
                    {field.fields.map((subField, subIdx) => (
                      <FieldRenderer
                        key={subIdx}
                        field={subField}
                        control={control}
                        register={register}
                        errors={errors}
                        watch={watch}
                        setValue={setValue}
                        getValues={getValues}
                      />
                    ))}
                  </div>
                );
              }

              return (
                <FieldRenderer
                  key={idx}
                  field={field}
                  control={control}
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  getValues={getValues}
                />
              );
            })}
          </div>

          <div className="mt-20 pt-10 border-t border-[rgb(var(--color-border))] flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-bold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-xl transition-all h-11"
            >
              {t('form.cancel')}
            </button>
            <button
              onClick={handleSubmit(onSave, (errors) =>
                console.error('Form Validation Errors:', errors)
              )}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))] rounded-xl shadow-lg shadow-[rgb(var(--color-primary))/0.2] transition-all disabled:opacity-50 disabled:cursor-not-allowed group h-11"
            >
              <Save size={18} className="group-hover:scale-110 transition-transform" />
              <span>{isSubmitting ? t('form.saving') : saveLabel || t('form.save')}</span>
            </button>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
