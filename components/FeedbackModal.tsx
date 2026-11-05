'use client';

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

const styles = {
  info: { header: 'bg-blue-800', button: 'bg-blue-700 hover:bg-blue-800' },
  success: { header: 'bg-green-800', button: 'bg-green-700 hover:bg-green-800' },
  error: { header: 'bg-rose-700', button: 'bg-rose-700 hover:bg-rose-800' },
  warning: { header: 'bg-amber-600', button: 'bg-amber-600 hover:bg-amber-700' },
};

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
  const colors = styles[type];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className={`${colors.header} px-6 py-5 text-white`}>
          <h2 id="feedback-modal-title" className="text-xl font-black">{title}</h2>
        </div>
        <div className="space-y-5 p-6">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{message}</p>
          <div className="flex justify-end gap-2">
            {onConfirm && (
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black uppercase text-slate-600 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm || onClose}
              className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase text-white disabled:opacity-50 ${colors.button}`}
            >
              {busy && onConfirm ? 'Please wait...' : confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
