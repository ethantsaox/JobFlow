import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, isGuestMode } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Minimal loading - just a top progress bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Allow access if user is authenticated OR in guest mode with a user
  const hasAccess = isAuthenticated || (isGuestMode && user)

  if (!hasAccess) {
    // If no access and not in guest mode, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}