import React, { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  MoreVertical,
  Download,
  Trash2,
  Edit2,
  Share2,
  File,
  RefreshCw,
  Info,
} from 'lucide-react';
import ActionMenuPortal from '../ActionMenuPortal';
import fileService from '@/services/fileService';

const ImageThumbnail = ({ file, className, isPublic = false, token = null }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadThumbnail = async () => {
      // Priority 1: Direct URL (if available) - append timestamp to bust cache if it's a remote URL
      if (file.url || file.thumbnail) {
        if (isMounted) {
          const url = file.url || file.thumbnail;
          // Append timestamp if it's not a data URL
          const bustCache = url.startsWith('data:')
            ? ''
            : `?t=${new Date(file.updated_at || Date.now()).getTime()}`;
          setImageUrl(`${url}${bustCache}`);
          setLoading(false);
        }
        return;
      }

      // Priority 2: Fetch from API if we have an ID
      if (file.id || token) {
        try {
          // Start loading state again when file updates
          if (isMounted) setLoading(true);

          let blob;
          if (isPublic && token) {
            blob = await fileService.downloadFile(token);
          } else {
            blob = await fileService.downloadFile(file.id);
          }
          objectUrl = URL.createObjectURL(blob);

          if (isMounted) {
            setImageUrl(objectUrl);
            setLoading(false);
          }
        } catch (error) {
          console.error('Failed to load thumbnail:', error);
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) setLoading(false);
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // Add updated_at to dependencies to trigger re-fetch on version update
  }, [file.id, file.url, file.thumbnail, file.updated_at, isPublic, token]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-[rgb(var(--color-background))] ${className}`}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[rgb(var(--color-primary))]"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-[rgb(var(--color-background))] ${className}`}
      >
        <FileIcon type={file.type || file.mime_type} className="w-8 h-8" />
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={imageUrl} alt={file.name} className={`object-cover ${className}`} />
  );
};

const FileIcon = ({ type, className = '' }) => {
  const fileType = (type || '').toLowerCase();

  if (fileType.includes('pdf'))
    return <FileText className={`text-[rgb(var(--color-error))] ${className}`} />;
  if (fileType.startsWith('image/'))
    return <ImageIcon className={`text-[rgb(var(--color-primary))] ${className}`} />;
  if (fileType.startsWith('video/'))
    return <Film className={`text-[rgb(var(--color-error))] ${className}`} />;
  if (fileType.startsWith('audio/'))
    return <Music className={`text-[rgb(var(--color-info))] ${className}`} />;
  if (fileType.includes('spreadsheet') || fileType.includes('excel'))
    return <FileText className={`text-[rgb(var(--color-success))] ${className}`} />;
  if (fileType.includes('word') || fileType.includes('document'))
    return <FileText className={`text-[rgb(var(--color-info))] ${className}`} />;
  return <File className={`text-[rgb(var(--color-text-muted))] ${className}`} />;
};

const getFileName = (file) => {
  return (
    file.name ||
    file.display_name ||
    file.file_name ||
    file.filename ||
    file.original_name ||
    'Document'
  );
};

const FileBrowser = ({
  files,
  viewMode = 'grid',
  onFileAction,
  onFileClick,
  isPublic = false,
  token = null,
}) => {
  const [menuState, setMenuState] = useState({ isOpen: false, triggerRect: null, file: null });

  const handleOpenMenu = (e, file) => {
    e.stopPropagation();
    const domRect = e.currentTarget.getBoundingClientRect();
    const rect = {
      top: domRect.top,
      bottom: domRect.bottom,
      left: domRect.left,
      right: domRect.right,
      width: domRect.width,
      height: domRect.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };

    setMenuState({
      isOpen: true,
      triggerRect: rect,
      align: 'end',
      file,
    });
  };

  const handleCloseMenu = () => {
    setMenuState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAction = (action) => {
    if (menuState.file) {
      onFileAction(action, menuState.file);
    }
    handleCloseMenu();
  };

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-[rgb(var(--color-background))] p-4 rounded-full mb-3">
          <File className="text-[rgb(var(--color-text-muted))] h-8 w-8" />
        </div>
        <h3 className="text-[rgb(var(--color-text))] font-medium">No files found</h3>
        <p className="text-[rgb(var(--color-text-muted))] text-sm mt-1">
          Upload a file to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      {viewMode === 'list' ? (
        <div className="overflow-hidden bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))]">
          <table className="min-w-full divide-y divide-[rgb(var(--color-border))]">
            <thead className="bg-[rgb(var(--color-background))]">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider hidden sm:table-cell"
                >
                  Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider hidden md:table-cell"
                >
                  Uploaded
                </th>
                {!isPublic && (
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-[rgb(var(--color-surface))] divide-y divide-[rgb(var(--color-border))]">
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-[rgb(var(--color-background))] transition-colors cursor-pointer"
                  onClick={() => onFileClick && onFileClick(file)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-[rgb(var(--color-background))] rounded-lg flex items-center justify-center overflow-hidden">
                        {(file.type || file.mime_type || '').toLowerCase().startsWith('image/') ? (
                          <ImageThumbnail
                            file={file}
                            className="h-10 w-10 rounded-lg"
                            isPublic={isPublic}
                            token={token}
                          />
                        ) : (
                          <FileIcon type={file.type || file.mime_type} />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-[rgb(var(--color-text))]">
                          {getFileName(file)}
                        </div>
                        <div className="text-sm text-[rgb(var(--color-text-muted))] sm:hidden">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--color-text-muted))] hidden sm:table-cell">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--color-text-muted))] hidden md:table-cell">
                    {new Date(file.updated_at || file.created_at).toLocaleDateString()}
                  </td>
                  {!isPublic && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onFileAction('download', file)}
                          className="p-1.5 hover:bg-[rgb(var(--color-background))] rounded-md text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={(e) => handleOpenMenu(e, file)}
                          className="p-1.5 hover:bg-[rgb(var(--color-background))] rounded-md text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] hover:shadow-md transition-all overlow-hidden"
            >
              <div
                className="aspect-square w-full bg-[rgb(var(--color-background))] relative overflow-hidden rounded-t-xl cursor-pointer"
                onClick={() => onFileClick && onFileClick(file)}
              >
                {(file.type || file.mime_type || '').toLowerCase().startsWith('image/') ? (
                  <ImageThumbnail
                    file={file}
                    className="w-full h-full transition-transform group-hover:scale-105"
                    isPublic={isPublic}
                    token={token}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileIcon type={file.type || file.mime_type} className="w-12 h-12" />
                  </div>
                )}
                {!isPublic && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileAction('download', file);
                      }}
                      className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileAction('delete', file);
                      }}
                      className="p-2 bg-white/20 hover:bg-red-500/80 rounded-full text-white backdrop-blur-sm transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4
                  className="text-sm font-medium text-[rgb(var(--color-text))] truncate"
                  title={getFileName(file)}
                >
                  {getFileName(file)}
                </h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-[rgb(var(--color-text-muted))]">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={(e) => handleOpenMenu(e, file)}
                    className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] sm:hidden"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ActionMenuPortal
        isOpen={menuState.isOpen}
        onClose={handleCloseMenu}
        triggerRect={menuState.triggerRect}
        align={menuState.align}
      >
        <div className="py-1">
          <button
            onClick={() => handleAction('preview')}
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <ImageIcon size={14} /> Preview
          </button>
          <button
            onClick={() => handleAction('details')}
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <Info size={14} /> View Details
          </button>
          <button
            onClick={() => handleAction('share')}
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={() => handleAction('versions')}
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <RefreshCw size={14} /> History
          </button>
          <button
            onClick={() => handleAction('rename')}
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <Edit2 size={14} /> Rename
          </button>
          <div className="border-t border-[rgb(var(--color-border))] my-1"></div>
          <button
            onClick={() => handleAction('delete')}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </ActionMenuPortal>
    </>
  );
};

export default FileBrowser;
