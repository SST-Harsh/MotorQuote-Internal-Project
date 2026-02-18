import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileText,
  Calendar,
  HardDrive,
  User,
  Info,
  Link as LinkIcon,
  History,
  Shield,
  Zap,
  File,
  Image as ImageIcon,
  Film,
} from 'lucide-react';
import fileService from '@/services/fileService';
import { useState, useEffect } from 'react';

const FileDetailsModal = ({ isOpen, onClose, file }) => {
  // Hooks must be called before any early returns
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    if (isOpen && file && (file.type || file.mime_type || '').startsWith('image/') && file.id) {
      fileService
        .downloadFile(file.id)
        .then((blob) => {
          objectUrl = URL.createObjectURL(blob);
          if (isMounted) setImageUrl(objectUrl);
        })
        .catch((error) => {
          console.error('Details preview load failed:', error);
        });
    }

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileName = () => {
    return (
      file.name ||
      file.display_name ||
      file.file_name ||
      file.filename ||
      file.original_name ||
      'Document'
    );
  };

  const FileIcon = ({ type, className = '' }) => {
    const fileType = (type || '').toLowerCase();
    if (fileType.includes('pdf')) return <FileText className={`text-red-500 ${className}`} />;
    if (fileType.startsWith('image/'))
      return <ImageIcon className={`text-blue-500 ${className}`} />;
    if (fileType.startsWith('video/')) return <Film className={`text-purple-500 ${className}`} />;
    return <File className={`text-gray-400 ${className}`} />;
  };

  const DetailItem = ({ icon: Icon, label, value, color = 'text-[rgb(var(--color-primary))]' }) => (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[rgb(var(--color-background))]/30 border border-[rgb(var(--color-border))]/50 hover:border-[rgb(var(--color-primary))]/30 transition-all group">
      <div
        className={`p-2 rounded-xl bg-white shadow-sm ${color} group-hover:scale-110 transition-transform`}
      >
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-xs font-bold text-[rgb(var(--color-text))] truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[rgb(var(--color-text))]/30 backdrop-blur-sm animate-fade-in shadow-2xl">
      <div className="bg-[rgb(var(--color-surface))] w-full max-w-lg rounded-3xl border border-[rgb(var(--color-border))] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header with Background Pattern */}
        <div className="relative px-6 py-6 border-b border-[rgb(var(--color-border))] overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
            <FileText size={120} />
          </div>

          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--color-primary))] to-blue-600 p-3 shadow-lg shadow-[rgb(var(--color-primary))]/20 flex items-center justify-center text-white">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[rgb(var(--color-text))] tracking-tight">
                  File Details
                </h3>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--color-success))] animate-pulse" />
                  <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-[0.2em]">
                    Asset Intelligence
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[rgb(var(--color-background))] rounded-full transition-all hover:rotate-90 group bg-white/50 backdrop-blur-sm border border-[rgb(var(--color-border))]/50 shadow-sm"
            >
              <X
                size={20}
                className="text-[rgb(var(--color-text-muted))] group-hover:text-red-500"
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Preview Section */}
          <div className="relative group mx-auto max-w-[200px] w-full aspect-square rounded-[2rem] bg-gradient-to-br from-[rgb(var(--color-background))] to-[rgb(var(--color-surface))] border-2 border-white shadow-xl overflow-hidden flex items-center justify-center mb-2">
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="preview"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="text-center p-6">
                <div className="mb-2 flex justify-center opacity-40 group-hover:scale-110 transition-transform duration-500">
                  <FileIcon type={file.type || file.mime_type} className="w-16 h-16" />
                </div>
                <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest leading-tight">
                  No Preview Available
                </p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="text-center mb-6">
            <h4
              className="text-base font-bold text-[rgb(var(--color-text))] truncate px-4"
              title={getFileName()}
            >
              {getFileName()}
            </h4>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] text-[10px] font-bold uppercase tracking-wider">
                {file.type || file.mime_type || 'Unknown'}
              </span>
              <span className="text-[rgb(var(--color-border))]">|</span>
              <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                {formatSize(file.size)}
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={Zap}
              label="Last Activity"
              value={formatDate(file.updated_at || file.created_at)}
              color="text-amber-500"
            />
            <DetailItem
              icon={Calendar}
              label="Created Date"
              value={formatDate(file.created_at)}
              color="text-blue-500"
            />
            <DetailItem
              icon={User}
              label="Owner"
              value={file.user?.name || file.user?.email}
              color="text-purple-500"
            />
            <DetailItem
              icon={History}
              label="Version Control"
              value={`Revision ${file.version_count || 1}`}
              color="text-[rgb(var(--color-success))]"
            />
            {file.context && (
              <div className="col-span-2">
                <DetailItem
                  icon={LinkIcon}
                  label="Origin Context"
                  value={`${file.context.charAt(0).toUpperCase() + file.context.slice(1)} • ${file.context_id || 'Global'}`}
                  color="text-gray-600"
                />
              </div>
            )}
          </div>

          {/* Extended JSON with Modern Display */}
          {file.metadata && Object.keys(file.metadata).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Shield size={14} className="text-[rgb(var(--color-text-muted))]" />
                <h4 className="text-[10px] font-black text-[rgb(var(--color-text-muted))] uppercase tracking-[0.2em]">
                  Detailed System Attributes
                </h4>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[rgb(var(--color-primary))]/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative bg-[rgb(var(--color-background))] rounded-2xl border border-[rgb(var(--color-border))]/50 overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between px-4 py-2 bg-[rgb(var(--color-surface))]/50 border-b border-[rgb(var(--color-border))]/30">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400/50" />
                      <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                      <div className="w-2 h-2 rounded-full bg-green-400/50" />
                    </div>
                    <span className="text-[9px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                      Attributes.json
                    </span>
                  </div>
                  <pre className="text-[11px] leading-relaxed text-[rgb(var(--color-text-muted))] p-5 overflow-x-auto font-mono scrollbar-hide">
                    {JSON.stringify(file.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.05] flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[rgb(var(--color-border))] rounded-xl text-sm font-bold text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default FileDetailsModal;
