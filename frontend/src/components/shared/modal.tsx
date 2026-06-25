'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }: {
  open: boolean; onClose: () => void; title?: string; subtitle?: string
  children: React.ReactNode; size?: ModalSize; footer?: React.ReactNode
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, onClose])

  if (!open) return null

  const sizeClasses: Record<ModalSize, string> = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-white rounded-2xl shadow-modal flex flex-col max-h-[90vh] animate-slide-in-up', sizeClasses[size])}>
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div>
              {title && <h2 className="text-base font-bold text-text-primary">{title}</h2>}
              {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="ml-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-text-muted hover:text-text-primary transition-colors">
              <X size={15} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border flex-shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
