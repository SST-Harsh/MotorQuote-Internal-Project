import React, { useEffect, useState } from 'react';
import { X, FileText, Clock, Download, Upload } from 'lucide-react';
import fileService from '@/services/fileService';
import Swal from 'sweetalert2';

const FileVersionsModal = ({ file, onClose, onVersionUpload }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = React.useCallback(async () => {
    try {
      const data = await fileService.getFileVersions(file.id);
      setVersions(data || []);
    } catch (error) {
      console.error('Failed to load versions', error);
      // Mock data if API fails/is missing
      // setVersions([
      //     { id: 1, version: 1, created_at: new Date().toISOString(), size: file.size },
      // ]);
    } finally {
      setLoading(false);
    }
  }, [file.id]); // Add file.id dependency

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleUploadNewVersion = async (e) => {
    const newFile = e.target.files[0];
    if (!newFile) return;

    const formData = new FormData();
    formData.append('file', newFile);

    try {
      await fileService.uploadVersion(file.id, formData);
      Swal.fire('Success', 'New version uploaded', 'success');
      fetchVersions();
      if (onVersionUpload) onVersionUpload();
    } catch (error) {
      Swal.fire('Error', 'Failed to upload new version', 'error');
    }
  };

  const handleDownloadVersion = async (v) => {
    try {
      const blob = await fileService.downloadFile(v.id);
      const fileName = fileService.resolveFileName(file, v);
      fileService.saveBlobAsFile(blob, fileName);
    } catch (error) {
      console.error('Download failed', error);
      Swal.fire('Error', 'Failed to download this version', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[rgb(var(--color-surface))] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-background))]/50">
          <div>
            <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Version History</h3>
            <p className="text-xs text-[rgb(var(--color-text-muted))] truncate max-w-[300px]">
              {file.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[rgb(var(--color-text))]">
              Current Versions
            </span>
            <label className="cursor-pointer text-xs font-medium text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <Upload size={14} /> Upload New Version
              <input type="file" className="hidden" onChange={handleUploadNewVersion} />
            </label>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[rgb(var(--color-primary))]"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-[rgb(var(--color-text-muted))]">
              <Clock size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No history found for this file.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id || index}
                  className="flex items-center justify-between p-3 rounded-xl border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-border-hover))] hover:bg-[rgb(var(--color-background))] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] flex items-center justify-center text-xs font-bold">
                      v{version.version_number || version.version || versions.length - index}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--color-text))]">
                        {new Date(version.created_at).toLocaleDateString()}
                        <span className="text-[rgb(var(--color-text-muted))] mx-1">•</span>
                        <span className="text-xs font-normal text-[rgb(var(--color-text-muted))]">
                          {new Date(version.created_at).toLocaleTimeString()}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[rgb(var(--color-text-muted))]">
                          {(version.size / 1024).toFixed(1)} KB
                        </span>
                        {version.created_by && (
                          <>
                            <span className="text-[rgb(var(--color-text-muted))] opacity-30">
                              •
                            </span>
                            <span className="text-xs text-[rgb(var(--color-text-muted))] italic">
                              By {version.creator?.name || version.created_by_name || 'System'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5 rounded-lg transition-colors"
                    title="Download this version"
                    onClick={() => handleDownloadVersion(version)}
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileVersionsModal;
