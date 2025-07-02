'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

type Theme = 'light' | 'dark' | 'system'

interface DarkModeToggleProps {
  defaultTheme?: Theme
  showLabel?: boolean
  className?: string
}

export function DarkModeToggle({ 
  defaultTheme = 'system', 
  showLabel = false,
  className = '' 
}: DarkModeToggleProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    
    // Remove all theme classes
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      // Use selected theme
      root.classList.add(theme)
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme, mounted])
  
  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])
  
  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }
  
  if (!mounted) {
    return null
  }
  
  const icons = {
    light: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    dark: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    system: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  }
  
  const labels = {
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  }
  
  return (
    <motion.button
      onClick={cycleTheme}
      className={`
        inline-flex items-center gap-2 p-2 rounded-lg
        bg-neutral-100 dark:bg-neutral-800 
        hover:bg-neutral-200 dark:hover:bg-neutral-700
        text-neutral-700 dark:text-neutral-300
        transition-colors
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Current theme: ${labels[theme]}. Click to change.`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -180, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {icons[theme]}
      </motion.div>
      
      {showLabel && (
        <span className="text-sm font-medium">{labels[theme]}</span>
      )}
    </motion.button>
  )
}

// Compact version for navigation bars
export function DarkModeToggleCompact() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
    
    localStorage.setItem('theme', theme)
  }, [theme, mounted])
  
  if (!mounted) return null
  
  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={`
          p-1.5 rounded transition-colors
          ${theme === 'light' 
            ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm' 
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }
        `}
        aria-label="Light theme"
        aria-pressed={theme === 'light'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`
          p-1.5 rounded transition-colors
          ${theme === 'dark' 
            ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm' 
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }
        `}
        aria-label="Dark theme"
        aria-pressed={theme === 'dark'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={`
          p-1.5 rounded transition-colors
          ${theme === 'system' 
            ? 'bg-white dark:bg-neutral-700 text-primary-600 shadow-sm' 
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }
        `}
        aria-label="System theme"
        aria-pressed={theme === 'system'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  )
}