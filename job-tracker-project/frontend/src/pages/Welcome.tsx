import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { loadDemoData, isDemoDataLoaded } from '../services/demoData'

export default function Welcome() {
  const navigate = useNavigate()
  const { switchToGuestMode, switchToAuthenticatedMode } = useAuth()
  const [selectedMode, setSelectedMode] = useState<'local' | 'authenticated' | null>(null)

  const handleContinueAsGuest = () => {
    localStorage.setItem('jobtracker_has_seen_welcome', 'true')
    
    // Load demo data if not already loaded
    if (!isDemoDataLoaded()) {
      loadDemoData()
    }
    
    switchToGuestMode()
    navigate('/dashboard')
  }

  const handleGoToLogin = () => {
    localStorage.setItem('jobtracker_has_seen_welcome', 'true')
    switchToAuthenticatedMode()
    navigate('/login')
  }

  const handleGoToRegister = () => {
    localStorage.setItem('jobtracker_has_seen_welcome', 'true')
    switchToAuthenticatedMode()
    navigate('/register')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="mx-auto mb-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl text-white">💼</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to JobFlow
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Smart job application tracking with AI insights
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Choose how you'd like to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Guest Mode Option */}
            <div 
              className={`relative p-8 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedMode === 'local' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedMode('local')}
            >
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Try Demo
                </h3>
                <p className="text-green-600 dark:text-green-400 font-semibold mb-4">
                  No registration • Pre-loaded sample data
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <span className="text-green-500 mt-1 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Explore with sample data</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">See how the app works with realistic job applications</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mt-1 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Complete privacy</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">All data stays on your device</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mt-1 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Works offline</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">No internet connection required</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mt-1 mr-3">→</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Upgrade anytime</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Create an account later to sync across devices</p>
                  </div>
                </div>
              </div>

              {selectedMode === 'local' && (
                <button
                  onClick={handleContinueAsGuest}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Try Demo
                </button>
              )}
            </div>

            {/* Authenticated Mode Option */}
            <div 
              className={`relative p-8 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedMode === 'authenticated' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedMode('authenticated')}
            >
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">☁️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Account
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-semibold mb-4">
                  Full-featured experience
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <span className="text-blue-500 mt-1 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Sync across devices</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Access your data anywhere, anytime</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mt-1 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Data backup</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Never lose your application history</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mt-1 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Social features</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Connect with friends and share achievements</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mt-1 mr-3">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Advanced analytics</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Deeper insights into your job search</p>
                  </div>
                </div>
              </div>

              {selectedMode === 'authenticated' && (
                <div className="space-y-3">
                  <button
                    onClick={handleGoToRegister}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Create New Account
                  </button>
                  <button
                    onClick={handleGoToLogin}
                    className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-400 font-semibold py-3 px-6 rounded-xl border border-blue-600 dark:border-blue-400 transition-colors"
                  >
                    I Already Have an Account
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              You can always change your choice later in settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}