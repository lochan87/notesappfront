import React, { useState, useEffect } from 'react';
import { folderApi, Folder } from '../services/api';

interface EditFolderModalProps {
  show: boolean;
  onHide: () => void;
  onFolderUpdated: (folder: Folder) => void;
  onFolderDeleted: (folderId: string) => void;
  folder: Folder | null;
}

const EditFolderModal: React.FC<EditFolderModalProps> = ({ show, onHide, onFolderUpdated, onFolderDeleted, folder }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007bff',
    customCreatedAt: ''
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  useEffect(() => {
    if (folder && show) {
      setFormData({
        name: folder.name,
        description: folder.description,
        color: folder.color,
        customCreatedAt: ''
      });
      setError('');
    }
  }, [folder, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Folder name is required');
      return;
    }

    if (!folder) {
      setError('No folder selected');
      return;
    }

    try {
      setLoading(true);
      const updateData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      };

      // Only add customCreatedAt if a date was provided
      if (formData.customCreatedAt) {
        updateData.customCreatedAt = formData.customCreatedAt;
      }

      const updatedFolder = await folderApi.update(folder._id, updateData);
      
      onFolderUpdated(updatedFolder);
      handleHide();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!folder) {
      setError('No folder selected');
      return;
    }

    const confirmMessage = `Are you sure you want to delete "${folder.name}"?\n\nThis will permanently delete the folder and all its notes. This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(true);
      await folderApi.delete(folder._id);
      onFolderDeleted(folder._id);
      handleHide();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete folder. Please try again.');
    } finally {
      setDeleting(false);
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

  const displayCreationHistory = () => {
    if (!folder?.customCreatedDates || folder.customCreatedDates.length <= 1) {
      return null;
    }

    return (
      <div className="mb-3">
        <label className="form-label fw-semibold">Creation Date History</label>
        <div className="bg-light rounded p-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
          {folder.customCreatedDates.map((dateEntry, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center py-1">
              <span className="small">
                {new Date(dateEntry.date).toLocaleString()}
              </span>
              <span className="badge bg-secondary small">
                Modified: {new Date(dateEntry.modifiedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!show || !folder) return null;

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
                <i className="bi bi-pencil me-2"></i>
                Edit Folder
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
                  <label htmlFor="editFolderName" className="form-label fw-semibold">
                    Folder Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="editFolderName"
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
                  <label htmlFor="editFolderDescription" className="form-label fw-semibold">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="editFolderDescription"
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

                {displayCreationHistory()}

                <div className="mb-3">
                  <label htmlFor="editFolderCreatedAt" className="form-label fw-semibold">
                    Update Creation Date
                  </label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="editFolderCreatedAt"
                    value={formData.customCreatedAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, customCreatedAt: e.target.value }))}
                    disabled={loading}
                  />
                  <div className="form-text">
                    Leave empty to keep current creation date. Current: {new Date(folder.mainCreatedAt || folder.createdAt).toLocaleString()}
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
                <div className="d-flex flex-column flex-sm-row justify-content-between w-100 gap-2">
                  <button
                    type="button"
                    className="btn btn-danger order-3 order-sm-1"
                    onClick={handleDelete}
                    disabled={loading || deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-2"></i>
                        Delete Folder
                      </>
                    )}
                  </button>
                  
                  <div className="d-flex gap-2 order-1 order-sm-2">
                    <button
                      type="button"
                      className="btn btn-secondary flex-fill flex-sm-none"
                      onClick={handleHide}
                      disabled={loading || deleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-fill flex-sm-none"
                      disabled={loading || deleting || !formData.name.trim()}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Update Folder
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditFolderModal;
