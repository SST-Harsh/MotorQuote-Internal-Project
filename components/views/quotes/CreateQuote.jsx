'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import GenericFormPage from '@/components/common/GenericFormPage';
import CustomDateTimePicker from '@/components/common/CustomDateTimePicker';
import quoteService from '@/services/quoteService';
import userService from '@/services/userService';
import dealershipService from '@/services/dealershipService';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Car,
  DollarSign,
  FileText,
  Plus,
  X,
  TrendingUp,
  Info,
  Building2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import TagInput from '@/components/common/tags/TagInput';
import tagService from '@/services/tagService';

const LiveFinanceSummary = () => {
  const { setValue, control } = useFormContext();

  const amount = Number(useWatch({ control, name: 'amount' }) || 0);
  const downPayment = Number(useWatch({ control, name: 'down_payment' }) || 0);
  const tradeIn = Number(useWatch({ control, name: 'trade_in_value' }) || 0);
  const interestRate = Number(useWatch({ control, name: 'interest_rate' }) || 0);
  const loanTerm = Number(useWatch({ control, name: 'loan_term' }) || 60);
  const additionalServices = useWatch({ control, name: 'additional_services' }) || [];
  const docFee = Number(useWatch({ control, name: 'additional_fees.documentation_fee' }) || 0);
  const regFee = Number(useWatch({ control, name: 'additional_fees.registration_fee' }) || 0);
  const dealerFee = Number(useWatch({ control, name: 'additional_fees.dealer_fee' }) || 0);

  const servicesTotal = additionalServices.reduce((acc, s) => acc + Number(s.price || 0), 0);

  const vehicleTotal = amount + docFee + regFee + dealerFee + servicesTotal;
  const totalDeductions = downPayment + tradeIn;
  const principal = vehicleTotal - totalDeductions;

  const calculatedPayment = React.useMemo(() => {
    if (principal <= 0 || loanTerm <= 0) return 0;
    if (interestRate === 0) return Math.round((principal / loanTerm) * 100) / 100;

    const monthlyRate = interestRate / 100 / 12;
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
      (Math.pow(1 + monthlyRate, loanTerm) - 1);
    return Math.round(payment * 100) / 100;
  }, [principal, loanTerm, interestRate]);

  React.useEffect(() => {
    setValue('monthly_payment', calculatedPayment);
  }, [calculatedPayment, setValue]);

  const format = (num) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

  const totalPayable = calculatedPayment * loanTerm;
  const interestTotal = principal > 0 ? totalPayable - principal : 0;

  return (
    <div className="col-span-full mt-4 bg-background/50 rounded-2xl p-6 border border-dashed border-border overflow-hidden">
      <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row justify-between items-stretch gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-[rgb(var(--color-primary))]">
            <TrendingUp size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Pricing Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))]/50">
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase font-bold mb-1 opacity-60">
                Total Vehicle Price
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-text))]">
                {format(vehicleTotal)}
              </p>
            </div>
            <div className="p-3 bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))]/50">
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase font-bold mb-1 opacity-60">
                Net Financed
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-text))]">
                {format(principal > 0 ? principal : 0)}
              </p>
            </div>
            <div className="p-3 bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))]/50">
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase font-bold mb-1 opacity-60">
                Total Interest
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-success))]">
                {format(interestTotal > 0 ? interestTotal : 0)}
              </p>
            </div>
            <div className="p-3 bg-[rgb(var(--color-primary))]/5 rounded-xl border border-[rgb(var(--color-primary))]/20">
              <p className="text-[10px] text-[rgb(var(--color-primary))] uppercase font-bold mb-1 opacity-80">
                Est. Total Cost
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-primary))]">
                {format(totalDeductions + totalPayable)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[rgb(var(--color-primary))] text-white p-6 rounded-2xl shadow-xl shadow-[rgb(var(--color-primary))]/20 w-full xl:w-auto text-center xl:text-left flex-shrink-0 flex flex-col justify-center min-w-[240px]">
          <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest mb-1">
            Final Monthly Payment
          </p>
          <h2 className="text-3xl font-black">{format(calculatedPayment)}</h2>
          <p className="text-[10px] opacity-60 mt-2">*{loanTerm} Monthly Installments</p>
        </div>
      </div>
    </div>
  );
};

const YearPickerAdapter = ({ value, onChange, error }) => {
  return (
    <CustomDateTimePicker
      label="Year"
      views={['year']}
      format="YYYY"
      value={value ? String(value) : null}
      onChange={(isoString) => {
        if (!isoString) onChange('');
        else onChange(new Date(isoString).getFullYear());
      }}
      error={error}
      placeholder="Select Year"
    />
  );
};

import { useCreateQuote } from '@/hooks/useQuotes';

export default function CreateQuote() {
  const router = useRouter();
  const { mutateAsync: createQuote } = useCreateQuote();
  const { user } = useAuth();

  const [fetchingDealer, setFetchingDealer] = React.useState(false);
  const [loadingConfig, setLoadingConfig] = React.useState(true);
  const [defaults, setDefaults] = React.useState({});
  const [dealershipOptions, setDealershipOptions] = React.useState([]);
  const [defaultDealershipId, setDefaultDealershipId] = React.useState('');

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isDealer = user?.role === 'dealer' || user?.role === 'dealer_manager';

  React.useEffect(() => {
    const fetchConfigs = async () => {
      try {
        if (isSuperAdmin) {
          const options = await dealershipService.getDealershipOptions();
          setDealershipOptions(options);

          if (user?.dealership_id) {
            setDefaultDealershipId(user.dealership_id);
          }
        } else if (isAdmin) {
          // Fetch ALL assigned dealerships for this admin
          try {
            // Check if user object already has dealerships (from AuthContext)
            const assignedDealers = user?.dealerships || user?.assigned_dealerships || [];

            if (assignedDealers.length > 0) {
              const opts = assignedDealers.map((d) => ({ label: d.name, value: d.id }));
              setDealershipOptions(opts);
              if (!defaultDealershipId) setDefaultDealershipId(assignedDealers[0].id);
            } else {
              // Fallback: Fetch all and filter by primary_admin_id or other criteria if needed
              const response = await dealershipService.getAllDealerships();
              const allDealers = Array.isArray(response)
                ? response
                : response?.dealerships || response?.data?.dealerships || response?.data || [];

              // If Admin, the API might already be scoping this to their accessible dealerships.
              // But we'll still attempt to filter for safety if it seems too broad.
              const myDealers = allDealers.filter(
                (d) =>
                  d.primary_admin_id === user?.id ||
                  d.dealer_owner === user?.id || // Include Created dealerships
                  d.dealer_owner_name === user?.id ||
                  (Array.isArray(d.admins) && d.admins.includes(user?.id))
              );

              // If filtered list is empty, fall back to all (or keep empty if strict)
              // User request implies strict filtering, but if backend sends 'all' and user has none, it should show none.
              // The previous logic fell back to 'allDealers'. I will change this to only use 'myDealers' if strict.
              // However, let's keep the fallback logic only if 'myDealers' is empty but be careful.
              // Actually, if I have created/assigned ones, show them. If not, showing ALL is wrong.
              // I will use myDealers if length > 0, otherwise show nothing (or empty options).

              const finalDealers = myDealers; // Strict filtering

              if (finalDealers.length > 0) {
                const opts = finalDealers.map((d) => ({ label: d.name, value: d.id }));
                setDealershipOptions(opts);
                if (!defaultDealershipId) setDefaultDealershipId(finalDealers[0].id);
              } else {
                setDealershipOptions([]); // No relevant dealerships found
              }
            }
          } catch (err) {
            console.error('Failed to fetch admin dealerships', err);
          }
        }

        const configs = (await quoteService.getPricingConfigs)
          ? quoteService.getPricingConfigs()
          : (await import('@/services/cmsService')).default.getPricingConfigs();

        const rawItems = Array.isArray(configs) ? configs : configs?.data || [];

        const newDefaults = {};

        const findValue = (key) => {
          const item = rawItems.find(
            (c) =>
              (c.parameterKey || c.parameter_key)?.toLowerCase() === key.toLowerCase() ||
              (c.parameterName || c.parameter_name)?.toLowerCase() === key.toLowerCase()
          );
          return item ? (item.parameterValue ?? item.parameter_value) : null;
        };

        const defaultRate = findValue('default_interest_rate') || findValue('interest_rate');
        const defaultTerm = findValue('default_loan_term') || findValue('loan_term');
        const minDown = findValue('min_down_payment');

        if (defaultRate) newDefaults.interest_rate = Number(defaultRate);
        if (defaultTerm) newDefaults.loan_term = Number(defaultTerm);
        if (minDown) newDefaults.min_down_payment = Number(minDown);

        setDefaults(newDefaults);
      } catch (error) {
        console.error('Failed to load pricing configs', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfigs();
  }, [isSuperAdmin, isAdmin, user, defaultDealershipId]);

  const validationSchema = React.useMemo(
    () =>
      yup.object({
        customer_name: yup
          .string()
          .required('Customer Name is required')
          .min(2, 'Name must be at least 2 characters')
          .max(100, 'Name must not exceed 100 characters')
          .matches(
            /^[A-Za-z\s'-]+$/,
            'Name can only contain letters, spaces, hyphens, and apostrophes'
          )
          .test('no-multiple-spaces', 'Name cannot have multiple consecutive spaces', (value) => {
            return !value || !/\s{2,}/.test(value);
          }),
        customer_email: yup
          .string()
          .required('Email is required')
          .email('Invalid email format')
          .max(255, 'Email must not exceed 255 characters')
          .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email address'
          ),
        customer_phone: yup
          .string()
          .required('Phone is required')
          .matches(/^[0-9]{10,15}$/, 'Phone must be 10-15 digits')
          .test('valid-phone', 'Phone number must be valid', (value) => {
            if (!value) return false;
            return /^[0-9]{10,15}$/.test(value);
          }),
        vehicle_info: yup.object({
          year: yup
            .number()
            .transform((v, o) => (o === '' ? undefined : v))
            .typeError('Year must be a number')
            .required('Year is required')
            .min(1900, 'Year must be 1900 or later')
            .max(
              new Date().getFullYear() + 2,
              `Year cannot be more than ${new Date().getFullYear() + 2}`
            )
            .integer('Year must be a whole number'),
          make: yup
            .string()
            .required('Make is required')
            .min(2, 'Make must be at least 2 characters')
            .max(50, 'Make must not exceed 50 characters')
            .matches(
              /^[A-Za-z\s'-]+$/,
              'Make can only contain letters, spaces, hyphens, and apostrophes'
            ),
          model: yup
            .string()
            .required('Model is required')
            .min(1, 'Model must be at least 1 character')
            .max(50, 'Model must not exceed 50 characters')
            .matches(
              /^[A-Za-z0-9\s'-]+$/,
              'Model can only contain letters, numbers, spaces, hyphens, and apostrophes'
            ),
          trim: yup
            .string()
            .nullable()
            .max(50, 'Trim must not exceed 50 characters')
            .matches(
              /^[A-Za-z0-9\s'-]*$/,
              'Trim can only contain letters, numbers, spaces, hyphens, and apostrophes'
            ),
          vin: yup
            .string()
            .transform((v) => (v === '' ? undefined : v?.toUpperCase()))
            .nullable()
            .required('VIN is required')
            .test('len', 'VIN must be exactly 17 characters', (val) => !val || val.length === 17)
            .test('alphanumeric', 'VIN must be alphanumeric (no I, O, or Q)', (val) => {
              if (!val) return true;
              return /^[A-HJ-NPR-Z0-9]{17}$/.test(val);
            }),
          color: yup
            .string()
            .nullable()
            .max(30, 'Color must not exceed 30 characters')
            .required('Color is required')
            .matches(
              /^[A-Za-z\s'-]*$/,
              'Color can only contain letters, spaces, hyphens, and apostrophes'
            ),
          mileage: yup
            .number()
            .transform((v, o) => (o === '' ? undefined : v))
            .typeError('Mileage must be a number')
            .min(0, 'Mileage cannot be negative')
            .max(999999, 'Mileage seems unrealistic')
            .integer('Mileage must be a whole number')
            .required('Mileage is required')
            .nullable(),
          condition: yup
            .string()
            .nullable()
            .oneOf(['excellent', 'good', 'fair', 'new', null], 'Invalid condition selected'),
        }),
        amount: yup
          .number()
          .transform((v, o) => (o === '' ? undefined : v))
          .typeError('Quote amount must be a number')
          .required('Quote amount is required')
          .min(1, 'Quote amount must be at least $1')
          .max(10000000, 'Quote amount seems unrealistic')
          .test('decimal-places', 'Amount can have at most 2 decimal places', (value) => {
            if (!value) return true;
            return /^\d+(\.\d{1,2})?$/.test(value.toString());
          }),
        currency: yup
          .string()
          .required('Currency is required')
          .oneOf(['USD', 'EUR', 'GBP'], 'Invalid currency selected'),
        validity_days: yup
          .number()
          .transform((v, o) => (o === '' ? undefined : v))
          .typeError('Validity must be a number')
          .required('Validity days is required')
          .min(1, 'Validity must be at least 1 day')
          .max(365, 'Validity cannot exceed 365 days')
          .integer('Validity must be a whole number'),
        down_payment: yup
          .number()
          .transform((v, o) => (o === '' ? undefined : v))
          .typeError('Down payment must be a number')
          .min(0, 'Down payment cannot be negative')
          .max(yup.ref('amount'), 'Down payment cannot exceed quote amount')
          .test('decimal-places', 'Down payment can have at most 2 decimal places', (value) => {
            if (!value) return true;
            return /^\d+(\.\d{1,2})?$/.test(value.toString());
          })
          .nullable(),
        loan_term: yup
          .number()
          .transform((v, o) => (o === '' ? undefined : v))
          .typeError('Loan term must be a number')
          .min(1, 'Loan term must be at least 1 month')
          .max(360, 'Loan term cannot exceed 360 months (30 years)')
          .integer('Loan term must be a whole number')
          .nullable(),
        interest_rate: yup
          .number()
          .transform((v, o) => (o === '' ? undefined : v))
          .typeError('Interest rate must be a number')
          .min(0, 'Interest rate cannot be negative')
          .max(50, 'Interest rate seems unrealistic')
          .test('decimal-places', 'Interest rate can have at most 2 decimal places', (value) => {
            if (!value) return true;
            return /^\d+(\.\d{1,2})?$/.test(value.toString());
          })
          .nullable(),
        trade_in_value: yup
          .number()
          .transform((v, o) => (o === '' ? undefined : v))
          .typeError('Trade-in value must be a number')
          .min(0, 'Trade-in value cannot be negative')
          .max(1000000, 'Trade-in value seems unrealistic')
          .required('Trade-in value is required')
          .test('decimal-places', 'Trade-in value can have at most 2 decimal places', (value) => {
            if (!value) return true;
            return /^\d+(\.\d{1,2})?$/.test(value.toString());
          })
          .nullable(),
        monthly_payment: yup
          .number()
          .transform((v, o) => (o === '' ? undefined : v))
          .typeError('Monthly payment must be a number')
          .min(0, 'Monthly payment cannot be negative')
          .required('Monthly payment is required')
          .nullable(),
        additional_fees: yup.object({
          documentation_fee: yup
            .number()
            .transform((v, o) => (o === '' ? undefined : v))
            .typeError('Documentation fee must be a number')
            .min(0, 'Fee cannot be negative')
            .max(10000, 'Fee seems unrealistic')
            .nullable(),
          registration_fee: yup
            .number()
            .transform((v, o) => (o === '' ? undefined : v))
            .typeError('Registration fee must be a number')
            .min(0, 'Fee cannot be negative')
            .max(10000, 'Fee seems unrealistic')
            .nullable(),
          dealer_fee: yup
            .number()
            .transform((v, o) => (o === '' ? undefined : v))
            .typeError('Dealer fee must be a number')
            .min(0, 'Fee cannot be negative')
            .max(10000, 'Fee seems unrealistic')
            .nullable(),
        }),
        notes: yup.string().nullable().max(1000, 'Notes must not exceed 1000 characters'),
      }),
    []
  );

  const activeValidationSchema = React.useMemo(() => {
    if (isSuperAdmin) {
      return validationSchema.shape({
        dealership_id: yup.string().required('Dealership is required'),
      });
    }
    return validationSchema;
  }, [validationSchema, isSuperAdmin]);

  const fields = React.useMemo(
    () => [
      {
        type: 'column',
        fields: [
          ...(isSuperAdmin || isAdmin
            ? [
                {
                  type: 'section',
                  title: 'Dealership Selection',
                  icon: Building2,
                  fields: [
                    {
                      name: 'dealership_id',
                      label: 'Dealership',
                      type: 'select',
                      options: dealershipOptions,
                      placeholder: 'Select a dealership...',
                      disabled: false, // Allowed for Admin (restricted list) and Super Admin (all)
                    },
                  ],
                },
              ]
            : []),
          {
            type: 'section',
            title: 'Customer Information',
            icon: User,
            contentClassName: 'grid grid-cols-1 md:grid-cols-2 gap-4',
            fields: [
              {
                name: 'customer_name',
                label: 'Full Name',
                placeholder: 'e.g. John Doe',
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('customer_name', clean);
                },
              },
              { name: 'customer_email', label: 'Email Address', placeholder: 'john@example.com' },
              {
                name: 'customer_phone',
                label: 'Phone Number',
                placeholder: '1234567890',
                className: 'md:col-span-2',
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^0-9]/g, '');
                  if (clean !== value) setValue('customer_phone', clean);
                },
              },
            ],
          },
          {
            type: 'section',
            title: 'Vehicle Information',
            icon: Car,
            contentClassName: 'grid grid-cols-1 md:grid-cols-2 gap-4',
            fields: [
              {
                name: 'vehicle_info.year',
                label: 'Year',
                type: 'custom',
                component: YearPickerAdapter,
                className: 'w-full',
              },
              {
                name: 'vehicle_info.make',
                label: 'Make',
                placeholder: 'Toyota',
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('vehicle_info.make', clean);
                },
              },
              {
                name: 'vehicle_info.model',
                label: 'Model',
                placeholder: 'Camry',
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('vehicle_info.model', clean);
                },
              },
              {
                name: 'vehicle_info.trim',
                label: 'Trim / Edition',
                placeholder: 'LE',
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('vehicle_info.trim', clean);
                },
              },
              {
                name: 'vehicle_info.vin',
                label: 'VIN',
                placeholder: '17 Characters',
                className: 'md:col-span-2',
                props: { forceAlphanumeric: true, maxLength: 17 },
              },
              {
                name: 'vehicle_info.color',
                label: 'Color',
                placeholder: 'e.g. Silver',
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('vehicle_info.color', clean);
                },
              },
              { name: 'vehicle_info.mileage', label: 'Mileage', type: 'number', placeholder: '0' },
              {
                name: 'vehicle_info.condition',
                label: 'Condition',
                type: 'select',
                placeholder: 'Select Condition',
                options: [
                  { label: 'Excellent', value: 'excellent' },
                  { label: 'Good', value: 'good' },
                  { label: 'Fair', value: 'fair' },
                  { label: 'New', value: 'new' },
                ],
                className: 'md:col-span-2',
              },
            ],
          },
          {
            type: 'section',
            title: 'Additional Notes',
            icon: FileText,
            fields: [
              {
                name: 'notes',
                label: 'Notes',
                type: 'textarea',
                placeholder: 'Customer interested in...',
                className: 'w-full',
              },
              {
                name: 'tags',
                label: 'Tags',
                type: 'custom',
                component: TagInput,
                props: { type: 'quote', placeholder: 'Add tags...' },
                className: 'w-full mt-4',
              },
            ],
          },
        ],
      },
      {
        type: 'column',
        fields: [
          {
            type: 'section',
            title: 'Financial Breakdown',
            icon: DollarSign,
            contentClassName: 'grid grid-cols-1 md:grid-cols-2 gap-4',
            fields: [
              {
                name: 'amount',
                label: 'Quote Amount ($)',
                type: 'number',
                placeholder: '35000',
                className: 'md:col-span-2',
              },
              {
                name: 'currency',
                label: 'Currency',
                type: 'select',
                placeholder: 'Select Currency',
                options: [
                  { label: 'USD', value: 'USD' },
                  { label: 'EUR', value: 'EUR' },
                  { label: 'GBP', value: 'GBP' },
                ],
              },
              {
                name: 'validity_days',
                label: 'Validity (Days)',
                type: 'number',
                placeholder: '30',
                defaultValue: 30,
              },
              {
                name: 'trade_in_value',
                label: 'Trade-In Value ($)',
                type: 'number',
                placeholder: '0',
              },
              {
                name: 'down_payment',
                label: 'Down Payment ($)',
                type: 'number',
                placeholder: '5000',
              },
              {
                name: 'interest_rate',
                label: 'Interest Rate (%)',
                type: 'number',
                placeholder: '4.5',
              },
              { name: 'loan_term', label: 'Loan Term (Months)', type: 'number', placeholder: '60' },
              {
                name: 'monthly_payment',
                label: 'Est. Monthly Payment ($)',
                type: 'number',
                placeholder: '0',
                disabled: true,
                className: 'hidden',
              },
            ],
          },
          {
            type: 'section',
            title: 'Additional Fees',
            icon: Info,
            contentClassName: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4',
            fields: [
              {
                name: 'additional_fees.documentation_fee',
                label: 'Documentation Fee ($)',
                type: 'number',
                placeholder: '0',
              },
              {
                name: 'additional_fees.registration_fee',
                label: 'Registration Fee ($)',
                type: 'number',
                placeholder: '0',
              },
              {
                name: 'additional_fees.dealer_fee',
                label: 'Dealer Fee ($)',
                type: 'number',
                placeholder: '0',
              },
            ],
          },
          {
            type: 'section',
            title: 'Additional Services',
            icon: Plus,
            fields: [
              {
                name: 'additional_services',
                type: 'custom',
                label: 'Services & Upgrades',
                component: ({ value = [], onChange }) => (
                  <div className="space-y-3">
                    {(value || []).map((service, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row gap-2 p-3 bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] sm:border-none sm:p-0 sm:bg-transparent"
                      >
                        <input
                          className="w-full sm:flex-1 px-4 py-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-sm"
                          placeholder="Service Name (e.g. Extended Warranty)"
                          value={service.name}
                          onChange={(e) => {
                            const newVal = [...value];
                            newVal[idx].name = e.target.value;
                            onChange(newVal);
                          }}
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            className="flex-1 sm:w-32 px-4 py-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-sm"
                            type="number"
                            placeholder="Price"
                            value={service.price}
                            onChange={(e) => {
                              const newVal = [...value];
                              newVal[idx].price = Number(e.target.value);
                              onChange(newVal);
                            }}
                          />
                          <button
                            onClick={() => onChange(value.filter((_, i) => i !== idx))}
                            className="p-2 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/5 rounded-lg transition-colors flex-shrink-0"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => onChange([...value, { name: '', price: 0 }])}
                      className="w-full py-2 border-2 border-dashed border-[rgb(var(--color-border))] rounded-xl text-xs font-bold text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Add Service
                    </button>
                  </div>
                ),
              },
            ],
          },
        ],
      },
      {
        name: 'summary',
        type: 'custom',
        component: LiveFinanceSummary,
        className: 'col-span-full',
      },
    ],
    [dealershipOptions, isSuperAdmin, isAdmin]
  );

  const handleSave = async (data) => {
    try {
      let dealerId = data.dealership_id || user?.dealership_id || user?.dealership?.id;

      if (!dealerId) {
        setFetchingDealer(true);
        try {
          const profile = await userService.getMyProfile();
          dealerId = profile.dealership_id;
        } catch (err) {
          console.error('Could not fetch dealer ID', err);
        }
        setFetchingDealer(false);
      }

      if (!dealerId) {
        Swal.fire('Error', 'Could not identify dealership. Please select one.', 'error');
        return;
      }

      const payload = {
        _useDealerEndpoint: false, // Force global endpoint for Admin and SuperAdmin
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        vehicle_details: {
          ...data.vehicle_info,
          year: Number(data.vehicle_info.year),
          mileage: Number(data.vehicle_info.mileage || 0),
        },
        dealership_id: dealerId,
        quote_amount: Number(data.amount),
        currency: data.currency || 'USD',
        validity_days: Number(data.validity_days || 30),
        notes: data.notes,
        additional_services: data.additional_services || [],
        down_payment: Number(data.down_payment || 0),
        loan_term: Number(data.loan_term || 0),
        interest_rate: Number(data.interest_rate || 0),
        trade_in_value: Number(data.trade_in_value || 0),
        additional_fees: {
          documentation_fee: Number(data.additional_fees?.documentation_fee || 0),
          registration_fee: Number(data.additional_fees?.registration_fee || 0),
          dealer_fee: Number(data.additional_fees?.dealer_fee || 0),
        },
      };

      const newQuote = await createQuote(payload);

      // Sync Tags
      const newQuoteId = newQuote?.id || newQuote?.data?.id;
      if (newQuoteId && data.tags) {
        const tagIds = data.tags.map((t) => t.id);
        try {
          await tagService.syncTags('quote', newQuoteId, tagIds);
        } catch (err) {
          console.error('Failed to sync tags', err);
        }
      }

      Swal.fire({
        title: 'Success',
        text: 'Quote created successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

      router.push('/quotes');
    } catch (error) {
      console.error('=== QUOTE CREATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      Swal.fire(
        'Error',
        error.response?.data?.message || 'Failed to create quote. Please try again.',
        'error'
      );
    }
  };

  if (fetchingDealer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(var(--color-primary))]"></div>
      </div>
    );
  }

  return (
    <GenericFormPage
      title="Generate New Quote"
      subtitle="Fill in the customer and vehicle details to create a formal quote."
      initialData={{
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        dealership_id: defaultDealershipId,
        vehicle_info: {
          year: new Date().getFullYear(),
          make: '',
          model: '',
          trim: '',
          vin: '',
          color: '',
          mileage: 0,
          condition: '',
        },
        amount: '',
        currency: '',
        validity_days: 30,
        additional_services: [],
        trade_in_value: 0,
        down_payment: '',
        loan_term: defaults.loan_term || 60,
        interest_rate: defaults.interest_rate || 4.5,
        additional_fees: {
          documentation_fee: 0,
          registration_fee: 0,
          dealer_fee: 0,
        },
        notes: '',
        tags: [],
      }}
      validationSchema={activeValidationSchema}
      fields={fields}
      onSave={handleSave}
      onCancel={() => router.push('/quotes')}
      saveLabel="Create Quote"
    />
  );
}
