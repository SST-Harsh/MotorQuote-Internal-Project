import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  List as ListIcon,
  Search,
  RefreshCw,
  FolderPlus,
  Share2,
  History,
} from 'lucide-react';
import fileService from '@/services/fileService';
import UploadDropzone from './UploadDropzone';
import FileBrowser from './FileBrowser';
import FileVersionsModal from './FileVersionsModal';
import FileShareModal from './FileShareModal';
import FileDetailsModal from './FileDetailsModal';
import Swal from 'sweetalert2';

const FileManager = ({
  context = 'global', // 'global', 'quote', 'dealership', 'user'
  contextId = null,
  allowUpload = true,
  initialViewMode = 'grid',
  title = 'Documents',
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [versioningFile, setVersioningFile] = useState(null);
  const [sharingFile, setSharingFile] = useState(null);
  const [detailFile, setDetailFile] = useState(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fileService.getFiles({ context, context_id: contextId });
      // Handle both structure: { files: [], pagination: {} } OR direct array OR { data: [] }
      const fileList = result.files || result.data || (Array.isArray(result) ? result : []);
      setFiles(fileList);
    } catch (error) {
      console.error('Failed to load files', error);
      Swal.fire('Error', 'Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  }, [context, contextId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadComplete = (newFile) => {
    setFiles((prev) => [newFile, ...prev]);
    Swal.fire({
      icon: 'success',
      title: 'File Uploaded',
      text: `${newFile.name} added successfully`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  };

  const handleFileAction = async (action, file) => {
    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Delete File?',
        text: `Are you sure you want to delete ${file.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Delete',
      });

      if (result.isConfirmed) {
        try {
          await fileService.deleteFile(file.id);
          setFiles((prev) => prev.filter((f) => f.id !== file.id));
          Swal.fire('Deleted!', 'File has been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error', 'Failed to delete file', 'error');
        }
      }
    } else if (action === 'download') {
      try {
        const blob = await fileService.downloadFile(file.id);
        const fileName = fileService.resolveFileName(file);
        fileService.saveBlobAsFile(blob, fileName);
      } catch (error) {
        console.error('Download failed', error);
        Swal.fire('Error', 'Failed to download file', 'error');
      }
    } else if (action === 'rename') {
      const { value: newName } = await Swal.fire({
        title: 'Rename File',
        input: 'text',
        inputValue: file.name,
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) return 'You need to write something!';
        },
      });

      if (newName && newName !== (file.name || file.filename)) {
        try {
          await fileService.updateFile(file.id, {
            filename: newName,
            accessLevel: file.access_level || file.accessLevel || 'private',
          });
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, name: newName, filename: newName } : f))
          );
          Swal.fire('Renamed!', 'File has been renamed.', 'success');
        } catch (error) {
          Swal.fire('Error', 'Failed to rename file', 'error');
        }
      }
    } else if (action === 'details') {
      handleFileClick(file);
    } else if (action === 'share') {
      setSharingFile(file);
    } else if (action === 'preview') {
      // Preview images and PDFs by fetching from API
      const fileType = (file.type || file.mime_type || '').toLowerCase();
      // ... (rest of the preview logic)

      if (fileType.startsWith('image/')) {
        try {
          // Show loading indicator
          Swal.fire({
            title: 'Loading preview...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // Fetch the file from API
          const response = await fileService.downloadFile(file.id);

          // Create blob URL from response
          let blob;
          if (response instanceof Blob) {
            blob = response;
          } else if (response.data instanceof Blob) {
            blob = response.data;
          } else {
            throw new Error('Invalid response format');
          }

          const imageUrl = URL.createObjectURL(blob);

          // Display image in modal
          Swal.fire({
            title: file.name,
            imageUrl: imageUrl,
            imageAlt: file.name,
            showCloseButton: true,
            showConfirmButton: false,
            width: '80%',
            customClass: {
              image: 'max-h-[70vh] object-contain',
            },
            willClose: () => {
              // Clean up blob URL when modal closes
              URL.revokeObjectURL(imageUrl);
            },
          });
        } catch (error) {
          console.error('Failed to preview image:', error);
          Swal.fire('Error', 'Failed to load image preview', 'error');
        }
      } else if (fileType.includes('pdf')) {
        try {
          // Fetch PDF from API
          const response = await fileService.downloadFile(file.id);

          let blob;
          if (response instanceof Blob) {
            blob = response;
          } else if (response.data instanceof Blob) {
            blob = response.data;
          } else {
            throw new Error('Invalid response format');
          }

          const pdfUrl = URL.createObjectURL(blob);
          window.open(pdfUrl, '_blank');

          // Clean up after a delay (PDF viewer needs time to load)
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
        } catch (error) {
          console.error('Failed to preview PDF:', error);
          Swal.fire('Error', 'Failed to load PDF preview', 'error');
        }
      } else {
        Swal.fire(
          'Info',
          'Preview not available for this file type. Please download to view.',
          'info'
        );
      }
    } else if (action === 'versions') {
      setVersioningFile(file);
    }
  };

  const handleFileClick = async (file) => {
    setFetchingDetail(true);
    try {
      const data = await fileService.getFileById(file.id);
      // API might wrap in { data: {} } or { file: {} }
      const fullFile = data.data || data.file || data;
      setDetailFile(fullFile);
    } catch (error) {
      console.error('Failed to fetch file details:', error);
      // Fallback to basic info if full fetch fails
      setDetailFile(file);
    } finally {
      setFetchingDetail(false);
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = (file.filename || '').toLowerCase().includes(searchTerm.toLowerCase());
    const fileType = file.type || file.mime_type || '';
    const matchesType =
      selectedType === 'all'
        ? true
        : selectedType === 'images'
          ? fileType.startsWith('image/')
          : selectedType === 'documents'
            ? !fileType.startsWith('image/')
            : true;

    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-[rgb(var(--color-border))] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">{title}</h3>
          <span className="bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] text-xs px-2 py-0.5 rounded-full">
            {files.length}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 md:justify-end">
          <div className="relative group flex-1 md:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] group-focus-within:text-[rgb(var(--color-primary))] transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] transition-all outline-none"
            />
          </div>

          <div className="flex bg-[rgb(var(--color-background))] p-1 rounded-lg border border-[rgb(var(--color-border))]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[rgb(var(--color-surface))] shadow text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]]'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[rgb(var(--color-surface))] shadow text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>

          <button
            onClick={fetchFiles}
            className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-lg transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {allowUpload && (
            <div className="mb-6">
              <UploadDropzone
                onUploadComplete={handleUploadComplete}
                context={context}
                contextId={contextId}
              />
            </div>
          )}

          <div>
            {/* Filter Tabs */}
            <div className="flex items-center gap-4 mb-4 border-b border-[rgb(var(--color-border))] pb-2">
              {['all', 'images', 'documents'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`text-sm font-medium pb-2 -mb-2.5 transition-colors border-b-2 ${
                    selectedType === type
                      ? 'text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]'
                      : 'text-[rgb(var(--color-text-muted))] border-transparent hover:text-[rgb(var(--color-text))]'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
              </div>
            ) : (
              <FileBrowser
                files={filteredFiles}
                viewMode={viewMode}
                onFileAction={handleFileAction}
              />
            )}
          </div>
        </div>
        {/* Versions Modal */}
        {versioningFile && (
          <FileVersionsModal
            file={versioningFile}
            onClose={() => setVersioningFile(null)}
            onVersionUpload={fetchFiles}
          />
        )}
        {sharingFile && <FileShareModal file={sharingFile} onClose={() => setSharingFile(null)} />}
        {detailFile && (
          <FileDetailsModal
            file={detailFile}
            isOpen={!!detailFile}
            onClose={() => setDetailFile(null)}
          />
        )}
        {fetchingDetail && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <RefreshCw className="animate-spin text-[rgb(var(--color-primary))]" size={20} />
              <span className="text-sm font-bold text-[rgb(var(--color-text))]">
                Loading Details...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;
