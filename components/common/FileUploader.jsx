import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Trash2, Eye, AlertCircle } from 'lucide-react';
import Image from 'next/image';

const FileUploader = ({
  files = [],
  onFilesChange,
  enableUpload = true,
  enableDelete = true,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  label = 'Upload Documents',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (enableUpload) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedTypes.map((t) => t.split('/')[1]).join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File is too large. Max size: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!enableUpload) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles) => {
    setError('');
    const validFiles = [];
    let errorMsg = '';

    newFiles.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errorMsg = validationError;
      } else {
        // Check for duplicates
        if (!files.some((f) => f.name === file.name && f.size === file.size)) {
          validFiles.push(file);
        }
      }
    });

    if (errorMsg) setError(errorMsg);

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    if (!enableDelete) return;
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
          {label}
        </label>
        {files.length > 0 && (
          <span className="text-xs text-[rgb(var(--color-text-muted))]">
            {files.length} file{files.length !== 1 ? 's' : ''} attached
          </span>
        )}
      </div>

      {enableUpload && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
                        relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center group
                        ${
                          isDragging
                            ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/5'
                            : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-surface))]'
                        }
                    `}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInput}
            accept={acceptedTypes.join(',')}
          />

          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div
              className={`
                            w-12 h-12 rounded-full flex items-center justify-center transition-colors
                            ${isDragging ? 'bg-[rgb(var(--color-primary))] text-white' : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))]'}
                        `}
            >
              <Upload size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-[rgb(var(--color-text))]">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
                SVG, PNG, JPG or PDF (max. {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg group hover:border-[rgb(var(--color-primary))] transition-colors"
            >
              {/* File Icon / Preview */}
              <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-background))] flex items-center justify-center text-[rgb(var(--color-text-muted))] overflow-hidden flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <div className="relative w-full h-full group-hover/preview">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <FileText size={20} />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[rgb(var(--color-text))] truncate">
                  {file.name}
                </p>
                <p className="text-xs text-[rgb(var(--color-text-muted))]">
                  {formatSize(file.size)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {enableDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1.5 text-[rgb(var(--color-text-muted))] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete file"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
