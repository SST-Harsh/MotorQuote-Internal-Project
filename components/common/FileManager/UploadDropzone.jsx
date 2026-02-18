import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import fileService from '@/services/fileService';

const UploadDropzone = ({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10485760,
  context,
  contextId,
}) => {
  // 10MB default
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Define uploadFile first since processFiles depends on it
  const uploadFile = useCallback(
    async (upload) => {
      const formData = new FormData();

      // If it's a batch upload, we might have an array of files
      if (Array.isArray(upload.files)) {
        upload.files.forEach((f) => formData.append('files[]', f));
      } else {
        formData.append('file', upload.file);
      }

      if (context) formData.append('context', context);
      if (contextId) formData.append('context_id', contextId);

      try {
        const onProgress = (progress) => {
          setUploadingFiles((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress } : u))
          );
        };

        const result = Array.isArray(upload.files)
          ? await fileService.uploadMultipleFiles(formData, onProgress)
          : await fileService.uploadFile(formData, onProgress);

        setUploadingFiles((prev) => prev.filter((u) => u.id !== upload.id));

        // Handle multiple results if batch
        if (Array.isArray(result)) {
          result.forEach((r) => {
            if (onUploadComplete) onUploadComplete(r);
          });
        } else if (result.files && Array.isArray(result.files)) {
          result.files.forEach((r) => {
            if (onUploadComplete) onUploadComplete(r);
          });
        } else {
          if (onUploadComplete) onUploadComplete(result);
        }
      } catch (err) {
        console.error('Upload failed', err);
        setUploadingFiles((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'error', error: 'Upload failed' } : u
          )
        );
        // Auto-remove error after 3s
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((u) => u.id !== upload.id));
        }, 3000);
      }
    },
    [context, contextId, onUploadComplete]
  );

  const processFiles = useCallback(
    (files) => {
      const validFiles = files.filter((file) => {
        if (file.size > maxSize) {
          setError(`File ${file.name} is too large. Max size is ${maxSize / 1024 / 1024}MB`);
          setTimeout(() => setError(null), 3000);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      if (validFiles.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} files at once`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Handle batch upload as a single "uploading" item if more than 1 file
      if (validFiles.length > 1) {
        const batchId = Math.random().toString(36).substring(7);
        const batchUpload = {
          id: batchId,
          files: validFiles,
          name: `${validFiles.length} files`,
          progress: 0,
          status: 'pending',
        };
        setUploadingFiles((prev) => [...prev, batchUpload]);
        uploadFile(batchUpload);
      } else {
        // Single file upload
        const file = validFiles[0];
        const upload = {
          id: Math.random().toString(36).substring(7),
          file,
          name: file.name,
          progress: 0,
          status: 'pending',
        };
        setUploadingFiles((prev) => [...prev, upload]);
        uploadFile(upload);
      }
    },
    [maxSize, maxFiles, uploadFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      processFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [processFiles]
  );

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
                    relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer text-center
                    ${
                      isDragging
                        ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.05]'
                        : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))/0.5] hover:bg-[rgb(var(--color-surface))]'
                    }
                `}
      >
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`p-3 rounded-full ${isDragging ? 'bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))]' : 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))]'}`}
          >
            <Upload size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-[rgb(var(--color-text))]">
              <span className="text-[rgb(var(--color-primary))]">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
              SVG, PNG, JPG or GIF (max. {maxSize / 1024 / 1024}MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Progress List */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          {uploadingFiles.map((upload) => (
            <div
              key={upload.id}
              className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg p-3 flex items-center gap-3 shadow-sm"
            >
              <div className="p-2 bg-[rgb(var(--color-background))] rounded-lg">
                <File size={20} className="text-[rgb(var(--color-text-muted))]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-[rgb(var(--color-text))] truncate">
                    {upload.file.name}
                  </p>
                  <span
                    className={`text-xs ${upload.status === 'error' ? 'text-red-500' : 'text-[rgb(var(--color-text-muted))]'}`}
                  >
                    {upload.status === 'error' ? 'Failed' : `${upload.progress}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[rgb(var(--color-background))] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${upload.status === 'error' ? 'bg-red-500' : 'bg-[rgb(var(--color-primary))]'}`}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
              {upload.status === 'uploading' && (
                <button className="text-[rgb(var(--color-text-muted))] hover:text-red-500">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
