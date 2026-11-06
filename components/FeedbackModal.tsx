'use client';

import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface FeedbackModalProps {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

export default function FeedbackModal({
  title,
  message,
  type = 'info',
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onClose,
}: FeedbackModalProps) {
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      tone={type === 'error' || type === 'warning' ? 'danger' : 'default'}
      busy={busy}
      size="sm"
      footer={
        onConfirm ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              variant={type === 'error' || type === 'warning' ? 'danger' : 'primary'}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? 'Working…' : confirmLabel}
            </Button>
          </>
        ) : (
          <Button onClick={onClose} disabled={busy}>
            {confirmLabel}
          </Button>
        )
      }
    >
      <p className="body-md whitespace-pre-wrap break-words text-forest/80">{message}</p>
    </Modal>
  );
}
