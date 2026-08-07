import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Note, noteApi } from '../services/api';
import ConfirmModal from './ConfirmModal';

interface NoteCardProps {
  note: Note;
  onDeleted: (noteId: string) => void;
  onUpdated: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDeleted, onUpdated }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPin, setIsTogglingPin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteConfirmed = async () => {
    try {
      setIsDeleting(true);
      await noteApi.delete(note._id);
      onDeleted(note._id);
    } catch (error: any) {
      // Dismiss modal and surface error in UI (no alert())
      setShowConfirm(false);
      console.error('Failed to delete note:', error);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      setIsTogglingPin(true);
      const updatedNote = await noteApi.togglePin(note._id);
      onUpdated(updatedNote);
    } catch (error: any) {
      console.error('Failed to update note:', error);
    } finally {
      setIsTogglingPin(false);
    }
  };

  /** Format as "Aug 7, 2026, 12:34 PM" */
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const truncateContent = (content: string, maxLength = 150) =>
    content.length <= maxLength ? content : content.substring(0, maxLength) + '…';

  return (
    <>
      <div className="card h-100 shadow-sm border-0 note-card">
        <div className="card-body d-flex flex-column">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="d-flex align-items-center">
              {note.isPinned && (
                <i className="bi bi-pin-fill text-warning me-2" title="Pinned" />
              )}
              {note.images && note.images.length > 0 && (
                <i className="bi bi-image text-info me-2" title={`${note.images.length} image(s)`} />
              )}
            </div>

            <div className="dropdown">
              <button
                className="btn btn-sm btn-link text-muted p-1"
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isDeleting || isTogglingPin}
              >
                <i className="bi bi-three-dots-vertical" />
              </button>
              <ul className={`dropdown-menu dropdown-menu-end ${showDropdown ? 'show' : ''}`}>
                <li>
                  <Link className="dropdown-item" to={`/note/${note._id}`}>
                    <i className="bi bi-eye me-2" />View
                  </Link>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={handleTogglePin}
                    disabled={isTogglingPin}
                  >
                    <i className={`bi ${note.isPinned ? 'bi-pin' : 'bi-pin-fill'} me-2`} />
                    {isTogglingPin ? 'Updating…' : (note.isPinned ? 'Unpin' : 'Pin')}
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => { setShowDropdown(false); setShowConfirm(true); }}
                    disabled={isDeleting}
                  >
                    <i className="bi bi-trash me-2" />Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Note Content */}
          <div className="flex-grow-1">
            <h5 className="card-title mb-2">
              <Link
                to={`/note/${note._id}`}
                className="text-decoration-none text-primary stretched-link"
              >
                {note.title}
              </Link>
            </h5>

            {note.content && (
              <p className="card-text text-muted mb-3" style={{ fontSize: '0.88rem', lineHeight: 1.55 }}>
                {truncateContent(note.content)}
              </p>
            )}

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="mb-3">
                {note.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="badge bg-secondary me-1 mb-1">{tag}</span>
                ))}
                {note.tags.length > 3 && (
                  <span className="badge bg-secondary text-light">+{note.tags.length - 3} more</span>
                )}
              </div>
            )}

            {/* Images preview */}
            {note.images && note.images.length > 0 && (
              <div className="mb-3">
                <div className="d-flex gap-1">
                  {note.images.slice(0, 3).map((image, index) => (
                    <div
                      key={index}
                      className="rounded"
                      style={{
                        width: 44, height: 44,
                        backgroundImage: `url(${image.data})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid rgba(0,0,0,0.08)',
                      }}
                    />
                  ))}
                  {note.images.length > 3 && (
                    <div
                      className="rounded d-flex align-items-center justify-content-center"
                      style={{ width: 44, height: 44, background: 'rgba(0,0,0,0.06)' }}
                    >
                      <small className="text-muted fw-semibold">+{note.images.length - 3}</small>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
              <i className="bi bi-clock me-1" />
              {formatDate(note.mainLastModified || note.lastModified)}
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {(isDeleting || isTogglingPin) && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 rounded">
            <div className={`spinner-border ${isDeleting ? 'text-danger' : 'text-primary'}`} role="status">
              <span className="visually-hidden">
                {isDeleting ? 'Deleting…' : 'Updating…'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        show={showConfirm}
        title="Delete Note"
        message={`Are you sure you want to delete "${note.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setShowConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
};

export default NoteCard;
