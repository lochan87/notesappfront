import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { noteApi, Note } from '../services/api';

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
      setDatesModified({
        createdAt: false,
        lastModified: false
      });
      setSelectedImages([]);
      setImagesToRemove([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;

    if (!window.confirm(`Are you sure you want to delete "${note.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await noteApi.delete(note._id);
      navigate(`/folder/${(note.folderId as any)._id || note.folderId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete note. Please try again.');
      setIsDeleting(false);
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
    const currentDateTime = formatDateForInput(now.toISOString());
    setEditData(prev => ({ 
      ...prev, 
      lastModified: currentDateTime 
    }));
    setDatesModified(prev => ({ 
      ...prev, 
      lastModified: true 
    }));
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
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    const currentImageCount = (note?.images.length || 0) - imagesToRemove.length + selectedImages.length;
    if (currentImageCount + validFiles.length > 5) {
      alert('You can only have up to 5 images per note');
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

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

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
  };

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
                      onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
                      maxLength={10000}
                      disabled={isSaving}
                      placeholder="Write your note content here... URLs will automatically become clickable links."
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
                    <div key={index} className="col-6">
                      <div className="position-relative">
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

      {/* Image Modal */}
      {showImageModal && note.images && note.images.length > 0 && (
        <>
          <div 
            className="modal-backdrop fade show" 
            onClick={() => setShowImageModal(false)}
          ></div>
          <div 
            className="modal fade show d-block" 
            tabIndex={-1} 
            style={{ zIndex: 1055 }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {note.images[selectedImageIndex]?.originalName}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowImageModal(false)}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <img
                    src={note.images[selectedImageIndex]?.data}
                    alt={note.images[selectedImageIndex]?.originalName}
                    className="img-fluid rounded"
                    style={{ maxHeight: '70vh' }}
                    onError={(e) => {
                      console.error('Failed to load image in modal:', note.images[selectedImageIndex]?.originalName);
                    }}
                  />
                  
                  {note.images.length > 1 && (
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-secondary me-2"
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === 0 ? note.images.length - 1 : prev - 1
                        )}
                      >
                        <i className="bi bi-chevron-left"></i> Previous
                      </button>
                      <span className="mx-2">
                        {selectedImageIndex + 1} of {note.images.length}
                      </span>
                      <button
                        className="btn btn-outline-secondary ms-2"
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === note.images.length - 1 ? 0 : prev + 1
                        )}
                      >
                        Next <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NoteView;
