'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import quoteService from '@/services/quoteService';
import fileService from '@/services/fileService';
import notificationService from '@/services/notificationService';
import { useUpdateStatus, useUpdateQuote } from '@/hooks/useQuotes';
import { usePricingConfigs } from '@/hooks/usePricingConfig';
import {
  User,
  Car,
  DollarSign,
  ChevronLeft,
  Clock,
  Mail,
  ShieldCheck,
  Info,
  X,
  Image as ImageIcon,
  Film,
  MessageSquare,
  FileText,
  Calendar,
} from 'lucide-react';
import Swal from 'sweetalert2';
import dealershipService from '@/services/dealershipService';
import TagInput from '@/components/common/tags/TagInput';
import TagBadge from '@/components/common/tags/TagBadge';
import tagService from '@/services/tagService';
import TagList from '@/components/common/tags/TagList';
import FileManager from '@/components/common/FileManager/FileManager';
import { formatDate } from '@/utils/i18n';
import PhoneInput from '@/components/common/PhoneInput';
import Loader from '@/components/common/Loader';
import { formatPhoneNumber } from '@/utils/formatters';
import CustomSelect from '@/components/common/CustomSelect';
import QuoteMessagingThread from './QuoteMessagingThread';
import 'react-quill/dist/quill.snow.css';

const SummaryCard = ({ title, value, icon: Icon, color, subValue, subValueLabel }) => (
  <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] p-5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center gap-4">
      <div
        className={`p-3 rounded-xl text-white ${color} shadow-lg shadow-[rgb(var(--color-foreground))]/10`}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider mb-0.5">
          {title}
        </p>
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <h3 className="text-xl font-bold text-[rgb(var(--color-text))]">{value}</h3>
          {subValue !== undefined && subValue !== null && (
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-[rgb(var(--color-text-muted))] uppercase leading-none">
                {subValueLabel}
              </span>
              <span className="text-xs font-bold text-[rgb(var(--color-text-muted))] leading-tight">
                ${Number(subValue).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

import { useAuth } from '@/context/AuthContext';

export default function QuoteDetailPage({ quoteId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const normalizedRole = (user?.role || '').toLowerCase().replace(/[_\s]/g, '');
  const isDealerManager = normalizedRole === 'dealermanager';
  const isDealer = normalizedRole === 'dealer' || isDealerManager;
  const endpointParams = React.useMemo(
    () => (isDealer ? { _useDealerEndpoint: true } : {}),
    [isDealer]
  );

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);
  const [rawQuote, setRawQuote] = useState(null);
  const [dealershipOptions, setDealershipOptions] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastTotalCount, setLastTotalCount] = useState(0);
  const [proposedAmount, setProposedAmount] = useState(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const updateStatusMutation = useUpdateStatus();
  const updateQuoteMutation = useUpdateQuote();

  // Update unread count and synchronize quote amount when messages are loaded
  const handleMessagesLoaded = useCallback(
    async (totalCount, latestPrice) => {
      // Handle unread count
      if (!isChatOpen && totalCount > lastTotalCount && lastTotalCount !== 0) {
        setUnreadCount((prev) => prev + (totalCount - lastTotalCount));
      }
      setLastTotalCount(totalCount);
      if (latestPrice) {
        setProposedAmount(latestPrice);
      }
    },
    [isChatOpen, lastTotalCount]
  );

  // Clear unread count when opening chat
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Fetch unread notifications for this quote
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationService.getUserNotifications({
          entity_type: 'quote',
          entity_id: quoteId,
        });

        if (response?.data?.notifications) {
          const unread = response.data.notifications.filter((n) => !n.is_read && !n.read_at).length;
          setNotificationCount(unread);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    if (quoteId) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [quoteId]);

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
      documentation_fee: Number(fees.documentation_fee || fees.documentationFee) || '',
      registration_fee: Number(fees.registration_fee || fees.registrationFee) || '',
      dealer_fee: Number(fees.dealer_fee || fees.dealerFee) || '',
    };

    const vehicleData = quote.vehicle_info || quote.vehicle_details || quote.vehicleDetails || {};
    const vehicleMedia = Array.isArray(vehicleData.media) ? vehicleData.media : [];
    const vehicleLegalDocs = vehicleData.legalDocuments || vehicleData.legal_documents || [];
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
        color: vehicleData.color || vehicleData.colour || '',
        mileage: vehicleData.mileage || 0,
        condition: vehicleData.condition || 'new',
        registration_number:
          vehicleData.registrationNumber || vehicleData.registration_number || '',
        fuel_type: vehicleData.fuelType || vehicleData.fuel_type || '',
        transmission: vehicleData.transmission || '',
        number_of_owners: vehicleData.numberOfOwners || vehicleData.number_of_owners || '',
        accident_history: vehicleData.accidentHistory || vehicleData.accident_history || '',
        media: vehicleMedia,
        legalDocuments: vehicleLegalDocs,
      },
      amount: Number(
        quote.amount ||
          quote.quote_amount ||
          quote.quoteAmount ||
          quote.total_amount ||
          quote.totalAmount ||
          0
      ),
      monthly_payment: quote.monthly_payment || '',
      additional_fees: normalizedFees,
      additional_services: quote.additional_services || [],
      down_payment: Number(quote.down_payment) || 0,
      loan_term: quote.loan_term || 0,
      interest_rate: quote.interest_rate || 0,
      currency: quote.currency || 'USD',
      validity_days: quote.validity_days || 30,
      notes: quote.notes || '',
      dealership_id: dealershipId ? String(dealershipId) : '',
      expired_at: quote.expired_at || quote.expiry_date || null,
    };
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';
  const canSetFinalPrice = isDealerManager;
  const sellerVehicleMedia = useMemo(() => {
    const media = initialData?.vehicle_info?.media;
    if (!Array.isArray(media)) return [];

    return media
      .map((item, index) => {
        const uri = item?.url || item?.uri || item?.path || '';
        const mime = String(item?.mimeType || item?.mime_type || '').toLowerCase();
        const mediaType = String(item?.type || '').toLowerCase();
        const isImage = mime.startsWith('image/') || mediaType === 'image';
        const isVideo = mime.startsWith('video/') || mediaType === 'video';
        const previewable = /^(https?:\/\/|blob:|data:|\/)/i.test(uri);

        if (!isImage && !isVideo) return null;

        return {
          id: item?.id || `${item?.fileName || 'media'}-${index}`,
          sourceId: item?.id || null,
          uri,
          path: item?.path || '',
          name: item?.fileName || item?.name || `Media ${index + 1}`,
          mime: mime || (isImage ? 'image/*' : 'video/*'),
          kind: isImage ? 'image' : 'video',
          previewable,
        };
      })
      .filter(Boolean);
  }, [initialData]);
  const sellerMediaOnlyFilter = useCallback(
    (file) => {
      const mimeType = String(file?.type || file?.mime_type || '').toLowerCase();
      const isImageOrVideo = mimeType.startsWith('image/') || mimeType.startsWith('video/');
      if (!isImageOrVideo) return false;

      const normalize = (value) =>
        String(value || '')
          .toLowerCase()
          .replace(/[_\s]/g, '');
      const roleCandidates = [
        file?.uploaded_by_role,
        file?.created_by_role,
        file?.creator_role,
        file?.owner_role,
        file?.user_role,
        file?.uploader?.role,
        file?.creator?.role,
        file?.owner?.role,
        file?.user?.role,
      ]
        .map(normalize)
        .filter(Boolean);

      if (roleCandidates.length > 0) {
        return roleCandidates.includes('seller');
      }

      // Fallback: if role metadata is missing, show only files created by quote creator.
      const quoteCreatorId = rawQuote?.created_by || rawQuote?.creator_id || rawQuote?.creator?.id;
      const fileCreatorId =
        file?.created_by || file?.creator_id || file?.owner_id || file?.user_id || file?.user?.id;
      if (quoteCreatorId && fileCreatorId) {
        return String(quoteCreatorId) === String(fileCreatorId);
      }

      return false;
    },
    [rawQuote]
  );

  // Fetch dealership options for Admin/SuperAdmin
  useEffect(() => {
    const fetchDealers = async () => {
      if (!user) return;

      if (isSuperAdmin) {
        try {
          const options = await dealershipService.getDealershipOptions(true);
          setDealershipOptions(options);
        } catch (e) {
          console.error('Failed to fetch dealerships', e);
        }
      }
    };
    fetchDealers();
  }, [isSuperAdmin, user]);

  // Helper to calculate monthly payment dynamically if missing from API
  const calculatePayment = (data) => {
    if (data.monthly_payment && data.monthly_payment > 0) return data.monthly_payment;

    const amount = Number(data.amount || 0);
    const down = Number(data.down_payment || 0);
    const doc = Number(data.additional_fees?.documentation_fee || 0);
    const reg = Number(data.additional_fees?.registration_fee || 0);
    const dealer = Number(data.additional_fees?.dealer_fee || 0);
    const services = (data.additional_services || []).reduce(
      (acc, s) => acc + Number(s.price || 0),
      0
    );

    const principal = amount + doc + reg + dealer + services - down;
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

          // ── Dealership Visibility Guard ─────────────────────────────────
          if (isDealerManager) {
            const authorizedIds = new Set([
              ...(user?.dealerships || []).map((d) => String(d.id)),
              ...(user?.dealership_id ? [String(user.dealership_id)] : []),
            ]);
            const quoteDealershipId = normalized.dealership_id || quote.dealership_id;
            if (quoteDealershipId && !authorizedIds.has(String(quoteDealershipId))) {
              Swal.fire('Access Denied', 'You are not authorized to view this quote.', 'error');
              router.push('/quotes');
              return;
            }
          }

          setRawQuote(normalized);
          setInitialData(normalized);
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
  }, [quoteId, router, normalizeQuoteData, endpointParams, user, isDealerManager]);

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

  const handlePriceSet = async (newValues) => {
    try {
      // 1. Update the Quote Data (Amount & Financials)
      const quoteDataPayload = {
        quote_amount: newValues.price,
        base_price: newValues.base_price,
        discount_key: newValues.discount_key || null,
        discount_amount: newValues.discount_amount || 0,
        fee_key: newValues.fee_key || null,
        fee_amount: newValues.fee_amount || 0,
        tax_key: newValues.tax_key || null,
        tax_amount: newValues.tax_amount || 0,
        insurance_key: newValues.insurance_key || null,
        insurance_amount: newValues.insurance_amount || 0,
        down_payment: newValues.down_payment,
        loan_term: newValues.loan_term,
        interest_rate: newValues.interest_rate,
        dealer_note: newValues.dealer_note || null,
        offer_expires_at: newValues.offer_expires_at || null,
        ...endpointParams,
      };

      await updateQuoteMutation.mutateAsync({
        id: quoteId,
        data: quoteDataPayload,
      });

      // Status is no longer automatically transitioned to approved here.
      // That flow requires explicit action via handleUpdateStatus ('approved').

      const updatedData = await quoteService.getQuoteById(quoteId, endpointParams);

      const q = updatedData.data || updatedData.quote || updatedData;
      const normalized = normalizeQuoteData(q, rawQuote.tags);

      setRawQuote(normalized);
      setInitialData(normalized);
      setIsPriceModalOpen(false);

      Swal.fire('Success', 'Quote amount and financial details saved', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update quote', 'error');
    }
  };

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

      await updateStatusMutation.mutateAsync({
        id: quoteId,
        status,
        reason: finalReason || (status === 'approved' ? 'Dealer approval' : 'Dealer rejection'),
        notify_customer: true,
        ...endpointParams,
      });

      const updatedData = await quoteService.getQuoteById(quoteId, endpointParams);
      const q = updatedData.data || updatedData.quote || updatedData;
      const normalized = normalizeQuoteData(q, rawQuote.tags); // Keep existing tags as they aren't affected by status
      setRawQuote(normalized);
      setInitialData(normalized);
      Swal.fire('Success', 'Status updated successfully', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // Handler for generating sale documents (Deal Confirmation Letter & Vehicle Sale Receipt)
  const handleGenerateDocuments = async () => {
    try {
      const { value: confirm } = await Swal.fire({
        title: 'Generate Sale Documents?',
        text: 'This will generate the Deal Confirmation Letter and Vehicle Sale Receipt for this sold vehicle.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Generate',
        confirmButtonColor: 'rgb(var(--color-primary))',
        cancelButtonText: 'Cancel',
      });

      if (!confirm) return;

      // Prepare the document payload
      const vehicleInfo = initialData?.vehicle_info || {};
      const payload = {
        dealerName: user?.name || user?.fullName || 'Dealer',
        dealershipName: rawQuote.dealership?.name || 'Dealership',
        vehicleDetails: {
          make: vehicleInfo.make || '',
          model: vehicleInfo.model || '',
          year: vehicleInfo.year || '',
          vin: vehicleInfo.vin || '',
          registrationNumber: vehicleInfo.registration_number || '',
          colour: vehicleInfo.color || vehicleInfo.colour || '',
          mileage: vehicleInfo.mileage?.toString() || '0',
        },
        mileageAtSale: vehicleInfo.mileage?.toString() || '0',
        paymentMethod: 'Bank Transfer',
        _useDealerEndpoint: true,
      };

      console.log('Generating documents with payload:', payload);
      const response = await quoteService.generateDocuments(quoteId, payload);
      console.log('Document generation response:', response);

      // Check for both success: true and response existence
      // Also handle case where response might be wrapped differently or success flag is missing
      const isSuccess =
        response &&
        (response.success === true || response.success === 'true' || response.documents);

      if (isSuccess) {
        Swal.fire({
          title: 'Sale Documents Generated',
          text:
            response.message ||
            response.data?.message ||
            'Deal Confirmation Letter and Vehicle Sale Receipt have been generated successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      } else {
        // Log the full response for debugging
        console.error('Document generation failed. Response:', response);
        throw new Error(
          response?.message || response?.data?.message || 'Failed to generate sale documents'
        );
      }
    } catch (error) {
      console.error('Document generation error:', error);
      Swal.fire(
        'Error',
        error.response?.data?.message || error.message || 'Failed to generate sale documents',
        'error'
      );
    }
  };

  if (!initialData) return <Loader />;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => router.push('/quotes')}
          className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
        >
          <ChevronLeft size={20} /> Back to Quotes
        </button>

        {rawQuote.status === 'pending' && canSetFinalPrice && (
          <button
            onClick={() => setIsPriceModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold shadow-lg shadow-[rgb(var(--color-primary))]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <DollarSign size={20} />
            {initialData.amount > 0 ? 'Update Final Price' : 'Set Final Price'}
          </button>
        )}
      </div>

      {((rawQuote.status === 'pending' && initialData.amount > 0) ||
        [
          'approved',
          'rejected',
          'declined',
          'rejection',
          'sold',
          'sold_out',
          'converted',
          '',
        ].includes(rawQuote.status)) && (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <SummaryCard
            title="Total Quote Amount"
            value={`$${(initialData.amount || rawQuote.amount || 0).toLocaleString()}`}
            icon={DollarSign}
            color="bg-[rgb(var(--color-primary))]"
            subValue={null}
            subValueLabel="Proposed"
          />
        </div>
      )}

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
                          ['approved', 'accepted'].includes(rawQuote.status)
                            ? 'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] border border-[rgb(var(--color-success))]/20'
                            : ['sold', 'sold_out', 'converted', ''].includes(rawQuote.status)
                              ? 'bg-[rgb(var(--color-info))]/10 text-[rgb(var(--color-info))] border border-[rgb(var(--color-info))]/20'
                              : rawQuote.status === 'pending'
                                ? 'bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] border border-[rgb(var(--color-warning))]/20'
                                : ['declined', 'rejection', 'rejected'].includes(rawQuote.status)
                                  ? 'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] border border-[rgb(var(--color-error))]/20'
                                  : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]'
                        }`}
          >
            {['sold', 'sold_out', 'converted', ''].includes(rawQuote.status)
              ? 'Sold Out'
              : rawQuote.status}
          </span>
          {['sold', 'sold_out', 'converted'].includes(rawQuote.status) && isDealerManager && (
            <button
              onClick={handleGenerateDocuments}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold text-sm shadow-lg shadow-[rgb(var(--color-primary))]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <FileText size={16} />
              Generate Sale Documents
            </button>
          )}
          <span className="text-[10px] text-[rgb(var(--color-text-muted))] font-mono uppercase">
            Quote ID: #{String(quoteId).split('-')[0]}
          </span>
        </div>
      </div>

      {rawQuote.status === 'rejected' && rawQuote.rejection_reason && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
          <div>
            <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">
              Rejection Reason
            </h4>
            <p className="text-sm text-red-600 font-semibold leading-relaxed italic">
              &quot;{rawQuote.rejection_reason}&quot;
            </p>
            {rawQuote.rejected_at && (
              <p className="text-[10px] text-red-400 mt-2 font-medium">
                Rejected on {formatDate(rawQuote.rejected_at)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
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
                <DetailRow label="Phone" value={formatPhoneNumber(initialData.customer_phone)} />
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
                <DetailRow
                  label="Reg. Number"
                  value={initialData?.vehicle_info?.registration_number || 'N/A'}
                />
                <DetailRow label="Color" value={initialData?.vehicle_info?.color || 'N/A'} />
                <DetailRow
                  label="Fuel Type"
                  value={initialData?.vehicle_info?.fuel_type || 'N/A'}
                />
                <DetailRow
                  label="Transmission"
                  value={initialData?.vehicle_info?.transmission || 'N/A'}
                />
                <DetailRow
                  label="Condition"
                  value={initialData?.vehicle_info?.condition || 'N/A'}
                />
                <DetailRow
                  label="Owners"
                  value={initialData?.vehicle_info?.number_of_owners || '0'}
                />
                <DetailRow
                  label="Accident History"
                  value={initialData?.vehicle_info?.accident_history || 'N/A'}
                />
                <DetailRow
                  label="Mileage (km)"
                  value={`${initialData?.vehicle_info?.mileage?.toLocaleString() || '0'} km`}
                />
              </div>
            </section>
          </div>

          <section className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex items-center gap-2">
              <Car size={18} className="text-[rgb(var(--color-primary))]" />
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
                Vehicle Media & Gallery
              </h3>
            </div>
            <div className="p-4 md:p-5 space-y-4">
              <SellerMediaGallery media={sellerVehicleMedia} quoteId={quoteId} />
            </div>
          </section>

          {/* Seller Uploaded Documents (Legal Documents) */}
          {(() => {
            // Extract legal documents from various possible locations
            const vehicleData = initialData?.vehicle_info || {};
            const legalDocs =
              vehicleData.legalDocuments ||
              initialData?.legalDocuments ||
              initialData?.legal_documents ||
              initialData?.seller_documents ||
              [];

            if (!Array.isArray(legalDocs) || legalDocs.length === 0) return null;

            return (
              <section className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm flex flex-col">
                <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex items-center gap-2">
                  <FileText size={18} className="text-[rgb(var(--color-warning))]" />
                  <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
                    Seller Uploaded Documents
                  </h3>
                  <span className="ml-auto px-2 py-0.5 bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] text-[10px] font-bold uppercase rounded-full">
                    {legalDocs.length}
                  </span>
                </div>
                <div className="p-4 md:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {legalDocs.map((doc, index) => {
                      const docUrl = doc.uri || doc.url || doc.path || '';
                      const docName =
                        doc.fileName || doc.name || doc.file_name || `Document ${index + 1}`;
                      const docType =
                        doc.documentType || doc.document_type || doc.type || 'Document';
                      const docTypeLabel = doc.documentTypeLabel || doc.document_type_label || '';

                      return (
                        <a
                          key={doc.id || index}
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))]/30 hover:shadow-md transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-warning))]/10 flex items-center justify-center text-[rgb(var(--color-warning))] group-hover:bg-[rgb(var(--color-warning))] group-hover:text-white transition-colors shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[rgb(var(--color-text))] truncate">
                              {docName}
                            </p>
                            <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase">
                              {docTypeLabel || docType}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })()}
        </div>

        <div className="lg:col-span-4 space-y-6">
          {['approved', 'sold', 'sold_out', 'converted', ''].includes(rawQuote.status) && (
            <section className="bg-[rgb(var(--color-primary))] rounded-3xl p-6 text-white shadow-xl shadow-[rgb(var(--color-primary))]/20 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 mb-6 opacity-90">
                <ShieldCheck size={20} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Financial Summary</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium opacity-70 mb-1">Total Quote Amount</p>
                  <h2 className="text-4xl font-extrabold tracking-tight">
                    ${Number(initialData.amount || 0).toLocaleString()}
                  </h2>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Expiry Date</p>
                  <p className="text-lg font-bold flex items-center gap-2">
                    <Calendar size={18} className="opacity-70" />
                    {initialData.expired_at ? formatDate(initialData.expired_at) : 'N/A'}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
              <Info size={16} className="text-[rgb(var(--color-text-muted))]" />
              Internal Notes
            </h3>
            <div
              className="text-xs text-[rgb(var(--color-text-muted))] leading-relaxed bg-[rgb(var(--color-background))] p-4 rounded-xl border border-[rgb(var(--color-border))] prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: initialData.notes || 'No internal notes found for this quote.',
              }}
            />
          </section>
        </div>
      </div>

      {/* Floating Chat Trigger */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[rgb(var(--color-primary))] text-white rounded-full shadow-2xl shadow-[rgb(var(--color-primary))]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[9998] group"
      >
        {(unreadCount > 0 || notificationCount > 0) && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full border-2 border-[rgb(var(--color-surface))] flex items-center justify-center animate-bounce shadow-lg">
            {unreadCount + notificationCount > 9 ? '9+' : unreadCount + notificationCount}
          </div>
        )}
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Side Chat Panel via Portal */}
      {isChatOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex overflow-hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setIsChatOpen(false)}
            />
            <div className="relative ml-auto w-full max-w-lg bg-[rgb(var(--color-surface))] shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col h-full border-l border-[rgb(var(--color-border))]">
              <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--color-primary))]/10 flex items-center justify-center text-[rgb(var(--color-primary))] relative">
                    <MessageSquare size={20} />
                    {notificationCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
                      Quote Discussion
                    </h3>
                    <p className="text-[10px] text-[rgb(var(--color-text-muted))] font-bold uppercase tracking-widest leading-none mt-1">
                      Live Chat Thread
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-[rgb(var(--color-background))] rounded-full transition-colors group"
                >
                  <X
                    size={20}
                    className="text-[rgb(var(--color-text-muted))] group-hover:rotate-90 transition-transform"
                  />
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <QuoteMessagingThread
                  quoteId={quoteId}
                  isDealer={isDealer}
                  currentUserId={user?.id}
                  currentUserRole={user?.role}
                  sellerUserId={rawQuote?.created_by}
                  onMessagesLoaded={handleMessagesLoaded}
                />
              </div>
            </div>
          </div>,
          document.getElementById('modal-root') || document.body
        )}

      {isPriceModalOpen && (
        <SetPriceModal
          quote={rawQuote}
          onClose={() => setIsPriceModalOpen(false)}
          onSave={handlePriceSet}
          loading={updateStatusMutation.isPending}
          proposedAmount={proposedAmount}
          readOnly={isSuperAdmin}
        />
      )}
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

function SellerMediaGallery({ media = [], quoteId = null }) {
  const [resolvedMediaUrls, setResolvedMediaUrls] = useState({});
  const [resolvingMedia, setResolvingMedia] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // Image popup/modal handler
  const openImagePreview = (item) => {
    const imageUrl = resolvedMediaUrls[item.id] || item.uri;
    setSelectedImage({ url: imageUrl, name: item.name });
  };

  const closeImagePreview = () => setSelectedImage(null);

  useEffect(() => {
    let mounted = true;
    const objectUrls = [];

    const resolvePreviews = async () => {
      if (!quoteId || !media.length) return;

      const pending = media.filter((item) => !item.previewable && item.name);
      if (!pending.length) return;

      try {
        const result = await fileService.getFiles({ context: 'quote', context_id: quoteId });
        const files = result?.files || result?.data || (Array.isArray(result) ? result : []);
        if (!files.length) return;

        const nextMap = {};
        for (const mediaItem of pending) {
          const targetName = String(mediaItem.name || '').toLowerCase();
          const matched = files.find((file) => {
            const fileName = String(
              file.filename || file.name || file.file_name || ''
            ).toLowerCase();
            return fileName === targetName;
          });

          if (!matched?.id) continue;

          try {
            const blob = await fileService.downloadFile(matched.id);
            const blobUrl = URL.createObjectURL(blob);
            objectUrls.push(blobUrl);
            nextMap[mediaItem.id] = blobUrl;
          } catch (error) {
            // Ignore per-file preview resolution failure
          }
        }

        if (mounted && Object.keys(nextMap).length) {
          setResolvedMediaUrls((prev) => ({ ...prev, ...nextMap }));
        }
      } catch (error) {
        // Ignore list fetch errors, fallback UI handles it.
      }
    };

    resolvePreviews();

    return () => {
      mounted = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [quoteId, media]);

  const resolveMediaByFallback = useCallback(
    async (item) => {
      if (!item?.id || resolvedMediaUrls[item.id] || resolvingMedia[item.id]) return;

      setResolvingMedia((prev) => ({ ...prev, [item.id]: true }));
      try {
        const candidateUrls = [];
        if (item.uri) candidateUrls.push(item.uri);
        if (item.path) candidateUrls.push(item.path);

        const uniqueCandidates = [...new Set(candidateUrls)];
        for (const candidate of uniqueCandidates) {
          try {
            const res = await fetch(candidate, { credentials: 'include' });
            if (!res.ok) continue;
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            setResolvedMediaUrls((prev) => ({ ...prev, [item.id]: blobUrl }));
            return;
          } catch (error) {
            // Try next candidate
          }
        }

        if (item.sourceId || item.id) {
          const blob = await fileService.downloadFile(item.sourceId || item.id);
          const blobUrl = URL.createObjectURL(blob);
          setResolvedMediaUrls((prev) => ({ ...prev, [item.id]: blobUrl }));
        }
      } catch (error) {
        // Keep unavailable fallback.
      } finally {
        setResolvingMedia((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [resolvedMediaUrls, resolvingMedia]
  );

  if (!media.length) {
    return (
      <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] flex items-center justify-center mb-3">
          <ImageIcon size={18} className="text-[rgb(var(--color-text-muted))]" />
        </div>
        <p className="text-sm font-semibold text-[rgb(var(--color-text))]">No seller media found</p>
        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
          Images and videos shared by seller will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-[rgb(var(--color-text))]">Seller Media</h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-bold uppercase tracking-wider">
          {media.length} items
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {media.map((item) => (
          <div
            key={item.id}
            className="rounded-xl overflow-hidden border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]"
          >
            <div className="aspect-video bg-[rgb(var(--color-background))] flex items-center justify-center overflow-hidden">
              {(item.previewable || resolvedMediaUrls[item.id]) && item.kind === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedMediaUrls[item.id] || item.uri}
                  alt={item.name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => openImagePreview(item)}
                  onError={() => resolveMediaByFallback(item)}
                />
              )}
              {(item.previewable || resolvedMediaUrls[item.id]) && item.kind === 'video' && (
                <video
                  src={resolvedMediaUrls[item.id] || item.uri}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  onError={() => resolveMediaByFallback(item)}
                />
              )}
              {!item.previewable && !resolvedMediaUrls[item.id] && (
                <div className="text-center px-3">
                  {item.kind === 'video' ? (
                    <Film size={20} className="mx-auto text-[rgb(var(--color-text-muted))] mb-1" />
                  ) : (
                    <ImageIcon
                      size={20}
                      className="mx-auto text-[rgb(var(--color-text-muted))] mb-1"
                    />
                  )}
                  <p className="text-[10px] text-[rgb(var(--color-text-muted))]">
                    {resolvingMedia[item.id] ? 'Resolving preview...' : 'Preview unavailable'}
                  </p>
                </div>
              )}
            </div>
            <div className="px-2.5 py-2 border-t border-[rgb(var(--color-border))]">
              <p
                className="text-[11px] font-semibold text-[rgb(var(--color-text))] truncate"
                title={item.name}
              >
                {item.name}
              </p>
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase mt-0.5">
                {item.kind}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && <ImagePreviewModal image={selectedImage} onClose={closeImagePreview} />}
    </div>
  );
}

function SetPriceModal({ quote, onClose, onSave, loading, proposedAmount, readOnly }) {
  const isPending = quote.status === 'pending';

  // CMS pricing config data — using exact lowercase category names from API
  const { data: discountOptions = [] } = usePricingConfigs('discounts');
  const { data: insuranceOptions = [] } = usePricingConfigs('insurance');
  const { data: taxOptions = [] } = usePricingConfigs('taxes');
  const { data: feeOptions = [] } = usePricingConfigs('fees');

  const [basePrice, setBasePrice] = useState(() => {
    if (isPending && proposedAmount) return proposedAmount;
    return quote.base_price || quote.amount || quote.quote_amount || 0;
  });
  const [downPayment, setDownPayment] = useState(quote.down_payment || 0);
  const [loanTerm, setLoanTerm] = useState(quote.loan_term || 0);
  const [interestRate, setInterestRate] = useState(quote.interest_rate || 0);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [selectedTax, setSelectedTax] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [dealerNote, setDealerNote] = useState('');

  // Normalize a config item's numeric value — skip json-type configs (return 0)
  const configVal = (item) => {
    if (!item) return 0;
    const raw = item.parameter_value ?? item.parameterValue;
    const valType = item.value_type ?? item.valueType;
    if (valType === 'json' || typeof raw === 'object') return 0;
    return Number(raw) || 0;
  };

  // Label helper — for json types show the key list instead of a numeric value
  const configLabel = (item, suffix = '') => {
    const name = item.parameterName || item.parameter_name || '';
    const valType = item.value_type ?? item.valueType;
    if (valType === 'json') return `${name} (tiered)`;
    return `${name} — ${configVal(item)}${suffix}`;
  };

  // Filter out json-type entries from discount (they're tiered, need special UI)
  const simpleDiscounts = discountOptions.filter((d) => (d.value_type ?? d.valueType) !== 'json');

  // Live calculation
  const breakdown = useMemo(() => {
    const base = Number(basePrice) || 0;
    const discountPct = configVal(selectedDiscount);
    const discountAmt = base * (discountPct / 100);
    const insuranceAmt = configVal(selectedInsurance);
    const feeAmt = configVal(selectedFee);
    const subtotal = base - discountAmt + insuranceAmt + feeAmt;
    const taxPct = configVal(selectedTax);
    const taxAmt = subtotal * (taxPct / 100);
    const finalAmount = subtotal + taxAmt;
    return { base, discountAmt, insuranceAmt, feeAmt, taxAmt, finalAmount };
  }, [basePrice, selectedDiscount, selectedInsurance, selectedTax, selectedFee]);

  const selectClass =
    'w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl py-2.5 px-4 text-sm font-bold text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed';

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[rgb(var(--color-border))] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient Header ── */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark,var(--color-primary)))] overflow-hidden flex-shrink-0">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)',
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {readOnly
                    ? 'Price Details'
                    : isPending
                      ? quote.amount > 0
                        ? 'Finalize Approval & Finance'
                        : 'Set Final Price'
                      : 'Edit Price & Finance'}
                </h3>
                <p className="text-[11px] text-white/60 font-semibold mt-0.5">
                  {readOnly
                    ? 'Financial Breakdown'
                    : isPending
                      ? 'Review the proposed price and adjust if necessary before approving.'
                      : 'Update the price and financial details for this quote.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* ── Vehicle + Customer Summary Row ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[rgb(var(--color-background))] rounded-xl p-4 border border-[rgb(var(--color-border))]">
              <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest mb-1.5">
                Vehicle
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-text))] leading-snug">
                {quote.vehicle_info?.year} {quote.vehicle_info?.make}{' '}
                {quote.vehicle_info?.model || '—'}
              </p>
              {(quote.vehicle_info?.vin || quote.vin) && (
                <p className="text-[10px] text-[rgb(var(--color-text-muted))] mt-1 font-mono">
                  VIN: {quote.vehicle_info?.vin || quote.vin}
                </p>
              )}
            </div>
            <div className="bg-[rgb(var(--color-background))] rounded-xl p-4 border border-[rgb(var(--color-border))]">
              <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest mb-1.5">
                Seller
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-text))] leading-snug">
                {quote.customer_name || quote.clientName || 'N/A'}
              </p>
              {quote.customer_email && (
                <p className="text-[10px] text-[rgb(var(--color-text-muted))] mt-1 truncate">
                  {quote.customer_email}
                </p>
              )}
            </div>
          </div>

          {/* ── Current Price Banner (only if a price already exists) ── */}
          {!!(quote.amount || quote.quote_amount) && (
            <div className="flex items-center justify-between bg-[rgb(var(--color-background))] rounded-xl px-4 py-3 border border-[rgb(var(--color-border))]">
              <p className="text-xs font-semibold text-[rgb(var(--color-text-muted))]">
                Current Price
              </p>
              <p className="text-base font-bold text-[rgb(var(--color-text-muted))]">
                ${Number(quote.amount || quote.quote_amount).toLocaleString()}
              </p>
            </div>
          )}

          {/* ── New Price Input ── */}
          <div className="bg-[rgb(var(--color-background))] rounded-2xl p-5 border-2 border-[rgb(var(--color-primary))]/30 focus-within:border-[rgb(var(--color-primary))]/60 transition-colors">
            <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest block mb-2">
              Set New Price
            </label>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[rgb(var(--color-primary))] select-none">
                $
              </span>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0"
                autoFocus
                min="0"
                className="w-full bg-transparent border-0 p-0 text-4xl font-bold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-muted))]/40"
              />
            </div>
          </div>

          {/* ── Live Price Breakdown ── */}
          {Number(basePrice) > 0 && (
            <div className="bg-[rgb(var(--color-background))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgb(var(--color-border))]">
                <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest">
                  Price Breakdown
                </p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[rgb(var(--color-text-muted))]">Base Price</span>
                  <span className="font-semibold text-[rgb(var(--color-text))]">
                    ${breakdown.base.toLocaleString()}
                  </span>
                </div>
                {breakdown.discountAmt > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[rgb(var(--color-success))]">Discount</span>
                    <span className="font-semibold text-[rgb(var(--color-success))]">
                      − $
                      {breakdown.discountAmt.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {breakdown.insuranceAmt > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[rgb(var(--color-text-muted))]">Insurance</span>
                    <span className="font-semibold text-[rgb(var(--color-text))]">
                      + $
                      {breakdown.insuranceAmt.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {breakdown.feeAmt > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[rgb(var(--color-text-muted))]">Fee</span>
                    <span className="font-semibold text-[rgb(var(--color-text))]">
                      + ${breakdown.feeAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {breakdown.taxAmt > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[rgb(var(--color-text-muted))]">Tax</span>
                    <span className="font-semibold text-[rgb(var(--color-text))]">
                      + ${breakdown.taxAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-[rgb(var(--color-border))] flex justify-between items-center">
                  <span className="text-sm font-bold text-[rgb(var(--color-text))]">
                    Total Offer
                  </span>
                  <span className="text-lg font-bold text-[rgb(var(--color-primary))]">
                    ${breakdown.finalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Price change indicator vs current price */}
                {!!(quote.amount || quote.quote_amount) &&
                  breakdown.finalAmount !== Number(quote.amount || quote.quote_amount) && (
                    <div className="mt-1">
                      {(() => {
                        const current = Number(quote.amount || quote.quote_amount);
                        const diff = breakdown.finalAmount - current;
                        const isIncrease = diff > 0;
                        return (
                          <p
                            className={`text-xs font-semibold text-right ${isIncrease ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-success))]'}`}
                          >
                            {isIncrease ? '▲' : '▼'} {isIncrease ? '+' : ''}$
                            {diff.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs
                            current price
                          </p>
                        );
                      })()}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* ── Offer Validity ── */}
          {!readOnly && (
            <div>
              <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest block mb-2">
                Offer Validity
              </label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setLoanTerm(0.01)} // 10 minutes = ~0.007 days, using 0.01 to approximate
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    loanTerm === 0.01
                      ? 'bg-[rgb(var(--color-primary))]/10 border-[rgb(var(--color-primary))]/40 text-[rgb(var(--color-primary))]'
                      : 'bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))]/30'
                  }`}
                >
                  10M
                </button>
                {[7, 14, 21, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setLoanTerm(days)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      loanTerm === days
                        ? 'bg-[rgb(var(--color-primary))]/10 border-[rgb(var(--color-primary))]/40 text-[rgb(var(--color-primary))]'
                        : 'bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))]/30'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
              {loanTerm > 0 && (
                <p className="text-[10px] text-[rgb(var(--color-text-muted))] mt-1.5">
                  {loanTerm < 1
                    ? `Expires: ${new Date(Date.now() + loanTerm * 24 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                    : `Expires: ${new Date(Date.now() + loanTerm * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                </p>
              )}
            </div>
          )}

          {/* ── Note to Seller ── */}
          {!readOnly && (
            <div>
              <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest block mb-2">
                Note to Seller{' '}
                <span className="font-normal normal-case text-[rgb(var(--color-text-muted))]/60">
                  (optional)
                </span>
              </label>
              <textarea
                value={dealerNote}
                onChange={(e) => setDealerNote(e.target.value)}
                placeholder="e.g. This offer is based on current market value. Please respond within the validity period."
                rows={3}
                maxLength={500}
                className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))]/40 resize-none outline-none focus:border-[rgb(var(--color-primary))]/50 transition-colors leading-relaxed"
              />
              <p className="text-[10px] text-[rgb(var(--color-text-muted))]/60 text-right mt-1">
                {dealerNote.length}/500
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-3.5 rounded-2xl text-sm font-bold text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-border))] transition-colors border border-[rgb(var(--color-border))]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Calculate offer_expires_at based on loanTerm (validity days)
                const expiresAt =
                  loanTerm > 0
                    ? new Date(Date.now() + loanTerm * 24 * 60 * 60 * 1000).toISOString()
                    : null;

                onSave({
                  price: Number(breakdown.finalAmount),
                  base_price: Number(basePrice),
                  discount_key:
                    selectedDiscount?.parameterKey || selectedDiscount?.parameter_key || null,
                  discount_amount: breakdown.discountAmt,
                  fee_key: selectedFee?.parameterKey || selectedFee?.parameter_key || null,
                  fee_amount: breakdown.feeAmt,
                  tax_key: selectedTax?.parameterKey || selectedTax?.parameter_key || null,
                  tax_amount: breakdown.taxAmt,
                  insurance_key:
                    selectedInsurance?.parameterKey || selectedInsurance?.parameter_key || null,
                  insurance_amount: breakdown.insuranceAmt,
                  down_payment: Number(downPayment) || 0,
                  loan_term: Number(loanTerm) || 0,
                  interest_rate: Number(interestRate) || 0,
                  dealer_note: dealerNote.trim() || null,
                  offer_expires_at: expiresAt,
                });
              }}
              disabled={loading || !basePrice || Number(basePrice) <= 0}
              className="py-3.5 rounded-2xl text-sm font-bold text-white bg-[rgb(var(--color-primary))] hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[rgb(var(--color-primary))]/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Set Price
                  {Number(basePrice) > 0 && (
                    <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs font-bold">
                      $
                      {breakdown.finalAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

// Image Preview Modal/Popup Component
function ImagePreviewModal({ image, onClose }) {
  // Close on escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.name}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Image name */}
        {image.name && (
          <div className="absolute -bottom-10 left-0 right-0 text-center">
            <p className="text-white/90 text-sm font-medium truncate">{image.name}</p>
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
