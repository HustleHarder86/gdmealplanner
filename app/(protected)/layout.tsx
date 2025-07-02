import Navigation from '@/components/Navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiresProfile={true}>
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <main className="container py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}