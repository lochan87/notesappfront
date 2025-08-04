import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { folderApi, noteApi, Folder, Note } from '../services/api';
import CreateNoteModal from './CreateNoteModal';
import EditFolderModal from './EditFolderModal';
import NoteCard from './NoteCard';

const FolderView: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalNotes: 0
  });

  useEffect(() => {
    if (folderId) {
      loadFolder();
      loadNotes();
    }
  }, [folderId]);

  useEffect(() => {
    if (folderId) {
      loadNotes();
    }
  }, [searchQuery, sortBy, sortOrder, pagination.current]);

  const loadFolder = async () => {
    try {
      if (!folderId) return;
      const data = await folderApi.getById(folderId);
      setFolder(data);
    } catch (err) {
      console.error('Error loading folder:', err);
      setError('Failed to load folder details.');
    }
  };

  const loadNotes = async () => {
    try {
      if (!folderId) return;
      
      setNotesLoading(true);
      const data = await noteApi.getByFolder(folderId, {
        search: searchQuery || undefined,
        sortBy,
        sortOrder,
        page: pagination.current,
        limit: 12
      });
      
      setNotes(data.notes);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes.');
    } finally {
      setNotesLoading(false);
      setLoading(false);
    }
  };

  const handleNoteCreated = (newNote: Note) => {
    setNotes(prev => [newNote, ...prev]);
    setShowCreateModal(false);
    // Update folder notes count
    if (folder) {
      setFolder(prev => prev ? { ...prev, notesCount: prev.notesCount + 1 } : null);
    }
  };

  const handleNoteDeleted = (deletedNoteId: string) => {
    setNotes(prev => prev.filter(note => note._id !== deletedNoteId));
    // Update folder notes count
    if (folder) {
      setFolder(prev => prev ? { ...prev, notesCount: prev.notesCount - 1 } : null);
    }
  };

  const handleNoteUpdated = (updatedNote: Note) => {
    setNotes(prev => 
      prev.map(note => 
        note._id === updatedNote._id ? updatedNote : note
      )
    );
  };

  const handleFolderUpdated = (updatedFolder: Folder) => {
    setFolder(updatedFolder);
  };

  const handleFolderDeleted = () => {
    // Navigate back to dashboard after folder deletion
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading folder...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <i className="bi bi-folder-x text-muted" style={{ fontSize: '4rem' }}></i>
          <h4 className="text-muted mt-3">Folder not found</h4>
          <Link to="/" className="btn btn-primary mt-3">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
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
              <li className="breadcrumb-item active" aria-current="page">
                {folder.name}
              </li>
            </ol>
          </nav>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="d-flex align-items-center">
              <div
                className="rounded me-3"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: folder.color,
                }}
              ></div>
              <div>
                <h1 className="h3 mb-1">{folder.name}</h1>
                <p className="text-muted mb-0">
                  {folder.description || 'No description'} • {pagination.totalNotes} note{pagination.totalNotes !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="d-flex gap-2 w-100 w-md-auto">
              <button
                className="btn btn-outline-secondary flex-fill flex-md-fill-0"
                onClick={() => setShowEditModal(true)}
              >
                <i className="bi bi-pencil me-2"></i>
                Edit Folder
              </button>
              <button
                className="btn btn-primary flex-fill flex-md-fill-0"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Create Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex flex-wrap gap-3 align-items-center">
            {/* Search */}
            <form onSubmit={handleSearch} className="d-flex">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="submit">
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </form>

            {/* Sort */}
            <div className="dropdown">
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-sort-down me-2"></i>
                Sort by {sortBy === 'createdAt' ? 'Date' : sortBy === 'lastModified' ? 'Modified' : 'Title'}
                {sortOrder === 'desc' ? ' ↓' : ' ↑'}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => handleSortChange('createdAt')}
                  >
                    Date Created {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => handleSortChange('lastModified')}
                  >
                    Last Modified {sortBy === 'lastModified' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => handleSortChange('title')}
                  >
                    Title {sortBy === 'title' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </li>
              </ul>
            </div>

            {/* View Toggle */}
            <div className="btn-group ms-auto" role="group">
              <button
                type="button"
                className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <i className="bi bi-grid"></i>
              </button>
              <button
                type="button"
                className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <i className="bi bi-list"></i>
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
                onClick={loadNotes}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Content */}
      {notesLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading notes...</span>
          </div>
          <p className="text-muted">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="bi bi-file-text text-muted" style={{ fontSize: '4rem' }}></i>
          </div>
          <h4 className="text-muted mb-3">
            {searchQuery ? 'No notes found' : 'No notes yet'}
          </h4>
          <p className="text-muted mb-4">
            {searchQuery 
              ? `No notes match "${searchQuery}". Try a different search term.`
              : 'Create your first note in this folder'
            }
          </p>
          {!searchQuery && (
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Create Your First Note
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="row">
            {viewMode === 'grid' ? (
              notes.map(note => (
                <div key={note._id} className="col-lg-4 col-md-6 mb-4">
                  <NoteCard
                    note={note}
                    onDeleted={handleNoteDeleted}
                    onUpdated={handleNoteUpdated}
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
                            <th>Title</th>
                            <th>Tags</th>
                            <th>Modified</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notes.map(note => (
                            <tr key={note._id}>
                              <td>
                                <Link
                                  to={`/note/${note._id}`}
                                  className="text-decoration-none text-primary"
                                >
                                  <div className="d-flex align-items-center">
                                    {note.isPinned && (
                                      <i className="bi bi-pin-fill text-warning me-2"></i>
                                    )}
                                    <span className="fw-semibold">{note.title}</span>
                                  </div>
                                </Link>
                              </td>
                              <td>
                                {note.tags.map(tag => (
                                  <span key={tag} className="badge bg-secondary me-1">
                                    {tag}
                                  </span>
                                ))}
                              </td>
                              <td className="text-muted">
                                {new Date(note.lastModified).toLocaleDateString()}
                              </td>
                              <td className="text-muted">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </td>
                              <td>
                                <Link
                                  to={`/note/${note._id}`}
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

          {/* Pagination */}
          {pagination.total > 1 && (
            <div className="row mt-4">
              <div className="col">
                <nav aria-label="Notes pagination">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${pagination.current === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                        disabled={pagination.current === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {Array.from({ length: pagination.total }, (_, i) => i + 1).map(page => (
                      <li key={page} className={`page-item ${pagination.current === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${pagination.current === pagination.total ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                        disabled={pagination.current === pagination.total}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Note Modal */}
      <CreateNoteModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onNoteCreated={handleNoteCreated}
        folderId={folderId!}
      />

      {/* Edit Folder Modal */}
      <EditFolderModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onFolderUpdated={handleFolderUpdated}
        onFolderDeleted={handleFolderDeleted}
        folder={folder}
      />
    </div>
  );
};

export default FolderView;
