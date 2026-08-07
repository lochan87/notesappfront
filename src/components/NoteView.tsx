import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { noteApi, Note } from '../services/api';
import ConfirmModal from './ConfirmModal';
import Toast, { useToast } from './Toast';

const NoteView: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // State for editing note data including dates
  const [editData, setEditData] = useState({
    title: '',
    content: '',
    tags: '',
    isPinned: false,
    createdAt: '',
    lastModified: ''
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [datesModified, setDatesModified] = useState({
    createdAt: false,
    lastModified: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);
  const { toasts, addToast, dismissToast } = useToast();

  // ── Image zoom / pan state ───────────────────────────────────────────────
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  const loadNote = useCallback(async () => {
    try {
      if (!noteId) return;
      const data = await noteApi.getById(noteId);
      setNote(data);
      setEditData({
        title: data.title,
        content: data.content,
        tags: data.tags.join(', '),
        isPinned: data.isPinned,
        createdAt: formatDateForInput(data.mainCreatedAt || data.createdAt),
        lastModified: formatDateForInput(data.mainLastModified || data.lastModified)
      });
      setDatesModified({
        createdAt: false,
        lastModified: false
      });
      setError('');
    } catch (err) {
      console.error('Error loading note:', err);
      setError('Failed to load note.');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId, loadNote]);

  const handleSave = async () => {
    if (!note || !editData.title.trim() || !editData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      // Process tags
      const tags = editData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const updateData: any = {
        title: editData.title.trim(),
        content: editData.content.trim(),
        tags,
        isPinned: editData.isPinned,
        images: selectedImages,
        removeImages: imagesToRemove
      };

      // Only send custom dates if they were actually modified by the user
      if (datesModified.createdAt) {
        updateData.customCreatedAt = editData.createdAt;
      }
      
      if (datesModified.lastModified) {
        updateData.customLastModified = editData.lastModified;
      }

      const updatedNote = await noteApi.update(note._id, updateData);

      setNote(updatedNote);
      setIsEditing(false);
      setDatesModified({ createdAt: false, lastModified: false });
      setSelectedImages([]);
      setImagesToRemove([]);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Show brief success toast
      addToast('Note saved successfully', 'success', 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!note) return;
    try {
      setIsDeleting(true);
      await noteApi.delete(note._id);
      navigate(`/folder/${(note.folderId as any)._id || note.folderId}`);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete note', 'error');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleTogglePin = async () => {
    if (!note) return;

    try {
      const updatedNote = await noteApi.togglePin(note._id);
      setNote(updatedNote);
      setEditData(prev => ({ ...prev, isPinned: updatedNote.isPinned }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update note. Please try again.');
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    // Automatically set the current date and time for lastModified field using local time
    const now = new Date();
    // Create local datetime string in the correct format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setEditData(prev => ({ 
      ...prev, 
      lastModified: currentDateTime 
    }));
    setDatesModified(prev => ({ 
      ...prev, 
      lastModified: true 
    }));
    console.log('Setting edit time to:', currentDateTime, 'for current time:', now.toLocaleString());
  };

  const handleEditCancel = () => {
    if (!note) return;
    
    setEditData({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
      isPinned: note.isPinned,
      createdAt: formatDateForInput(note.mainCreatedAt || note.createdAt),
      lastModified: formatDateForInput(note.mainLastModified || note.lastModified)
    });
    setDatesModified({
      createdAt: false,
      lastModified: false
    });
    setSelectedImages([]);
    setImagesToRemove([]);
    setIsEditing(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        addToast(`${file.name} is not an image file`, 'error');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        addToast(`${file.name} is too large. Max size is 5 MB`, 'error');
        return false;
      }
      return true;
    });

    const currentImageCount = (note?.images.length || 0) - imagesToRemove.length + selectedImages.length;
    if (currentImageCount + validFiles.length > 5) {
      addToast('You can only have up to 5 images per note', 'warning');
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (filename: string) => {
    setImagesToRemove(prev => [...prev, filename]);
  };

  const restoreExistingImage = (filename: string) => {
    setImagesToRemove(prev => prev.filter(f => f !== filename));
  };

  const getImagePreview = (file: File): string => URL.createObjectURL(file);

  // Drag-to-reorder existing images
  const handleImageDragStart = (index: number) => setDragImageIndex(index);
  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragImageIndex === null || dragImageIndex === index || !note) return;
    const imgs = [...note.images];
    const [moved] = imgs.splice(dragImageIndex, 1);
    imgs.splice(index, 0, moved);
    setNote(prev => prev ? { ...prev, images: imgs } : prev);
    setDragImageIndex(index);
  };
  const handleImageDragEnd = () => setDragImageIndex(null);

  // Copy note content to clipboard
  const handleCopyContent = async () => {
    if (!note) return;
    try {
      await navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
      addToast('Copied to clipboard', 'success', 2000);
    } catch {
      addToast('Copy failed — please select and copy manually', 'error');
    }
  };

  // Print note
  const handlePrint = () => window.print();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContentWithLinks = (content: string) => {
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split content by URLs and map to JSX elements
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-decoration-none"
            style={{ wordBreak: 'break-all' }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const changeModalImage = (newIndex: number) => {
    setSelectedImageIndex(newIndex);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(5, parseFloat((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel(prev => {
    const next = parseFloat((prev - 0.25).toFixed(2));
    if (next <= 1) { setPanOffset({ x: 0, y: 0 }); return 1; }
    return next;
  });
  const handleZoomReset = () => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); };

  // NOTE: We do NOT use React's onWheel synthetic event here because React
  // registers wheel listeners as *passive* by default (since React 17+),
  // which means e.preventDefault() inside onWheel has no effect and the
  // page continues to scroll. Instead, we attach a native non-passive
  // listener directly to the container DOM node via useEffect.
  const handleZoomDelta = useCallback((delta: number) => {
    setZoomLevel(prev => {
      const next = parseFloat((prev + delta).toFixed(2));
      if (next <= 1) { setPanOffset({ x: 0, y: 0 }); return 1; }
      return Math.min(5, next);
    });
  }, []);

  // Non-passive native wheel listener — prevents page scroll during zoom
  useEffect(() => {
    const container = zoomContainerRef.current;
    if (!container || !showImageModal) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();        // stops page from scrolling
      e.stopPropagation();
      handleZoomDelta(e.deltaY < 0 ? 0.15 : -0.15);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [showImageModal, handleZoomDelta]);

  // Lock body scroll while the image modal is open so the note behind
  // can't be scrolled via touch or keyboard
  useEffect(() => {
    if (showImageModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
    // Always clean up on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [showImageModal]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: panOffset.x, panY: panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPanOffset({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  // Keyboard shortcuts for the zoom modal
  useEffect(() => {
    if (!showImageModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeImageModal(); return; }
      if (e.key === '+' || e.key === '=') { handleZoomIn(); return; }
      if (e.key === '-') { handleZoomOut(); return; }
      if (e.key === '0') { handleZoomReset(); return; }
      if (e.key === 'ArrowLeft' && note?.images && note.images.length > 1) {
        changeModalImage(selectedImageIndex === 0 ? note.images.length - 1 : selectedImageIndex - 1);
      }
      if (e.key === 'ArrowRight' && note?.images && note.images.length > 1) {
        changeModalImage(selectedImageIndex === note.images.length - 1 ? 0 : selectedImageIndex + 1);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showImageModal, selectedImageIndex, zoomLevel, panOffset]);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading note...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="bi bi-file-text-x text-muted" style={{ fontSize: '4rem' }}></i>
          <h4 className="text-muted mt-3">Note not found</h4>
          <Link to="/" className="btn btn-primary mt-3">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const folderData = typeof note.folderId === 'object' ? note.folderId : null;

  return (
    <>
    <div className="container-fluid py-4 note-view">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/" className="text-decoration-none">
                  <i className="bi bi-house me-1"></i>
                  Dashboard
                </Link>
              </li>
              {folderData && (
                <li className="breadcrumb-item">
                  <Link 
                    to={`/folder/${folderData._id}`} 
                    className="text-decoration-none"
                  >
                    {folderData.name}
                  </Link>
                </li>
              )}
              <li className="breadcrumb-item active" aria-current="page">
                {note.title}
              </li>
            </ol>
          </nav>

          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center">
            <div className="d-flex align-items-center mb-3 mb-lg-0">
              {note.isPinned && (
                <i className="bi bi-pin-fill text-warning me-3" style={{ fontSize: '1.5rem' }}></i>
              )}
              <div>
                <h1 className="h3 mb-1">{note.title}</h1>
                <p className="text-muted mb-0">
                  Created {formatDate(note.mainCreatedAt || note.createdAt)} • 
                  Last modified {formatDate(note.mainLastModified || note.lastModified)}
                </p>
              </div>
            </div>
            
            <div className="btn-group btn-group-sm d-flex justify-content-start gap-2">
              {!isEditing ? (
                <>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleCopyContent}
                    title="Copy note content to clipboard"
                  >
                    <i className="bi bi-clipboard me-2" />
                    Copy
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handlePrint}
                    title="Print this note"
                  >
                    <i className="bi bi-printer me-2" />
                    Print
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleTogglePin}
                    title={note.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    <i className={`bi ${note.isPinned ? 'bi-pin' : 'bi-pin-fill'} me-2`}></i>
                    Pin
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleStartEdit}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Edit
                  </button>
                  <button
                    className="btn btn-outline-danger"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <>
                        <i className="bi bi-trash me-2"></i>
                        Delete
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={handleEditCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving || !editData.title.trim() || !editData.content.trim()}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Save
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="row mb-4">
          <div className="col">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Note Content */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              {isEditing ? (
                <>
                  <div className="mb-3">
                    <label htmlFor="editTitle" className="form-label fw-semibold">
                      Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="editTitle"
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      maxLength={200}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editContent" className="form-label fw-semibold">
                      Content
                    </label>
                    <textarea
                      className="form-control"
                      id="editContent"
                      rows={15}
                      value={editData.content}
                      onChange={(e) => {
                        setEditData(prev => ({ ...prev, content: e.target.value }));
                        // Auto-grow: expand height to fit content (mobile-friendly)
                        const el = e.target;
                        el.style.height = 'auto';
                        el.style.height = `${el.scrollHeight}px`;
                      }}
                      maxLength={10000}
                      disabled={isSaving}
                      placeholder="Write your note content here… URLs will automatically become clickable links."
                      style={{ minHeight: '280px', resize: 'vertical' }}
                    />
                    <div className="form-text">
                      {editData.content.length}/10,000 characters • URLs will be automatically converted to clickable links
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editTags" className="form-label fw-semibold">
                      Tags
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="editTags"
                      value={editData.tags}
                      onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="Enter tags separated by commas (e.g., work, important, ideas)"
                      disabled={isSaving}
                    />
                    <div className="form-text">Separate multiple tags with commas</div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="editCreatedAt" className="form-label fw-semibold">
                        Created Date
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="editCreatedAt"
                        value={editData.createdAt}
                        onChange={(e) => {
                          setEditData(prev => ({ ...prev, createdAt: e.target.value }));
                          setDatesModified(prev => ({ ...prev, createdAt: true }));
                        }}
                        disabled={isSaving}
                      />
                      <div className="form-text">When this note was originally created</div>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="editLastModified" className="form-label fw-semibold">
                        Last Modified Date
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="editLastModified"
                        value={editData.lastModified}
                        onChange={(e) => {
                          setEditData(prev => ({ ...prev, lastModified: e.target.value }));
                          setDatesModified(prev => ({ ...prev, lastModified: true }));
                        }}
                        disabled={isSaving}
                      />
                      <div className="form-text">When this note was last updated</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editPinned"
                        checked={editData.isPinned}
                        onChange={(e) => setEditData(prev => ({ ...prev, isPinned: e.target.checked }))}
                        disabled={isSaving}
                      />
                      <label className="form-check-label" htmlFor="editPinned">
                        <i className="bi bi-pin me-1"></i>
                        Pin this note
                      </label>
                    </div>
                  </div>

                  {/* Save/Cancel buttons at bottom of form */}
                  <div className="d-flex gap-2 justify-content-end border-top pt-3 mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleEditCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={isSaving || !editData.title.trim() || !editData.content.trim()}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {renderContentWithLinks(note.content)}
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-muted mb-2">Tags</h6>
                      {note.tags.map(tag => (
                        <span key={tag} className="badge bg-secondary me-2 mb-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Images Section */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-transparent">
              <h6 className="card-title mb-0">
                <i className="bi bi-images me-2"></i>
                Images
                {isEditing && (
                  <span className="ms-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control form-control-sm"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={isSaving}
                    />
                  </span>
                )}
              </h6>
            </div>
            <div className="card-body">
              {note.images && note.images.length > 0 ? (
                <div className="row g-2">
                  {note.images.map((image, index) => (
                    <div
                      key={index}
                      className={`col-6 drag-image-thumb ${dragImageIndex === index ? 'dragging-over' : ''}`}
                      draggable={isEditing}
                      onDragStart={() => isEditing && handleImageDragStart(index)}
                      onDragOver={(e) => isEditing && handleImageDragOver(e, index)}
                      onDragEnd={handleImageDragEnd}
                    >
                      <div className="position-relative">
                        {isEditing && (
                          <div className="drag-handle-hint">
                            <i className="bi bi-grip-vertical" /> drag
                          </div>
                        )}
                        <img
                          src={image.data}
                          alt={image.originalName}
                          className={`img-fluid rounded cursor-pointer ${imagesToRemove.includes(image.filename) ? 'opacity-50' : ''}`}
                          style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                          onClick={() => !isEditing && openImageModal(index)}
                          onError={(e) => {
                            console.error('Failed to load image:', image.originalName);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          loading="lazy"
                        />
                        {isEditing && (
                          <div className="position-absolute top-0 end-0 p-1">
                            {imagesToRemove.includes(image.filename) ? (
                              <button
                                type="button"
                                className="btn btn-success btn-sm rounded-circle"
                                onClick={() => restoreExistingImage(image.filename)}
                                disabled={isSaving}
                                title="Restore image"
                              >
                                <i className="bi bi-arrow-clockwise"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm rounded-circle"
                                onClick={() => removeExistingImage(image.filename)}
                                disabled={isSaving}
                                title="Remove image"
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* New images in edit mode */}
                  {isEditing && selectedImages.map((file, index) => (
                    <div key={`new-${index}`} className="col-6">
                      <div className="position-relative">
                        <img
                          src={getImagePreview(file)}
                          alt={`New ${index + 1}`}
                          className="img-fluid rounded"
                          style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                        />
                        <div className="position-absolute top-0 end-0 p-1">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm rounded-circle"
                            onClick={() => removeNewImage(index)}
                            disabled={isSaving}
                            title="Remove new image"
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">No images</p>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-transparent">
              <h6 className="card-title mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Note Information
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted d-block">Folder</small>
                {folderData ? (
                  <Link 
                    to={`/folder/${folderData._id}`}
                    className="text-decoration-none"
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded me-2"
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: folderData.color,
                        }}
                      ></div>
                      {folderData.name}
                    </div>
                  </Link>
                ) : (
                  'Unknown folder'
                )}
              </div>
              
              <div className="mb-3">
                <small className="text-muted d-block">Created</small>
                {formatDate(note.mainCreatedAt || note.createdAt)}
              </div>
              
              <div className="mb-3">
                <small className="text-muted d-block">Last Modified</small>
                {formatDate(note.mainLastModified || note.lastModified)}
              </div>

              {/* Date History Section */}
              {note.customCreatedDates && note.customCreatedDates.length > 1 && (
                <div className="mb-3">
                  <small className="text-muted d-block">Created Date History</small>
                  <div className="small">
                    {note.customCreatedDates.slice().reverse().map((entry, index) => (
                      <div key={index} className={index === 0 ? 'fw-bold' : 'text-muted'}>
                        {formatDate(entry.date)} {index === 0 && '(current)'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {note.customLastModifiedDates && note.customLastModifiedDates.length > 1 && (
                <div className="mb-3">
                  <small className="text-muted d-block">Modified Date History</small>
                  <div className="small">
                    {note.customLastModifiedDates.slice().reverse().map((entry, index) => (
                      <div key={index} className={index === 0 ? 'fw-bold' : 'text-muted'}>
                        {formatDate(entry.date)} {index === 0 && '(current)'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <small className="text-muted d-block">Status</small>
                {note.isPinned ? (
                  <span className="badge bg-warning">
                    <i className="bi bi-pin-fill me-1"></i>
                    Pinned
                  </span>
                ) : (
                  <span className="badge bg-secondary">Normal</span>
                )}
              </div>

              {note.images && note.images.length > 0 && (
                <div>
                  <small className="text-muted d-block">Images</small>
                  {note.images.length} image{note.images.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal — with full zoom & pan */}
      {showImageModal && note.images && note.images.length > 0 && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={closeImageModal}
          />
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">

                {/* Modal header with filename + zoom controls */}
                <div className="modal-header flex-wrap gap-2">
                  <h5 className="modal-title text-truncate" style={{ maxWidth: '55%' }}>
                    {note.images[selectedImageIndex]?.originalName}
                  </h5>

                  {/* Zoom toolbar */}
                  <div className="d-flex align-items-center gap-1 ms-auto me-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1}
                      title="Zoom out (-)" 
                    >
                      <i className="bi bi-zoom-out" />
                    </button>
                    <span className="zoom-level-badge">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 5}
                      title="Zoom in (+)" 
                    >
                      <i className="bi bi-zoom-in" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleZoomReset}
                      disabled={zoomLevel === 1}
                      title="Reset zoom (0)"
                    >
                      <i className="bi bi-aspect-ratio" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeImageModal}
                    aria-label="Close"
                  />
                </div>

                {/* Zoomable image area */}
                <div className="modal-body p-2">
                  <div
                    ref={zoomContainerRef}
                    className={`image-zoom-container ${
                      zoomLevel > 1 ? 'zoomed' : ''
                    } ${isDragging ? 'dragging' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={note.images[selectedImageIndex]?.data}
                      alt={note.images[selectedImageIndex]?.originalName}
                      className="image-zoom-img"
                      style={{
                        transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`
                      }}
                      draggable={false}
                      onError={() => {
                        console.error('Failed to load image in modal:', note.images[selectedImageIndex]?.originalName);
                      }}
                    />
                  </div>

                  {/* Navigation controls */}
                  {note.images.length > 1 && (
                    <div className="zoom-controls mt-3">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => changeModalImage(
                          selectedImageIndex === 0 ? note.images.length - 1 : selectedImageIndex - 1
                        )}
                        title="Previous (←)"
                      >
                        <i className="bi bi-chevron-left" /> Previous
                      </button>
                      <span className="text-muted small">
                        {selectedImageIndex + 1} / {note.images.length}
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => changeModalImage(
                          selectedImageIndex === note.images.length - 1 ? 0 : selectedImageIndex + 1
                        )}
                        title="Next (→)"
                      >
                        Next <i className="bi bi-chevron-right" />
                      </button>
                    </div>
                  )}

                  <p className="text-muted text-center small mt-2 mb-0">
                    <i className="bi bi-info-circle me-1" />
                    Scroll to zoom • Drag to pan when zoomed • +/−/0 keys • ←/→ to navigate
                  </p>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        show={showDeleteConfirm}
        title="Delete Note"
        message={`Are you sure you want to delete "${note?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default NoteView;
