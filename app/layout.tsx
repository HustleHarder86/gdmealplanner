import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/src/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Pregnancy Plate Planner - Gestational Diabetes Meal Planning',
    template: '%s | Pregnancy Plate Planner',
  },
  description:
    'Manage gestational diabetes with personalized meal plans, glucose tracking, and nutrition guidance for a healthy pregnancy.',
  keywords: [
    'gestational diabetes',
    'meal planning',
    'pregnancy nutrition',
    'glucose tracking',
    'healthy pregnancy',
    'diabetes management',
  ],
  authors: [{ name: 'Pregnancy Plate Planner' }],
  creator: 'Pregnancy Plate Planner',
  publisher: 'Pregnancy Plate Planner',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Pregnancy Plate Planner - Gestational Diabetes Meal Planning',
    description:
      'Manage gestational diabetes with personalized meal plans, glucose tracking, and nutrition guidance.',
    url: 'https://pregnancyplateplanner.com',
    siteName: 'Pregnancy Plate Planner',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  themeColor: '#e85b3c',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}