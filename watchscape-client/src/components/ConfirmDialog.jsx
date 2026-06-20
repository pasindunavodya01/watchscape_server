import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

/**
 * A confirmation dialog for destructive actions (delete, remove, etc.)
 * 
 * Props:
 *  - open: boolean
 *  - title: string
 *  - message: string
 *  - confirmLabel: string (default "Delete")
 *  - cancelLabel: string (default "Cancel")
 *  - variant: "danger" | "warning" (default "danger")
 *  - loading: boolean
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  useBodyScrollLock(open);

  if (!open) return null;

  const confirmStyles = variant === "danger"
    ? "bg-rose-600 hover:bg-rose-500 text-white active:scale-95"
    : "bg-amber-600 hover:bg-amber-500 text-white active:scale-95";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
            variant === "danger" ? "bg-rose-100" : "bg-amber-100"
          }`}>
            <ExclamationTriangleIcon className={`w-6 h-6 ${
              variant === "danger" ? "text-rose-600" : "text-amber-600"
            }`} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3.5 text-sm font-semibold border-l border-slate-100 transition-all duration-150 disabled:opacity-50 ${confirmStyles}`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Working...
              </div>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
