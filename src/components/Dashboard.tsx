import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Folder } from '../services/api';
import { useData } from '../contexts/DataContext';
import CreateFolderModal from './CreateFolderModal';
import FolderCard from './FolderCard';

const Dashboard: React.FC = () => {
  const { folders, foldersLoaded, foldersLoading, fetchFolders, addFolderLocally } = useData();
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFolders = async (force = false) => {
    try {
      setError('');
      await fetchFolders(force);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders. Please try again.');
    }
  };

  const handleFolderCreated = (newFolder: Folder) => {
    addFolderLocally(newFolder);
    setShowCreateModal(false);
  };

  // Show spinner only on the very first load — subsequent visits use cached data
  const isInitialLoading = !foldersLoaded && foldersLoading;

  if (isInitialLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading your folders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="h3 mb-1">
                <i className="bi bi-folder2-open me-2 text-primary"></i>
                My Folders
              </h1>
              <p className="text-muted mb-0">
                {folders.length} folder{folders.length !== 1 ? 's' : ''} total
              </p>
            </div>
            
            <div className="d-flex gap-2 w-100 w-md-auto">
              {/* View Toggle */}
              <div className="btn-group" role="group" aria-label="View mode">
                <button
                  type="button"
                  className={`btn btn-sm btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="bi bi-grid"></i>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <i className="bi bi-list"></i>
                </button>
              </div>

              {/* Create Folder Button */}
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Create Folder
              </button>
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
              <button
                type="button"
                className="btn btn-link text-danger ms-auto"
                onClick={() => loadFolders(true)}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders Content */}
      {folders.length === 0 ? (
        <div className="row">
          <div className="col">
            <div className="empty-state">
              <div className="empty-state-icon folders">
                <i className="bi bi-folder-plus" />
              </div>
              <h4>No folders yet</h4>
              <p>Create your first folder to start organizing your notes. Keep everything tidy and easy to find.</p>
              <button
                className="btn btn-primary btn-lg px-4"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-lg me-2" />
                Create Your First Folder
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          {viewMode === 'grid' ? (
            folders.map(folder => (
              <div key={folder._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                <FolderCard
                  folder={folder}
                />
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="card">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Notes</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {folders.map(folder => (
                          <tr key={folder._id}>
                            <td>
                              <Link
                                to={`/folder/${folder._id}`}
                                className="text-decoration-none text-primary"
                              >
                                <div className="d-flex align-items-center">
                                  <div
                                    className="rounded me-3"
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      backgroundColor: folder.color,
                                    }}
                                  ></div>
                                  <span className="fw-semibold">{folder.name}</span>
                                </div>
                              </Link>
                            </td>
                            <td className="text-muted">
                              {folder.description || 'No description'}
                            </td>
                            <td>
                              <span className="badge bg-primary rounded-pill">
                                {folder.notesCount}
                              </span>
                            </td>
                            <td className="text-muted">
                              {new Date(folder.mainCreatedAt || folder.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <Link
                                to={`/folder/${folder._id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Folder Modal */}
      <CreateFolderModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onFolderCreated={handleFolderCreated}
      />
    </div>
  );
};

export default Dashboard;
