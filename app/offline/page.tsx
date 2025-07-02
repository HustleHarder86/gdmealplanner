import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are currently offline',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-10 h-10 text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m2.829 2.829l2.828 2.828M5.636 5.636a9 9 0 000 12.728m0 0l2.829-2.829m-2.829 2.829L3 21m2.464-12.536a5 5 0 000 7.072m0 0l2.829-2.829m-2.829 2.829L3 21"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">You're Offline</h1>
        <p className="text-neutral-600 mb-8 max-w-md mx-auto">
          It looks like you've lost your internet connection. Some features may not be available
          until you're back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}