import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const typeColors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(
      () => onClose(toast.id),
      toast.duration || 4000
    );
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`border rounded-lg p-4 mb-3 flex items-start gap-3 animate-fadeIn ${typeColors[toast.type]}`}
    >
      <span className="text-lg font-bold flex-shrink-0">
        {typeIcons[toast.type]}
      </span>
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-lg leading-none opacity-60 hover:opacity-100 flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm z-50">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

export default Toast;
