import { Modal } from './Modal'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', destructive = false, onConfirm, onCancel
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      width="sm"
      footer={
        <>
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
          <button
            onClick={onConfirm}
            className={destructive ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          destructive ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'
        }`}>
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-100">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{message}</p>
        </div>
      </div>
    </Modal>
  )
}
