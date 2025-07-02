'use client'

import { ReactNode, useEffect } from 'react'
import { format } from 'date-fns'

interface PrintableWrapperProps {
  children: ReactNode
  title?: string
  showHeader?: boolean
  showFooter?: boolean
  onBeforePrint?: () => void
  onAfterPrint?: () => void
}

export function PrintableWrapper({
  children,
  title = 'GD Meal Planner',
  showHeader = true,
  showFooter = true,
  onBeforePrint,
  onAfterPrint
}: PrintableWrapperProps) {
  useEffect(() => {
    const handleBeforePrint = () => {
      onBeforePrint?.()
    }
    
    const handleAfterPrint = () => {
      onAfterPrint?.()
    }
    
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [onBeforePrint, onAfterPrint])
  
  return (
    <>
      {showHeader && (
        <div className="print-header hidden">
          <h1>{title}</h1>
          <div className="print-date">
            Printed on {format(new Date(), 'MMMM d, yyyy')}
          </div>
        </div>
      )}
      
      <div className="print-content">
        {children}
      </div>
      
      {showFooter && (
        <div className="print-footer hidden">
          <div>GD Meal Planner - Healthy meals for mom & baby</div>
          <div>Page <span className="page-number"></span></div>
        </div>
      )}
    </>
  )
}

// Utility component for print-specific layouts
interface PrintSectionProps {
  children: ReactNode
  title?: string
  breakAfter?: boolean
  avoidBreak?: boolean
  className?: string
}

export function PrintSection({
  children,
  title,
  breakAfter = false,
  avoidBreak = true,
  className = ''
}: PrintSectionProps) {
  return (
    <section 
      className={`
        ${avoidBreak ? 'avoid-break' : ''}
        ${breakAfter ? 'page-break' : ''}
        ${className}
      `}
    >
      {title && <h2 className="print-section-title">{title}</h2>}
      {children}
    </section>
  )
}

// Print button component
interface PrintButtonProps {
  onPrint?: () => void
  className?: string
}

export function PrintButton({ onPrint, className = '' }: PrintButtonProps) {
  const handlePrint = () => {
    onPrint?.()
    window.print()
  }
  
  return (
    <button
      onClick={handlePrint}
      className={`
        no-print inline-flex items-center gap-2 px-4 py-2 
        bg-white border border-neutral-300 rounded-lg
        hover:bg-neutral-50 transition-colors
        ${className}
      `}
      aria-label="Print page"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print
    </button>
  )
}