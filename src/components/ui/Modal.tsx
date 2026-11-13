import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  titleUr?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  titleUr,
  maxWidthClass = 'max-w-lg',
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClass} bg-surface-container-lowest text-on-surface rounded-t-3xl sm:rounded-2xl shadow-2xl border border-outline-variant/40 max-h-[90dvh] flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-outline-variant/30 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-on-surface truncate">{title}</h3>
            {titleUr && (
              <p className="font-urdu text-xs text-primary leading-relaxed" dir="rtl">
                {titleUr}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">{message}</p>
      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[42px] px-4 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`min-h-[42px] px-4 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 ${
            destructive
              ? 'bg-error text-on-error hover:opacity-95'
              : 'bg-primary text-on-primary hover:bg-primary-container'
          }`}
        >
          {loading ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
