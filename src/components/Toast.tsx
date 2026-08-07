import React, { useEffect, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 3000
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const iconMap: Record<ToastType, string> = {
  success: 'bi-check-circle-fill',
  error:   'bi-x-circle-fill',
  info:    'bi-info-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
};

const colorMap: Record<ToastType, string> = {
  success: '#198754',
  error:   '#dc3545',
  info:    '#0d6efd',
  warning: '#ffc107',
};

const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  // Auto-dismiss each toast after its duration
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t =>
      setTimeout(() => onDismiss(t.id), t.duration ?? 3000)
    );
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1090 }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast show align-items-center border-0 shadow mb-2"
          role="alert"
          style={{
            minWidth: 260,
            borderLeft: `4px solid ${colorMap[toast.type]}`,
            animation: 'toastSlideIn 0.25s ease',
          }}
        >
          <div className="d-flex align-items-center px-3 py-2 gap-2">
            <i
              className={`bi ${iconMap[toast.type]}`}
              style={{ color: colorMap[toast.type], fontSize: '1.1rem', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.9rem', flex: 1 }}>{toast.message}</span>
            <button
              type="button"
              className="btn-close btn-close-sm ms-1"
              aria-label="Dismiss"
              onClick={() => onDismiss(toast.id)}
              style={{ flexShrink: 0 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;

// ── Helper hook ──────────────────────────────────────────────────────────────
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
};
