import React from 'react';

// ── Single note card skeleton ────────────────────────────────────────────────
export const NoteSkeleton: React.FC = () => (
  <div className="card h-100 border-0 shadow-sm skeleton-card">
    <div className="card-body d-flex flex-column gap-2 p-3">
      <div className="skeleton-line w-25" style={{ height: 12 }} />
      <div className="skeleton-line w-75" style={{ height: 18 }} />
      <div className="skeleton-line w-100" style={{ height: 12 }} />
      <div className="skeleton-line w-90" style={{ height: 12 }} />
      <div className="skeleton-line w-60" style={{ height: 12 }} />
      <div className="mt-auto pt-2 d-flex justify-content-between">
        <div className="skeleton-line w-40" style={{ height: 10 }} />
        <div className="skeleton-line w-20" style={{ height: 10 }} />
      </div>
    </div>
  </div>
);

// ── Single folder card skeleton ──────────────────────────────────────────────
export const FolderSkeleton: React.FC = () => (
  <div className="card h-100 border-0 shadow-sm skeleton-card">
    <div className="card-body d-flex flex-column gap-2 p-3">
      <div className="skeleton-line w-10" style={{ height: 24, borderRadius: 6 }} />
      <div className="skeleton-line w-50" style={{ height: 20 }} />
      <div className="skeleton-line w-80" style={{ height: 12 }} />
      <div className="skeleton-line w-60" style={{ height: 12 }} />
      <div className="mt-auto pt-2 d-flex justify-content-between border-top">
        <div className="skeleton-line w-30" style={{ height: 10 }} />
        <div className="skeleton-line w-25" style={{ height: 10 }} />
      </div>
    </div>
  </div>
);

// ── Grid of N skeletons ──────────────────────────────────────────────────────
interface SkeletonGridProps {
  count?: number;
  type?: 'note' | 'folder';
  colClass?: string;
}

const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  count = 6,
  type = 'folder',
  colClass = 'col-lg-3 col-md-4 col-sm-6',
}) => (
  <div className="row">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${colClass} mb-4`}>
        {type === 'folder' ? <FolderSkeleton /> : <NoteSkeleton />}
      </div>
    ))}
  </div>
);

export default SkeletonGrid;
