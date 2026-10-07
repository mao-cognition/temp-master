import type { ReactNode } from 'react'

type Variant = 'info' | 'warning' | 'danger'

export function Alert({
  variant,
  id,
  children,
  onDismiss,
}: {
  variant: Variant
  id?: string
  children: ReactNode
  onDismiss?: () => void
}) {
  return (
    <div id={id} className={`alert alert--${variant}`} role={variant === 'danger' ? 'alert' : 'status'}>
      <div className="alert__body">{children}</div>
      {onDismiss && (
        <button type="button" className="alert__close" aria-label="閉じる" onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  )
}
