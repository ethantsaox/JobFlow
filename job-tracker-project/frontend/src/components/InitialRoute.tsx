import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Welcome from '../pages/Welcome'

export default function InitialRoute() {
  const { user, loading, isAuthenticated, isGuestMode } = useAuth()

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      </div>
    )
  }

  // If user exists (either authenticated or guest), go to dashboard
  if (user && (isAuthenticated || isGuestMode)) {
    return <Navigate to="/dashboard" replace />
  }

  // Check if user has previously made a choice to skip welcome
  const hasSeenWelcome = localStorage.getItem('jobtracker_has_seen_welcome')
  
  // If they've seen welcome before and no user, probably need to login
  if (hasSeenWelcome && !user) {
    return <Navigate to="/login" replace />
  }

  // First time user - show welcome
  return <Welcome />
}