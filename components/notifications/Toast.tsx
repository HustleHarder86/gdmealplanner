'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export function ToastProvider({ children, position = 'top-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }, [])
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className={`fixed z-50 ${positionClasses[position]} pointer-events-none`}>
        <AnimatePresence mode="sync">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={() => removeToast(toast.id)}
              position={position}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: () => void
  position: string
}

function ToastItem({ toast, onRemove, position }: ToastItemProps) {
  const icons = {
    success: (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
  
  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-amber-50 border-amber-200'
  }
  
  const slideDirection = position.includes('right') ? 100 : -100
  
  return (
    <motion.div
      initial={{ opacity: 0, x: slideDirection, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: slideDirection, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="pointer-events-auto mb-4"
    >
      <div className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg border
        ${bgColors[toast.type]}
        min-w-[300px] max-w-md
      `}>
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.type]}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-neutral-900">
            {toast.title}
          </h3>
          {toast.message && (
            <p className="mt-1 text-sm text-neutral-600">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick()
                onRemove()
              }}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

// Convenience hook for common toast patterns
export function useToastActions() {
  const { addToast } = useToast()
  
  return {
    success: (title: string, message?: string) => {
      addToast({ type: 'success', title, message })
    },
    error: (title: string, message?: string) => {
      addToast({ type: 'error', title, message, duration: 8000 })
    },
    info: (title: string, message?: string) => {
      addToast({ type: 'info', title, message })
    },
    warning: (title: string, message?: string) => {
      addToast({ type: 'warning', title, message })
    },
    promise: async <T,>(
      promise: Promise<T>,
      { loading, success, error }: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((err: any) => string)
      }
    ) => {
      const loadingToast = { type: 'info' as const, title: loading, duration: 0 }
      addToast(loadingToast)
      
      try {
        const data = await promise
        const successTitle = typeof success === 'function' ? success(data) : success
        addToast({ type: 'success', title: successTitle })
        return data
      } catch (err) {
        const errorTitle = typeof error === 'function' ? error(err) : error
        addToast({ type: 'error', title: errorTitle, duration: 8000 })
        throw err
      }
    }
  }
}