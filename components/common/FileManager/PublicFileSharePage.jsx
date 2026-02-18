'use client';
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Lock,
  AlertCircle,
  ShieldCheck,
  Clock,
  Share2,
  Loader2,
  Eye,
  EyeOff,
  Folder,
} from 'lucide-react';
import fileService from '@/services/fileService';
import Swal from 'sweetalert2';
import FileBrowser from './FileBrowser';

export default function PublicFileSharePage({ token }) {
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        // Use public endpoint for shared files
        const info = await fileService.getPublicFileInfo(token);
        setFileInfo(info);
      } catch (err) {
        console.error('Failed to fetch shared file info:', err);
        setError(err.response?.data?.message || 'This sharing link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInfo();
    }

    return () => {
      // Cleanup logic removed
    };
  }, [token]);

  const isPasswordProtected = !!fileInfo?.password_protected;
  const isOtpProtected = !!fileInfo?.otp_required && !otpVerified;

  const performDownload = async (pass = password) => {
    setDownloading(true);
    try {
      // Use fileInfo.id instead of token for standard methods
      const fileId = fileInfo?.id;
      if (!fileId) throw new Error('File ID not found');

      // Attempt download directly with password (implicit verification)
      const blob = await fileService.downloadSharedFile(token, { password: pass });

      const fileName = fileService.resolveFileName(fileInfo);
      fileService.saveBlobAsFile(blob, fileName);

      Swal.fire({
        icon: 'success',
        title: 'Download Started',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err) {
      console.error('Download/Verification failed:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        Swal.fire('Incorrect Password', 'The password you entered is incorrect.', 'error');
        setPassword('');
      } else {
        Swal.fire(
          'Download Failed',
          'Could not download the file.' +
            (err.response?.data?.message ? ` ${err.response.data.message}` : ''),
          'error'
        );
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp) return;

    setVerifying(true);
    try {
      // Verify OTP using the file service
      await fileService.verifySharedOtp(fileInfo.id || token, otp);
      setOtpVerified(true);
      Swal.fire({
        icon: 'success',
        title: 'OTP Verified',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error('OTP Verification failed:', err);
      Swal.fire('Invalid OTP', 'The code you entered is incorrect or has expired.', 'error');
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async (e) => {
    if (e) e.preventDefault();

    // If password is required and not yet entered
    if (isPasswordProtected && !password) {
      Swal.fire({
        title: 'Password Required',
        text: 'Please enter the password in the field below to download.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    performDownload(password);
  };

  const formatSize = (bytes) => {
    const b = bytes || 0;
    if (!b) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-10 h-10 text-[rgb(var(--color-primary))] animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500 font-sans tracking-tight">
            Accessing secure drive...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-red-100 animate-fade-in">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Unavailable</h1>
          <p className="text-sm text-gray-500 mb-8">{error}</p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[rgb(var(--color-primary))] text-white rounded-xl text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary))]/20 hover:opacity-90 transition-all"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col animate-fade-in font-sans">
      {/* Sticky Viewer Top Bar */}
      {!loading && !error && (
        <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-200/80 px-4 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <Share2 className="text-[rgb(var(--color-primary))] w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Shared
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-[rgb(var(--color-primary))]/10 rounded-xl text-[rgb(var(--color-primary))] shrink-0">
                  {fileInfo?.is_folder ? <Folder size={18} /> : <FileText size={18} />}
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-gray-900 truncate tracking-tight">
                    {fileService.resolveFileName(fileInfo)}
                  </h1>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                    {fileInfo?.is_folder ? (
                      <span>{fileInfo.files?.length || 0} items</span>
                    ) : (
                      <span>{formatSize(fileInfo?.size)}</span>
                    )}
                    {(fileInfo?.type || fileInfo?.mime_type) && !fileInfo?.is_folder && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="uppercase">
                          {(fileInfo.type || fileInfo.mime_type).split('/')[1] ||
                            fileInfo.type ||
                            fileInfo.mime_type}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Link Metadata */}
              <div className="hidden lg:flex items-center gap-3 border-l border-gray-200 pl-4 h-8">
                {fileInfo?.expires_at && (
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1">
                      Expires
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 leading-none">
                      {new Date(fileInfo.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {fileInfo?.max_access_count !== undefined &&
                  fileInfo?.max_access_count !== null && (
                    <div className="flex flex-col border-l border-gray-100 pl-3">
                      <span className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1">
                        Access
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 leading-none">
                        {fileInfo.access_count || 0} / {fileInfo.max_access_count}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Download button removed from here, moved to main content area as requested */}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col relative items-center justify-center p-6">
        {!loading && !error && fileInfo && (
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-100 text-center animate-slide-up relative overflow-hidden">
            <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-400 mx-auto mb-8 border border-gray-100 shadow-inner">
              {fileInfo.is_folder ? <Folder size={48} /> : <FileText size={48} />}
            </div>

            <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tight truncate px-4">
              {fileService.resolveFileName(fileInfo)}
            </h2>

            <div className="flex items-center justify-center gap-3 text-xs font-bold text-gray-400 mb-10 uppercase tracking-wide">
              {fileInfo.is_folder ? (
                <span>{fileInfo.files?.length || 0} items</span>
              ) : (
                <span>{formatSize(fileInfo.size)}</span>
              )}
              {!fileInfo.is_folder && (fileInfo.type || fileInfo.mime_type) && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{(fileInfo.type || fileInfo.mime_type).split('/')[1] || 'FILE'}</span>
                </>
              )}
            </div>

            {fileInfo.is_folder ? (
              <div className="text-left mb-8 max-h-[300px] overflow-auto border rounded-xl p-2 bg-gray-50">
                <FileBrowser
                  files={fileInfo.files || []}
                  viewMode="list"
                  onFileAction={() => {}}
                  isPublic={true}
                  token={token}
                />
              </div>
            ) : (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[rgb(var(--color-primary))] text-white rounded-2xl text-sm font-black shadow-xl shadow-[rgb(var(--color-primary))]/20 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Download size={20} />
                )}
                Download File
              </button>
            )}

            {isOtpProtected && (
              <div className="mt-6 space-y-3 text-left animate-fade-in">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={12} className="text-[rgb(var(--color-primary))]" /> OTP
                  Required
                </label>
                <div className="flex gap-2">
                  <div className="relative group flex-1">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold tracking-widest outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] transition-all group-hover:bg-white text-center"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={verifying || otp.length < 4}
                    className="px-6 bg-[rgb(var(--color-primary))] text-white rounded-xl text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary))/0.2] hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Verify OTP</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 font-medium text-center">
                  A verification code has been sent to the shared email address.
                </p>
              </div>
            )}

            {isPasswordProtected && (
              <div className="mt-6 space-y-3 text-left animate-fade-in">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Lock size={12} /> Password Required
                </label>
                <div className="flex gap-2">
                  <div className="relative group flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter file password..."
                      className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] transition-all group-hover:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[rgb(var(--color-primary))] rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={downloading || !password}
                    className="px-6 bg-[rgb(var(--color-primary))] text-white rounded-xl text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary))/0.2] hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Unlock</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
