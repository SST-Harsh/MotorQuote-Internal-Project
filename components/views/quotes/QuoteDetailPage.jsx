'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import * as yup from 'yup';
import GenericFormPage from '@/components/common/GenericFormPage';
import { useFormContext, useWatch } from 'react-hook-form';
import quoteService from '@/services/quoteService';
import {
  User,
  Car,
  DollarSign,
  FileText,
  ChevronLeft,
  Edit2,
  Clock,
  Mail,
  MessageCircle,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Info,
  X,
  TrendingUp,
  Wallet,
  CreditCard,
  Plus,
  Building2,
  Image as ImageIcon,
} from 'lucide-react';
import Swal from 'sweetalert2';
import dealershipService from '@/services/dealershipService';
import TagInput from '@/components/common/tags/TagInput';
import TagBadge from '@/components/common/tags/TagBadge';
import tagService from '@/services/tagService';
import TagList from '@/components/common/tags/TagList';
import FileManager from '@/components/common/FileManager/FileManager';
import { formatDate } from '@/utils/i18n';

function LogCommunicationModal({ isOpen, onClose, quoteId, customerEmail, onLogAdded, isDealer }) {
  const [type, setType] = useState('email');
  const [direction, setDirection] = useState('outbound');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!content.trim()) newErrors.content = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await quoteService.addCommunicationLog(quoteId, {
        communication_type: type,
        direction,
        subject,
        message: content,
        sent_to: customerEmail,
        _useDealerEndpoint: isDealer,
      });
      Swal.fire({
        title: 'Success',
        text: 'Communication logged',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      onLogAdded();
      onClose();
      setSubject('');
      setContent('');
    } catch (error) {
      Swal.fire('Error', 'Failed to log communication', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgb(var(--color-text))]/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-[rgb(var(--color-surface))] w-full max-w-md rounded-2xl border border-[rgb(var(--color-border))] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.1] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Log Communication</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[rgb(var(--color-background))] rounded-full transition-colors"
          >
            <X size={20} className="text-[rgb(var(--color-text-muted))]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary))/0.1] focus:border-[rgb(var(--color-primary))] transition-all cursor-pointer"
              >
                <option value="email">Email</option>
                <option value="phone">Phone Call</option>
                <option value="sms">SMS</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary))/0.1] focus:border-[rgb(var(--color-primary))] transition-all cursor-pointer"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
              }}
              placeholder="e.g. Follow-up regarding quote"
              className={`w-full bg-[rgb(var(--color-background))] border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary))]/10 focus:border-[rgb(var(--color-primary))] transition-all ${errors.subject ? 'border-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))]'}`}
            />
            {errors.subject && (
              <p className="text-[10px] text-[rgb(var(--color-error))] font-bold uppercase mt-1">
                {errors.subject}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
              Content / Notes
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: null }));
              }}
              rows={4}
              placeholder="What was discussed?"
              className={`w-full bg-[rgb(var(--color-background))] border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-[rgb(var(--color-primary))]/10 focus:border-[rgb(var(--color-primary))] transition-all resize-none ${errors.content ? 'border-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))]'}`}
            />
            {errors.content && (
              <p className="text-[10px] text-[rgb(var(--color-error))] font-bold uppercase mt-1">
                {errors.content}
              </p>
            )}
          </div>
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[rgb(var(--color-border))] rounded-xl text-sm font-bold text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[rgb(var(--color-primary))]/20 disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

const SummaryCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] p-5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center gap-4">
      <div
        className={`p-3 rounded-xl text-white ${color} shadow-lg shadow-[rgb(var(--color-foreground))]/10`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider mb-0.5">
          {title}
        </p>
        <h3 className="text-xl font-bold text-[rgb(var(--color-text))]">{value}</h3>
      </div>
    </div>
  </div>
);

const LiveFinanceSummary = () => {
  const { setValue, control } = useFormContext();

  // Use useWatch for high-performance reactive updates
  const amount = Number(useWatch({ control, name: 'amount' }) || 0);
  const downPayment = Number(useWatch({ control, name: 'down_payment' }) || 0);
  const tradeIn = Number(useWatch({ control, name: 'trade_in_value' }) || 0);
  const docFee = Number(useWatch({ control, name: 'additional_fees.documentation_fee' }) || 0);
  const regFee = Number(useWatch({ control, name: 'additional_fees.registration_fee' }) || 0);
  const dealerFee = Number(useWatch({ control, name: 'additional_fees.dealer_fee' }) || 0);
  const interestRate = Number(useWatch({ control, name: 'interest_rate' }) || 0);
  const loanTerm = Number(useWatch({ control, name: 'loan_term' }) || 60);

  const additionalServices = useWatch({ control, name: 'additional_services' }) || [];
  const servicesTotal = additionalServices.reduce((acc, s) => acc + Number(s.price || 0), 0);

  const vehicleTotal = amount + docFee + regFee + dealerFee + servicesTotal;
  const totalDeductions = downPayment + tradeIn;
  const principal = vehicleTotal - totalDeductions;

  // Calculate monthly payment reactively
  const calculatedPayment = React.useMemo(() => {
    if (principal <= 0 || loanTerm <= 0) return 0;
    if (interestRate === 0) return Math.round((principal / loanTerm) * 100) / 100;

    const monthlyRate = interestRate / 100 / 12;
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
      (Math.pow(1 + monthlyRate, loanTerm) - 1);
    return Math.round(payment * 100) / 100;
  }, [principal, loanTerm, interestRate]);

  // Sync with form state so it gets saved
  React.useEffect(() => {
    setValue('monthly_payment', calculatedPayment);
  }, [calculatedPayment, setValue]);

  const format = (num) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

  const totalPayable = calculatedPayment * loanTerm;
  const interestTotal = principal > 0 ? totalPayable - principal : 0;

  return (
    <div className="col-span-full mt-4 bg-[rgb(var(--color-background))]/50 rounded-2xl p-6 border border-dashed border-[rgb(var(--color-border))] overflow-hidden">
      <div className="flex flex-col xl:flex-row justify-between items-stretch gap-6">
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

import { useAuth } from '@/context/AuthContext';

export default function QuoteDetailPage({ quoteId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isDealer = user?.role === 'dealer' || user?.role === 'dealer_manager';
  const endpointParams = React.useMemo(
    () => (isDealer ? { _useDealerEndpoint: true } : {}),
    [isDealer]
  );

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);
  const [rawQuote, setRawQuote] = useState(null);
  const [dealershipOptions, setDealershipOptions] = useState([]);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [communicationLogs, setCommunicationLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const normalizeQuoteData = React.useCallback((quote, tags = []) => {
    let fees = quote.additional_fees || {};
    if (typeof fees === 'string') {
      try {
        fees = JSON.parse(fees);
      } catch (e) {
        fees = {};
      }
    }

    const normalizedFees = {
      documentation_fee: Number(fees.documentation_fee || fees.documentationFee || 0),
      registration_fee: Number(fees.registration_fee || fees.registrationFee || 0),
      dealer_fee: Number(fees.dealer_fee || fees.dealerFee || 0),
    };

    const vehicleData = quote.vehicle_info || quote.vehicle_details || {};
    const dealershipId = quote.dealership_id || quote.dealership?.id || '';

    return {
      ...quote,
      tags: tags || quote.tags || [],
      vehicle_info: {
        year: vehicleData.year || '',
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        trim: vehicleData.trim || '',
        vin: vehicleData.vin || '',
        color: vehicleData.color || '',
        mileage: vehicleData.mileage || 0,
        condition: vehicleData.condition || 'new',
      },
      amount: quote.amount || quote.quote_amount || 0,
      monthly_payment: quote.monthly_payment || 0,
      additional_fees: normalizedFees,
      additional_services: quote.additional_services || [],
      down_payment: quote.down_payment || 0,
      loan_term: quote.loan_term || 0,
      interest_rate: quote.interest_rate || 0,
      trade_in_value: quote.trade_in_value || 0,
      currency: quote.currency || 'USD',
      validity_days: quote.validity_days || 30,
      notes: quote.notes || '',
      dealership_id: dealershipId ? String(dealershipId) : '',
    };
  }, []);

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';

  // Fetch dealership options for Admin/SuperAdmin
  useEffect(() => {
    const fetchDealers = async () => {
      if (!user) return;

      if (isSuperAdmin) {
        try {
          const options = await dealershipService.getDealershipOptions();
          setDealershipOptions(options);
        } catch (e) {
          console.error('Failed to fetch dealerships', e);
        }
      } else if (isAdmin) {
        try {
          // Admins need to see the dealerships they manage OR are assigned to
          const response = await dealershipService.getAllDealerships();
          const allDealers = Array.isArray(response) ? response : response?.dealerships || [];

          const myDealers = allDealers.filter((d) => {
            const isPrimaryAdmin = String(d.primary_admin_id) === String(user.id);
            const isAssignedDealership = String(d.id) === String(user.dealership_id);
            return isPrimaryAdmin || isAssignedDealership;
          });

          if (myDealers.length > 0) {
            setDealershipOptions(myDealers.map((d) => ({ label: d.name, value: String(d.id) })));
          } else if (user.dealership_id) {
            // Fallback: If getAllDealerships didn't return (permission issue?) or filtering failed,
            // try fetching the assigned dealership directly if we have an ID.
            try {
              const specificDealership = await dealershipService.getById(user.dealership_id);
              if (specificDealership) {
                const d = specificDealership.dealership || specificDealership;
                setDealershipOptions([{ label: d.name, value: String(d.id) }]);
              }
            } catch (err) {
              console.error('Failed to fetch assigned dealership fallback', err);
            }
          }
        } catch (e) {
          console.error('Failed to fetch admin dealerships', e);
        }
      }
    };
    fetchDealers();
  }, [isSuperAdmin, isAdmin, user]);

  // Helper to calculate monthly payment dynamically if missing from API
  const calculatePayment = (data) => {
    if (data.monthly_payment && data.monthly_payment > 0) return data.monthly_payment;

    const amount = Number(data.amount || 0);
    const down = Number(data.down_payment || 0);
    const trade = Number(data.trade_in_value || 0);
    const doc = Number(data.additional_fees?.documentation_fee || 0);
    const reg = Number(data.additional_fees?.registration_fee || 0);
    const dealer = Number(data.additional_fees?.dealer_fee || 0);
    const services = (data.additional_services || []).reduce(
      (acc, s) => acc + Number(s.price || 0),
      0
    );

    const principal = amount + doc + reg + dealer + services - (down + trade);
    const rate = Number(data.interest_rate || 0);
    const term = Number(data.loan_term || 0);

    if (principal <= 0 || term <= 0) return 0;
    if (rate === 0) return principal / term;

    const monthlyRate = rate / 100 / 12;
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
      (Math.pow(1 + monthlyRate, term) - 1)
    );
  };

  const fetchLogs = React.useCallback(async () => {
    setLoadingLogs(true);
    try {
      const logs = await quoteService.getCommunicationLogs(quoteId, endpointParams);
      setCommunicationLogs(logs.data || logs.logs || logs || []);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLoadingLogs(false);
    }
  }, [quoteId, endpointParams]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (quoteId) {
          const data = await quoteService.getQuoteById(quoteId, endpointParams);
          const quote = data.quote || data;

          // Fetch tags BEFORE using them in state updates
          let tags = [];
          try {
            tags = await tagService.getEntityTags('quote', quoteId);
          } catch (err) {
            console.error('Failed to fetch tags', err);
          }

          const normalized = normalizeQuoteData(quote, tags);
          setRawQuote(normalized);
          setInitialData(normalized);

          // 3. Fetch Logs
          fetchLogs();
        }
      } catch (error) {
        console.error('Failed to load data', error);
        Swal.fire('Error', 'Failed to load quote details.', 'error');
        router.push('/quotes');
      } finally {
        setLoading(false);
      }
    };

    if (quoteId) {
      loadData();
    }
  }, [quoteId, router, fetchLogs, normalizeQuoteData, endpointParams]);

  useEffect(() => {
    if (rawQuote && rawQuote.dealership_id && dealershipOptions.length > 0) {
      const idStr = String(rawQuote.dealership_id);
      const exists = dealershipOptions.some((opt) => opt.value === idStr);

      if (!exists && rawQuote.dealership) {
        setDealershipOptions((prev) => {
          if (prev.some((opt) => opt.value === idStr)) return prev;
          return [
            ...prev,
            {
              label: rawQuote.dealership.name || 'Current Dealership',
              value: idStr,
            },
          ];
        });
      }
    }
  }, [rawQuote, dealershipOptions, setDealershipOptions]);

  const validationSchema = useMemo(
    () =>
      yup.object().shape({
        customer_name: yup.string().required('Customer Name is required'),
        customer_email: yup.string().email('Invalid email').required('Email is required'),
        customer_phone: yup.string().required('Phone is required'),
        dealership_id:
          isAdmin || isSuperAdmin
            ? yup.string().required('Dealership is required')
            : yup.string().nullable(),

        vehicle_info: yup.object().shape({
          year: yup.number().typeError('Year must be a number').required('Year is required'),
          make: yup.string().required('Make is required'),
          model: yup.string().required('Model is required'),
          trim: yup.string(),
          vin: yup.string().length(17, 'VIN must be 17 characters'),
          color: yup.string(),
          mileage: yup
            .number()
            .transform((v, o) => (o === '' ? 0 : v))
            .typeError('Mileage must be a number')
            .min(0),
          condition: yup.string().default('New'),
        }),

        amount: yup
          .number()
          .typeError('Quote amount must be a number')
          .min(0)
          .required('Quote amount is required'),
        currency: yup.string().default('USD'),
        validity_days: yup.number().typeError('Validity must be a number').min(1).default(30),
        down_payment: yup
          .number()
          .transform((v, o) => (o === '' ? 0 : v))
          .typeError('Must be a number')
          .min(0),
        loan_term: yup
          .number()
          .transform((v, o) => (o === '' ? 0 : v))
          .typeError('Must be a number')
          .min(0),
        interest_rate: yup
          .number()
          .transform((v, o) => (o === '' ? 0 : v))
          .typeError('Must be a number')
          .min(0),
        trade_in_value: yup
          .number()
          .transform((v, o) => (o === '' ? 0 : v))
          .typeError('Must be a number')
          .min(0),
        monthly_payment: yup
          .number()
          .transform((v, o) => (o === '' ? 0 : v))
          .typeError('Must be a number')
          .min(0),
        additional_fees: yup.object().shape({
          documentation_fee: yup
            .number()
            .transform((v, o) => (o === '' ? 0 : v))
            .typeError('Must be a number'),
          registration_fee: yup
            .number()
            .transform((v, o) => (o === '' ? 0 : v))
            .typeError('Must be a number'),
          dealer_fee: yup
            .number()
            .transform((v, o) => (o === '' ? 0 : v))
            .typeError('Must be a number'),
        }),
        additional_services: yup.array().of(
          yup.object().shape({
            name: yup.string(),
            price: yup.number().transform((v, o) => (o === '' ? 0 : v)),
          })
        ),
        notes: yup.string(),
      }),
    [isAdmin, isSuperAdmin]
  );

  const fields = useMemo(
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
                      icon: Building2,
                      options: dealershipOptions,
                      placeholder: 'Select a dealership...',
                      disabled: false,
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
              { name: 'customer_name', label: 'Full Name', placeholder: 'e.g. John Doe' },
              { name: 'customer_email', label: 'Email Address', placeholder: 'john@example.com' },
              {
                name: 'customer_phone',
                label: 'Phone Number',
                placeholder: '1234567890',
                className: 'md:col-span-2',
              },
            ],
          },
          {
            type: 'section',
            title: 'Communication',
            icon: MessageCircle,
            fields: [
              {
                type: 'custom',
                name: 'log_communication_trigger',
                // eslint-disable-next-line react/display-name
                component: () => (
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl text-sm font-semibold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] transition-colors shadow-sm"
                  >
                    <MessageCircle size={16} /> Log Communication
                  </button>
                ),
                className: 'w-full',
              },
            ],
          },
          {
            type: 'section',
            title: 'Vehicle Information',
            icon: Car,
            contentClassName: 'grid grid-cols-1 md:grid-cols-2 gap-4',
            fields: [
              { name: 'vehicle_info.year', label: 'Year', type: 'number', placeholder: '2024' },
              { name: 'vehicle_info.make', label: 'Make', placeholder: 'Toyota' },
              { name: 'vehicle_info.model', label: 'Model', placeholder: 'Camry' },
              { name: 'vehicle_info.trim', label: 'Trim / Edition', placeholder: 'LE' },
              {
                name: 'vehicle_info.vin',
                label: 'VIN',
                placeholder: '17 Characters',
                className: 'md:col-span-2',
              },
              { name: 'vehicle_info.color', label: 'Color', placeholder: 'e.g. Silver' },
              { name: 'vehicle_info.mileage', label: 'Mileage', type: 'number', placeholder: '0' },
              {
                name: 'vehicle_info.condition',
                label: 'Condition',
                type: 'select',
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
                placeholder: 'Internal notes...',
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
                options: [
                  { label: 'USD', value: 'USD' },
                  { label: 'EUR', value: 'EUR' },
                  { label: 'GBP', value: 'GBP' },
                ],
                defaultValue: 'USD',
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
              }, // Hide but keep in form
            ],
          },
          {
            type: 'section',
            title: 'Additional Fees',
            icon: Info,
            contentClassName: 'grid grid-cols-1 md:grid-cols-3 gap-4',
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
                        className="flex flex-col sm:flex-row gap-2 p-3 bg-[rgb(var(--color-background))]/50 rounded-xl border border-[rgb(var(--color-border))]/50 sm:border-none sm:p-0 sm:bg-transparent"
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
      // {
      //     name: 'image_gallery',
      //     type: 'custom',
      //     label: 'Vehicle Gallery',
      //     component: () => (
      //         <div className="col-span-full mt-6">
      //             <div className="flex items-center gap-2 mb-4">
      //                 <ImageIcon className="text-[rgb(var(--color-primary))]" size={20} />
      //                 <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Vehicle Gallery</h3>
      //             </div>
      //             <FileManager
      //                 context="quote"
      //                 contextId={quoteId}
      //                 initialViewMode="grid"
      //                 allowUpload={true}
      //                 title="Photos & Images"
      //             />
      //         </div>
      //     ),
      //     className: 'col-span-full'
      // },
      {
        name: 'attachments',
        type: 'custom',
        label: 'Documents & Files',
        component: () => (
          <div className="col-span-full mt-6 h-[400px] flex flex-col">
            <FileManager
              context="quote"
              contextId={quoteId}
              title="Quote Attachments (Upload Allowed)"
              allowUpload={true}
            />
          </div>
        ),
        className: 'col-span-full',
      },
    ],
    [isSuperAdmin, isAdmin, dealershipOptions, quoteId]
  );

  const handleUpdateStatus = async (status, reason = '') => {
    try {
      const { value: confirm } = await Swal.fire({
        title: `${status.charAt(0).toUpperCase() + status.slice(1)} Quote?`,
        text: `Are you sure you want to ${status} this quote?`,
        icon: status === 'approved' ? 'success' : 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        confirmButtonColor:
          status === 'approved' ? 'rgb(var(--color-success))' : 'rgb(var(--color-error))',
      });

      if (!confirm) return;

      let finalReason = reason;
      if (status === 'rejected' && !reason) {
        const { value: rejectReason } = await Swal.fire({
          title: 'Rejection Reason',
          input: 'textarea',
          inputPlaceholder: 'Please provide a reason for rejection...',
          inputAttributes: {
            'aria-label': 'Reason for rejection',
          },
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value) {
              return 'You need to write a reason!';
            }
          },
        });

        if (!rejectReason) return;
        finalReason = rejectReason;
      }

      await quoteService.updateStatus(quoteId, {
        status,
        reason: finalReason || (status === 'approved' ? 'Dealer approval' : 'Dealer rejection'),
        notify_customer: true,
        ...endpointParams,
      });

      Swal.fire({
        title: 'Success',
        text: `Quote ${status} successfully`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      setIsEditing(false);
      const updatedData = await quoteService.getQuoteById(quoteId, endpointParams);
      const q = updatedData.quote || updatedData;
      const normalized = normalizeQuoteData(q, rawQuote.tags); // Keep existing tags as they aren't affected by status
      setRawQuote(normalized);
      setInitialData(normalized);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleSave = async (data) => {
    try {
      const payload = {
        dealership_id: data.dealership_id,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        vehicle_details: {
          ...data.vehicle_info,
          year: Number(data.vehicle_info.year),
          mileage: Number(data.vehicle_info.mileage || 0),
        },
        quote_amount: Number(data.amount),
        currency: data.currency || 'USD',
        validity_days: Number(data.validity_days || 30),
        notes: data.notes,
        down_payment: Number(data.down_payment || 0),
        loan_term: Number(data.loan_term || 0),
        interest_rate: Number(data.interest_rate || 0),
        trade_in_value: Number(data.trade_in_value || 0),
        additional_fees: {
          documentation_fee: Number(data.additional_fees?.documentation_fee || 0),
          registration_fee: Number(data.additional_fees?.registration_fee || 0),
          dealer_fee: Number(data.additional_fees?.dealer_fee || 0),
        },
        monthly_payment: Number(data.monthly_payment || 0),
        ...endpointParams,
      };

      await quoteService.updateQuote(quoteId, payload);

      // Sync Tags
      if (data.tags) {
        const tagIds = data.tags.map((t) => t.id);
        try {
          await tagService.syncTags('quote', quoteId, tagIds);
        } catch (err) {
          console.error('Failed to sync tags', err);
        }
      }

      Swal.fire({
        title: 'Success',
        text: 'Quote updated',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      setIsEditing(false);

      // Refetch to ensure all backend-side calculations and associations are fresh
      const updatedData = await quoteService.getQuoteById(quoteId, endpointParams);
      const quote = updatedData.quote || updatedData;

      // Refetch tags
      let finalTags = data.tags || [];
      try {
        finalTags = await tagService.getEntityTags('quote', quoteId);
      } catch (err) {
        console.error('Failed to refetch tags', err);
      }

      const normalized = normalizeQuoteData(quote, finalTags);
      setRawQuote(normalized);
      setInitialData(normalized);
    } catch (error) {
      console.error('Quote update error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      const errorMessage = error.response?.data?.message || error.message || 'Update failed';
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  if (!initialData)
    return (
      <div className="text-center p-20">
        <h2>Quote Not Found</h2>
        <button className="" onClick={() => router.push('/quotes')}>
          Return
        </button>
      </div>
    );

  if (isEditing) {
    return (
      <>
        <GenericFormPage
          title="Edit Quote"
          subtitle={`Editing Quote #${quoteId}`}
          initialData={initialData}
          validationSchema={validationSchema}
          fields={fields}
          onSave={handleSave}
          onCancel={() => {
            if (searchParams.get('edit') === 'true') {
              router.push('/quotes');
            } else {
              setIsEditing(false);
            }
          }}
          saveLabel="Update Quote"
        />
        <LogCommunicationModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          quoteId={quoteId}
          customerEmail={initialData.customer_email}
          onLogAdded={fetchLogs}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => router.push('/quotes')}
          className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
        >
          <ChevronLeft size={20} /> Back to Quotes
        </button>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Buttons removed as per request */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Quote"
          value={`$${(rawQuote.amount || rawQuote.quote_amount)?.toLocaleString()}`}
          icon={DollarSign}
          color="bg-[rgb(var(--color-primary))]"
        />
        <SummaryCard
          title="Monthly Payment"
          value={`$${Number(calculatePayment(initialData)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Clock}
          color="bg-[rgb(var(--color-info))]"
        />
        <SummaryCard
          title="Down Payment"
          value={`$${rawQuote.down_payment?.toLocaleString() || '0'}`}
          icon={ShieldCheck}
          color="bg-[rgb(var(--color-success))]"
        />
        <SummaryCard
          title="Trade-In"
          value={`$${rawQuote.trade_in_value?.toLocaleString() || '0'}`}
          icon={Car}
          color="bg-[rgb(var(--color-warning))]"
        />
      </div>

      <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] shrink-0">
            <Car size={32} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[rgb(var(--color-text))] break-words">
              {initialData?.vehicle_info?.year} {initialData?.vehicle_info?.make}{' '}
              {initialData?.vehicle_info?.model}
            </h1>
            <p className="text-sm text-[rgb(var(--color-text-muted))] flex items-center gap-2 mt-1">
              <Clock size={14} /> Created on {formatDate(rawQuote?.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
          <TagList tags={rawQuote.tags} />
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider 
                        ${
                          rawQuote.status === 'approved'
                            ? 'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] border border-[rgb(var(--color-success))]/20'
                            : rawQuote.status === 'pending'
                              ? 'bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] border border-[rgb(var(--color-warning))]/20'
                              : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]'
                        }`}
          >
            {rawQuote.status}
          </span>
          <span className="text-[10px] text-[rgb(var(--color-text-muted))] font-mono uppercase">
            Quote ID: {quoteId}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex items-center gap-2">
                <User size={18} className="text-[rgb(var(--color-primary))]" />
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
                  Customer Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <DetailRow label="Full Name" value={initialData.customer_name} />
                <DetailRow label="Email" value={initialData.customer_email} icon={Mail} />
                <DetailRow label="Phone" value={initialData.customer_phone} />
              </div>
            </section>

            <section className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex items-center gap-2">
                <Car size={18} className="text-[rgb(var(--color-primary))]" />
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
                  Vehicle Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <DetailRow
                  label="Make / Model"
                  value={`${initialData?.vehicle_info?.make} ${initialData?.vehicle_info?.model}`}
                />
                <DetailRow
                  label="Year / Trim"
                  value={`${initialData?.vehicle_info?.year} ${initialData?.vehicle_info?.trim || ''}`}
                />
                <DetailRow
                  label="VIN"
                  value={initialData?.vehicle_info?.vin || 'N/A'}
                  className="font-mono text-[11px]"
                />
                <DetailRow label="Color" value={initialData?.vehicle_info?.color || 'N/A'} />
                <DetailRow
                  label="Condition"
                  value={initialData?.vehicle_info?.condition || 'N/A'}
                />
                <DetailRow
                  label="Mileage"
                  value={`${initialData?.vehicle_info?.mileage?.toLocaleString() || '0'} miles`}
                />
              </div>
            </section>
          </div>

          <section className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm mb-6 h-[500px] flex flex-col">
            <FileManager
              context="quote"
              contextId={quoteId}
              title="Quote Attachments"
              allowUpload={false}
            />
          </section>

          <section className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-[rgb(var(--color-info))]" />
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
                  Communication History
                </h3>
              </div>
            </div>
            <div className="p-6">
              {loadingLogs ? (
                <div className="text-center py-10 text-[rgb(var(--color-text-muted))] animate-pulse">
                  Loading logs...
                </div>
              ) : communicationLogs.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[rgb(var(--color-border))] before:content-['']">
                  {communicationLogs
                    .slice(0, 10)
                    .reverse()
                    .map((log, i) => (
                      <div key={i} className="flex gap-4 relative">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center z-10 
                                                ${(log.communication_type || log.type) === 'email' ? 'bg-[rgb(var(--color-info))]/10 text-[rgb(var(--color-info))]' : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]'}`}
                        >
                          {(log.communication_type || log.type) === 'email' ? (
                            <Mail size={12} />
                          ) : (
                            <FileText size={12} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-[rgb(var(--color-text))]">
                              {log.subject || 'Message Logged'}
                            </h4>
                            <span className="text-[10px] text-[rgb(var(--color-text-muted))] font-medium uppercase">
                              {formatDate(log.created_at || log.timestamp)}
                            </span>
                          </div>
                          <div className="text-xs text-[rgb(var(--color-text-muted))] leading-relaxed">
                            {log.message || log.content || log.body || 'No content available'}
                          </div>
                          {log.sent_by_name && (
                            <p className="text-[10px] text-[rgb(var(--color-text-muted))] mt-1">
                              Logged by: {log.sent_by_name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-[rgb(var(--color-background))] flex items-center justify-center mx-auto mb-3 text-[rgb(var(--color-text-muted))]/30">
                    <MessageCircle size={24} />
                  </div>
                  <p className="text-sm text-[rgb(var(--color-text-muted))]">
                    No communication logs recorded yet.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <section className="bg-[rgb(var(--color-primary))] rounded-3xl p-6 text-white shadow-xl shadow-[rgb(var(--color-primary))]/20">
            <div className="flex items-center gap-2 mb-6 opacity-90">
              <ShieldCheck size={20} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Financial Summary</h3>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium opacity-70 mb-1">Total Quote Amount</p>
                <h2 className="text-4xl font-extrabold tracking-tight">
                  ${Number(initialData.amount).toLocaleString()}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Down Payment</p>
                  <p className="text-lg font-bold">
                    ${Number(initialData.down_payment || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Loan Term</p>
                  <p className="text-lg font-bold">{initialData.loan_term || 0} Months</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Interest Rate</p>
                  <p className="text-lg font-bold">{initialData.interest_rate || 0}% APR</p>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 mt-6 border border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs opacity-80">
                  <span>Documentation Fee</span>
                  <span>
                    ${(initialData.additional_fees?.documentation_fee || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs opacity-80">
                  <span>Registration Fee</span>
                  <span>
                    ${(initialData.additional_fees?.registration_fee || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs opacity-80">
                  <span>Dealer Fee</span>
                  <span>${(initialData.additional_fees?.dealer_fee || 0).toLocaleString()}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center text-xs">
                  <span className="opacity-70 font-semibold uppercase tracking-wider">
                    Estimated Monthly
                  </span>
                  <span className="font-bold text-lg">
                    $
                    {Number(calculatePayment(initialData)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
              <Info size={16} className="text-[rgb(var(--color-text-muted))]" />
              Internal Notes
            </h3>
            <div className="text-xs text-[rgb(var(--color-text-muted))] leading-relaxed italic bg-[rgb(var(--color-background))] p-4 rounded-xl border border-[rgb(var(--color-border))]">
              {initialData.notes || 'No internal notes found for this quote.'}
            </div>
          </section>
        </div>
      </div>

      <LogCommunicationModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        quoteId={quoteId}
        customerEmail={initialData.customer_email}
        onLogAdded={fetchLogs}
      />
    </div>
  );
}

function DetailRow({ label, value, icon: Icon, className }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-xs text-[rgb(var(--color-text-muted))] font-medium">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={14} className="text-[rgb(var(--color-text-muted))]" />}
        <span className={`text-sm font-bold text-[rgb(var(--color-text))] truncate ${className}`}>
          {value || 'N/A'}
        </span>
      </div>
    </div>
  );
}
