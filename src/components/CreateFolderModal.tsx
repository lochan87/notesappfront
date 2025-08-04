import React, { useState } from 'react';
import { folderApi, Folder } from '../services/api';

interface CreateFolderModalProps {
  show: boolean;
  onHide: () => void;
  onFolderCreated: (folder: Folder) => void;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ show, onHide, onFolderCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007bff',
    customCreatedAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const predefinedColors = [
    '#007bff', // Primary blue
    '#6f42c1', // Purple
    '#e83e8c', // Pink
    '#dc3545', // Red
    '#fd7e14', // Orange
    '#ffc107', // Yellow
    '#28a745', // Green
    '#20c997', // Teal
    '#17a2b8', // Cyan
    '#6c757d'  // Gray
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      setLoading(true);
      const createData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      };

      // Only add customCreatedAt if a date was provided
      if (formData.customCreatedAt) {
        createData.customCreatedAt = formData.customCreatedAt;
      }

      const newFolder = await folderApi.create(createData);
      
      onFolderCreated(newFolder);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#007bff',
      customCreatedAt: ''
    });
    setError('');
  };

  const handleHide = () => {
    if (!loading) {
      resetForm();
      onHide();
    }
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
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-folder-plus me-2"></i>
                Create New Folder
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleHide}
                disabled={loading}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="folderName" className="form-label fw-semibold">
                    Folder Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="folderName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter folder name"
                    maxLength={100}
                    disabled={loading}
                    autoFocus
                  />
                  <div className="form-text">
                    {formData.name.length}/100 characters
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="folderDescription" className="form-label fw-semibold">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="folderDescription"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this folder (optional)"
                    maxLength={500}
                    disabled={loading}
                  />
                  <div className="form-text">
                    {formData.description.length}/500 characters
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="folderCreatedAt" className="form-label fw-semibold">
                    Creation Date
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="folderCreatedAt"
                    value={formData.customCreatedAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, customCreatedAt: e.target.value }))}
                    disabled={loading}
                  />
                  <div className="form-text">
                    Leave empty to use current date and time
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Folder Color</label>
                  <div className="d-flex flex-wrap gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`btn p-0 border-2 ${formData.color === color ? 'border-dark' : 'border-light'}`}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: color,
                          borderRadius: '8px'
                        }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        disabled={loading}
                        title={color}
                      >
                        {formData.color === color && (
                          <i className="bi bi-check-lg text-white"></i>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom color picker */}
                  <div className="mt-2">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      title="Custom color"
                      disabled={loading}
                    />
                    <div className="form-text">Or choose a custom color</div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Preview</label>
                  <div className="p-3 bg-light rounded">
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded me-3"
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: formData.color,
                        }}
                      ></div>
                      <div>
                        <div className="fw-semibold">
                          {formData.name || 'Folder Name'}
                        </div>
                        {formData.description && (
                          <small className="text-muted">
                            {formData.description}
                          </small>
                        )}
                      </div>
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
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-lg me-2"></i>
                      Create Folder
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

export default CreateFolderModal;
