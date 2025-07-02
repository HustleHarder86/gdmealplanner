'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOutUser } from '@/lib/firebase-auth'
import { useAuth } from '@/contexts/AuthContext'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { userData } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/meal-planner', label: 'Meal Planner' },
    { href: '/recipes', label: 'Recipes' },
    { href: '/tracking/glucose', label: 'Glucose' },
    { href: '/tracking/nutrition', label: 'Nutrition' },
    { href: '/education', label: 'Learn' },
    { href: '/profile', label: 'Profile' },
  ]

  const isActive = (href: string) => pathname.startsWith(href)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOutUser()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-bold text-primary-600">
            Pregnancy Plate Planner
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="ml-4 flex items-center space-x-3">
              {userData && (
                <span className="text-sm text-neutral-600">
                  {userData.displayName || userData.email}
                </span>
              )}
              <button 
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200">
            <div className="py-2 space-y-1">
              {userData && (
                <div className="px-3 py-2 text-sm text-neutral-600 border-b border-neutral-100">
                  {userData.displayName || userData.email}
                </div>
              )}
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button 
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full text-left px-3 py-2 text-base text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg disabled:opacity-50"
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}