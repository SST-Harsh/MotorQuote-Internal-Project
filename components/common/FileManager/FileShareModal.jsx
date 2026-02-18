import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Trash2,
  Calendar,
  Lock,
  Hash,
  Clock,
  Link as LinkIcon,
  CheckCircle,
  Mail,
  Shield,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import fileService from '@/services/fileService';
import Swal from 'sweetalert2';
import CustomDateTimePicker from '@/components/common/CustomDateTimePicker';
import * as yup from 'yup';

const FileShareModal = ({ file, onClose }) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxAccessCount, setMaxAccessCount] = useState('');

  const [otpEmail, setOtpEmail] = useState('');
  const [otpExpiresInHours, setOtpExpiresInHours] = useState('24');
  const [otpShares, setOtpShares] = useState([]);

  const [activeTab, setActiveTab] = useState('links');

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchShares = React.useCallback(async () => {
    setLoading(true);
    try {
      const [linksData, otpData] = await Promise.all([
        fileService.getShareLinks(file.id),
        fileService.getOTPShares(file.id),
      ]);
      setShares(Array.isArray(linksData) ? linksData : linksData.data || []);
      setOtpShares(Array.isArray(otpData) ? otpData : otpData.data || []);
    } catch (error) {
      console.error('Failed to load shares', error);
    } finally {
      setLoading(false);
    }
  }, [file.id]);

  const formatDisplayUrl = (url) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  };

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleCreateShare = async (e) => {
    e.preventDefault();
    setErrors({});

    const schema = yup.object().shape({
      password: yup
        .string()
        .trim()
        .required('Password is required')
        .min(4, 'Password must be at least 4 characters')
        .max(50, 'Password is too long'),
      maxAccessCount: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .required('Max access count is required')
        .typeError('Must be a number')
        .positive('Must be positive')
        .integer('Must be an integer'),
      expiresAt: yup
        .date()
        .nullable()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .required('Expiration date is required')
        .typeError('Invalid date')
        .min(new Date(), 'Expiration must be in the future'),
    });

    const formData = { password, maxAccessCount, expiresAt };

    try {
      await schema.validate(formData, { abortEarly: false });
    } catch (err) {
      const validationErrors = {};
      (err.inner || []).forEach((item) => {
        if (item.path) validationErrors[item.path] = item.message;
      });
      setErrors(validationErrors);
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        password: password || null,
        maxAccessCount:
          maxAccessCount !== '' && maxAccessCount !== null && maxAccessCount !== undefined
            ? parseInt(maxAccessCount, 10)
            : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const result = await fileService.shareFileViaPassword(file.id, payload);

      const token =
        result.share_token ||
        result.token ||
        (result.share_url || result.url || '').split('/').pop() ||
        result.id;

      const rawUrl =
        token && token !== file.id
          ? `/files/shared/${token}`
          : result.share_url || result.url || result.link || `/files/shared/${file.id}`;

      const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${window.location.origin}${rawUrl}`;

      Swal.fire({
        title: 'Share Link Generated',
        html: `
                <div class="mt-2 text-left">
                    <p class="text-sm text-gray-600 mb-2">Share this link with others:</p>
                    <div class="flex items-center gap-2 p-2 bg-gray-100 rounded border font-mono text-xs break-all">
                        ${formatDisplayUrl(fullUrl)}
                    </div>
                </div>
            `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Copy Link',
        cancelButtonText: 'Close',
      }).then((res) => {
        if (res.isConfirmed) {
          navigator.clipboard.writeText(fullUrl);
          Swal.fire({
            icon: 'success',
            title: 'Copied!',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
          });
        }
      });

      setPassword('');
      setExpiresAt('');
      setMaxAccessCount('');
      fetchShares();
    } catch (error) {
      Swal.fire('Error', 'Failed to generate share link', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeShare = async (shareId) => {
    const result = await Swal.fire({
      title: 'Revoke Access?',
      text: 'This link will stop working immediately.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Revoke',
    });

    if (result.isConfirmed) {
      try {
        // Using generic share revocation endpoint: DELETE /files/:id/shares/:shareId
        await fileService.revokeShareLink(file.id, shareId);
        setShares((prev) => prev.filter((s) => s.id !== shareId));
        Swal.fire('Revoked!', 'Access has been revoked.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to revoke link', 'error');
      }
    }
  };

  const handleCreateOTPShare = async (e) => {
    e.preventDefault();
    setErrors({});

    const schema = yup.object().shape({
      otpEmail: yup.string().required('Email is required').email('Invalid email format'),
      otpExpiresInHours: yup.number().required().min(1),
    });

    try {
      await schema.validate({ otpEmail, otpExpiresInHours }, { abortEarly: false });
    } catch (err) {
      const validationErrors = {};
      err.inner.forEach((e) => {
        validationErrors[e.path] = e.message;
      });
      setErrors(validationErrors);
      return;
    }

    setGenerating(true);
    try {
      // Use specific OTP endpoint
      await fileService.shareFileViaOtp(file.id, otpEmail, {
        expiresAt: otpExpiresInHours
          ? new Date(Date.now() + parseInt(otpExpiresInHours) * 60 * 60 * 1000).toISOString()
          : null,
      });
      Swal.fire('Success', `OTP share sent to ${otpEmail}`, 'success');
      setOtpEmail('');
      fetchShares();
    } catch (error) {
      Swal.fire('Error', 'Failed to send OTP share', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeOTPShare = async (shareId) => {
    const result = await Swal.fire({
      title: 'Revoke Email Access?',
      text: 'The recipient will no longer be able to use the OTP.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Revoke',
    });

    if (result.isConfirmed) {
      try {
        // Using generic share revocation endpoint: DELETE /files/:id/shares/:shareId
        await fileService.revokeShareLink(file.id, shareId);
        setOtpShares((prev) => prev.filter((s) => s.id !== shareId));
        Swal.fire('Revoked!', 'Email access has been revoked.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to revoke email access', 'error');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[rgb(var(--color-surface))] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-background))]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgb(var(--color-primary))]/10 rounded-lg text-[rgb(var(--color-primary))]">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Share File</h3>
              <p className="text-xs text-[rgb(var(--color-text-muted))] truncate max-w-[300px]">
                {file.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/30">
          <button
            onClick={() => setActiveTab('links')}
            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${activeTab === 'links' ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))] bg-white' : 'border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'}`}
          >
            <LinkIcon size={16} /> Public Links
          </button>
          <button
            onClick={() => setActiveTab('otp')}
            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${activeTab === 'otp' ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))] bg-white' : 'border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'}`}
          >
            <Mail size={16} /> Email (OTP)
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-hidden flex-1 md:min-h-[400px] overflow-y-auto md:overflow-hidden scrollbar-thin">
          {/* Tab Content: Forms */}
          <div className="w-full md:w-1/2 p-5 md:p-6 border-b md:border-b-0 md:border-r border-[rgb(var(--color-border))] md:overflow-y-auto scrollbar-thin">
            {activeTab === 'links' && (
              <div className="space-y-6 animate-fade-in">
                <h4 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider flex items-center gap-2">
                  <LinkIcon size={14} /> Create New Share Link
                </h4>

                <form onSubmit={handleCreateShare} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[rgb(var(--color-text-muted))] flex items-center gap-2">
                      <Lock size={12} /> Link Password<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                        }}
                        placeholder="Set a password for this link..."
                        className={`w-full px-3 py-2 bg-[rgb(var(--color-background))] border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] transition-all pr-10 ${errors.password ? 'border-red-500' : 'border-[rgb(var(--color-border))]'}`}
                      />
                      {errors.password && (
                        <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                          {errors.password}
                        </p>
                      )}
                      {password && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[rgb(var(--color-text-muted))] flex items-center gap-2">
                      <Calendar size={12} /> Expiration Date
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <CustomDateTimePicker
                      value={expiresAt}
                      onChange={(newValue) => {
                        setExpiresAt(newValue);
                        if (errors.expiresAt) setErrors((prev) => ({ ...prev, expiresAt: null }));
                      }}
                      placeholder="Select expiration date..."
                      error={errors.expiresAt}
                    />
                    {/* Removed redundant error paragraph as CustomDateTimePicker handles it */}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[rgb(var(--color-text-muted))] flex items-center gap-2">
                      <Hash size={12} /> Max Access Count
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxAccessCount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setMaxAccessCount(val);
                        if (errors.maxAccessCount)
                          setErrors((prev) => ({ ...prev, maxAccessCount: null }));
                      }}
                      placeholder="e.g. 5"
                      className={`w-full px-3 py-2 bg-[rgb(var(--color-background))] border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] transition-all ${errors.maxAccessCount ? 'border-red-500' : 'border-[rgb(var(--color-border))]'}`}
                    />
                    {errors.maxAccessCount && (
                      <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                        {errors.maxAccessCount}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-xl text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary))]/20 hover:opacity-90 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} /> Generating...
                      </>
                    ) : (
                      <>
                        <Share2 size={16} /> Generate Share Link
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'otp' && (
              <div className="space-y-6 animate-fade-in">
                <h4 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Mail size={14} /> Share via Email (OTP)
                </h4>

                <form onSubmit={handleCreateOTPShare} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[rgb(var(--color-text-muted))] flex items-center gap-2">
                      Recipient Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
                        size={14}
                      />
                      <input
                        type="email"
                        required
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        className={`w-full pl-10 pr-3 py-2 bg-[rgb(var(--color-background))] border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] transition-all ${errors.otpEmail ? 'border-red-500' : 'border-[rgb(var(--color-border))]'}`}
                      />
                    </div>
                    {errors.otpEmail && (
                      <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                        {errors.otpEmail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[rgb(var(--color-text-muted))] flex items-center gap-2">
                      <Clock size={12} /> Expiration (Hours)
                    </label>
                    <select
                      value={otpExpiresInHours}
                      onChange={(e) => setOtpExpiresInHours(e.target.value)}
                      className="w-full px-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] transition-all"
                    >
                      <option value="1">1 Hour</option>
                      <option value="2">2 Hours</option>
                      <option value="12">12 Hours</option>
                      <option value="24">24 Hours</option>
                      <option value="48">48 Hours</option>
                      <option value="168">1 Week</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={generating || !otpEmail}
                    className="w-full py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-xl text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary))]/20 hover:opacity-90 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} /> Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={16} /> Send Access OTP
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Tab Content: Active Management */}
          <div className="w-full md:w-1/2 p-5 md:p-6 bg-[rgb(var(--color-background))]/30 md:overflow-y-auto scrollbar-thin">
            <h4 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider flex items-center gap-2">
              {activeTab === 'otp' ? (
                <>
                  <Mail size={14} className="text-[rgb(var(--color-primary))]" /> Active OTP Shares
                </>
              ) : (
                <>
                  <CheckCircle size={14} className="text-[rgb(var(--color-success))]" /> Active
                  Share Links
                </>
              )}
            </h4>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--color-primary))]"></div>
              </div>
            ) : (activeTab === 'otp' ? otpShares : shares).filter(
                (s) =>
                  (s.status || 'active').toLowerCase() !== 'expired' &&
                  s.expires_at &&
                  new Date(s.expires_at) > new Date()
              ).length === 0 ? (
              <div className="text-center py-12 px-4 text-[rgb(var(--color-text-muted))] bg-white/50 rounded-2xl border border-dashed border-[rgb(var(--color-border))]">
                <LinkIcon size={32} className="mx-auto mb-3 opacity-10" />
                <p className="text-xs font-medium">
                  {activeTab === 'otp'
                    ? 'No active OTP links found.'
                    : 'No active sharing links found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(activeTab === 'otp' ? otpShares : shares)
                  .filter(
                    (s) =>
                      (s.status || 'active').toLowerCase() !== 'expired' &&
                      s.expires_at &&
                      new Date(s.expires_at) > new Date()
                  )
                  .map((share) => (
                    <div
                      key={share.id}
                      className="p-3 bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] shadow-sm space-y-2 group hover:border-[rgb(var(--color-primary))]/40 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 text-[rgb(var(--color-text))] flex-1 min-w-0">
                          <div className="p-1.5 bg-gray-50 rounded-lg text-[rgb(var(--color-text-muted))]">
                            <Clock size={10} />
                          </div>
                          <span className="text-[10px] font-bold uppercase truncate">
                            {activeTab === 'otp'
                              ? share.email
                              : (() => {
                                  const token =
                                    share.share_token ||
                                    share.token ||
                                    (share.share_url || share.url || '').split('/').pop();
                                  return formatDisplayUrl(
                                    token
                                      ? `/files/shared/${token}`
                                      : share.share_url || share.url || ''
                                  );
                                })()}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {activeTab !== 'otp' &&
                            (share.share_url || share.url || share.link || share.share_token) && (
                              <button
                                onClick={() => {
                                  const token =
                                    share.share_token ||
                                    share.token ||
                                    (share.share_url || share.url || '').split('/').pop();
                                  const raw = token
                                    ? `/files/shared/${token}`
                                    : share.share_url || share.url || share.link || '';
                                  const full = raw.startsWith('http')
                                    ? raw
                                    : `${window.location.origin}${raw}`;
                                  copyToClipboard(full);
                                }}
                                className="p-1.5 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5 rounded-lg transition-colors"
                                title="Copy Link"
                              >
                                <Copy size={14} />
                              </button>
                            )}
                          <button
                            onClick={() =>
                              activeTab === 'otp'
                                ? handleRevokeOTPShare(share.id)
                                : handleRevokeShare(share.id)
                            }
                            className="p-1.5 text-[rgb(var(--color-text-muted))] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revoke Access"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-[10px]">
                          <span className="text-[rgb(var(--color-text-muted))] block opacity-60">
                            Expires
                          </span>
                          <span className="font-medium text-[rgb(var(--color-text))]">
                            {share.expires_at
                              ? new Date(share.expires_at).toLocaleString()
                              : 'Never'}
                          </span>
                        </div>
                        <div className="text-[10px]">
                          <span className="text-[rgb(var(--color-text-muted))] block opacity-60">
                            Status
                          </span>
                          <span
                            className={`font-bold transition-all ${share.status === 'expired' ? 'text-red-500' : 'text-[rgb(var(--color-success))]'}`}
                          >
                            {(share.status || 'active').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {share.password && activeTab !== 'otp' && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[rgb(var(--color-border))]/50">
                          <div className="p-1 bg-amber-50 rounded text-amber-600">
                            <Lock size={10} />
                          </div>
                          <span className="text-[9px] font-bold text-amber-700 uppercase">
                            Password Protected
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileShareModal;
