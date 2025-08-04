import React, { useState, useRef } from 'react';
import { noteApi, Note } from '../services/api';

interface CreateNoteModalProps {
  show: boolean;
  onHide: () => void;
  onNoteCreated: (note: Note) => void;
  folderId: string;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ 
  show, 
  onHide, 
  onNoteCreated, 
  folderId 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    isPinned: false
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Note title is required');
      return;
    }

    if (!formData.content.trim()) {
      setError('Note content is required');
      return;
    }

    try {
      setLoading(true);
      
      // Process tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const newNote = await noteApi.create({
        title: formData.title.trim(),
        content: formData.content.trim(),
        folderId,
        tags,
        isPinned: formData.isPinned,
        images: selectedImages
      });
      
      onNoteCreated(newNote);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      tags: '',
      isPinned: false
    });
    setSelectedImages([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleHide = () => {
    if (!loading) {
      resetForm();
      onHide();
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

    if (selectedImages.length + validFiles.length > 5) {
      alert('You can only upload up to 5 images per note');
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop fade show" 
        onClick={handleHide}
      ></div>

      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex={-1} 
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: '90vh' }}>
          <div className="modal-content" style={{ maxHeight: '90vh' }}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-file-text me-2"></i>
                Create New Note
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleHide}
                disabled={loading}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="noteTitle" className="form-label fw-semibold">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="noteTitle"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter note title"
                    maxLength={200}
                    disabled={loading}
                    autoFocus
                  />
                  <div className="form-text">
                    {formData.title.length}/200 characters
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="noteContent" className="form-label fw-semibold">
                    Content <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    id="noteContent"
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your note content here... URLs will automatically become clickable links."
                    maxLength={10000}
                    disabled={loading}
                  />
                  <div className="form-text">
                    {formData.content.length}/10,000 characters • URLs will be automatically converted to clickable links
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="noteTags" className="form-label fw-semibold">
                    Tags
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="noteTags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Enter tags separated by commas (e.g., work, important, ideas)"
                    disabled={loading}
                  />
                  <div className="form-text">
                    Separate multiple tags with commas
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Images</label>
                  
                  <div className="mb-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={loading || selectedImages.length >= 5}
                    />
                    <div className="form-text">
                      You can upload up to 5 images. Maximum size per image: 5MB.
                    </div>
                  </div>

                  {/* Image Previews */}
                  {selectedImages.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="position-relative">
                          <img
                            src={getImagePreview(file)}
                            alt={`Preview ${index + 1}`}
                            className="rounded border"
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover'
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle"
                            style={{ transform: 'translate(50%, -50%)' }}
                            onClick={() => removeImage(index)}
                            disabled={loading}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                          <div className="text-center mt-1">
                            <small className="text-muted">{file.name}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notePinned"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="notePinned">
                      <i className="bi bi-pin me-1"></i>
                      Pin this note
                    </label>
                    <div className="form-text">
                      Pinned notes appear at the top of the folder
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleHide}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-lg me-2"></i>
                      Create Note
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateNoteModal;
