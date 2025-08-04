import React from 'react';
import { Link } from 'react-router-dom';
import { Folder } from '../services/api';

interface FolderCardProps {
  folder: Folder;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="card h-100 shadow-sm border-0 folder-card">
      <div className="card-body d-flex flex-column">
        {/* Header with color indicator */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div
            className="rounded"
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: folder.color,
            }}
          ></div>
        </div>

        {/* Folder Info */}
        <div className="flex-grow-1">
          <h5 className="card-title mb-2">
            <Link
              to={`/folder/${folder._id}`}
              className="text-decoration-none text-primary stretched-link"
            >
              {folder.name}
            </Link>
          </h5>
          
          {folder.description && (
            <p className="card-text text-muted small mb-2">
              {folder.description.length > 100
                ? `${folder.description.substring(0, 100)}...`
                : folder.description
              }
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
          <div className="d-flex align-items-center text-muted small">
            <i className="bi bi-file-text me-1"></i>
            <span>{folder.notesCount} note{folder.notesCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="text-muted small">
            <i className="bi bi-calendar3 me-1"></i>
            {formatDate(folder.mainCreatedAt || folder.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderCard;
