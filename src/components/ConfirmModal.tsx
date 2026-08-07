import React from 'react';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * A styled inline confirmation modal that replaces window.confirm().
 * Renders as a Bootstrap modal overlay — no native browser dialog.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1060 }} onClick={onCancel} />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ zIndex: 1065 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmModalTitle"
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                {confirmVariant === 'danger' && (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 36, height: 36, background: 'rgba(220,53,69,0.12)' }}
                  >
                    <i className="bi bi-exclamation-triangle-fill text-danger" />
                  </div>
                )}
                {confirmVariant === 'warning' && (
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 36, height: 36, background: 'rgba(255,193,7,0.15)' }}
                  >
                    <i className="bi bi-exclamation-circle-fill text-warning" />
                  </div>
                )}
                <h5 className="modal-title mb-0 fw-semibold" id="confirmModalTitle">
                  {title}
                </h5>
              </div>
              <button
                type="button"
                className="btn-close ms-auto"
                onClick={onCancel}
                disabled={isLoading}
                aria-label="Cancel"
              />
            </div>

            <div className="modal-body pt-2 pb-3">
              <p className="text-muted mb-0" style={{ fontSize: '0.92rem', lineHeight: 1.55 }}>
                {message}
              </p>
            </div>

            <div className="modal-footer border-0 pt-0 gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant}`}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
