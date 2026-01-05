import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDarkMode } from '../hooks/useDarkMode'
import { isDemoDataLoaded } from '../services/demoData'

export default function Navbar() {
  const { user, logout, isGuestMode, isAuthenticated, switchToGuestMode, switchToAuthenticatedMode, syncLocalDataToServer } = useAuth()
  const { toggleTheme, isDark } = useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showModeTooltip, setShowModeTooltip] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  
  const getLinkClasses = (path: string) => {
    const isActive = location.pathname === path
    return isActive
      ? "border-primary-500 text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 ease-in-out"
      : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105"
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSyncData = async () => {
    if (!isGuestMode) return

    setSyncStatus('syncing')
    try {
      const result = await syncLocalDataToServer()
      if (result.success) {
        setSyncStatus('success')
        setTimeout(() => setSyncStatus('idle'), 2000)
      } else {
        setSyncStatus('error')
        setTimeout(() => setSyncStatus('idle'), 2000)
      }
    } catch (error) {
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 2000)
    }
  }

  const handleSwitchToAuthenticated = () => {
    switchToAuthenticatedMode()
    navigate('/login')
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 transition-colors duration-300">
                  <img 
                    src={isDark ? "/src/assets/jobflowdark.png" : "/src/assets/jobflowlight.png"}
                    alt="JobFlow Logo" 
                    className="h-8 w-auto transition-all duration-300"
                  />
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className={getLinkClasses('/dashboard')}
              >
                Dashboard
              </Link>
              <Link
                to="/applications"
                className={getLinkClasses('/applications')}
              >
                Applications
              </Link>
              <Link
                to="/analytics"
                className={getLinkClasses('/analytics')}
              >
                Analytics
              </Link>
              <Link
                to="/network"
                className={getLinkClasses('/network')}
              >
                Network
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {/* Mode Indicator */}
            <div 
              className="relative"
              onMouseEnter={() => setShowModeTooltip(true)}
              onMouseLeave={() => setShowModeTooltip(false)}
            >
              <div 
                className={`flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                  isGuestMode 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}
              >
                <span className="mr-1">
                  {isGuestMode ? '🏠' : '☁️'}
                </span>
                {isGuestMode ? (isDemoDataLoaded() ? 'Demo Mode' : 'Local Mode') : 'Cloud Mode'}
              </div>

              {/* Mode Tooltip */}
              {showModeTooltip && (
                <div className="absolute top-full right-0 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-4 z-50 mt-0">
                  <div className="text-sm">
                    {isGuestMode ? (
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">Local Mode</p>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">Your data is stored locally on this device.</p>
                        <div className="space-y-2">
                          <button 
                            onClick={handleSwitchToAuthenticated}
                            className="w-full text-left px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            ☁️ Switch to Cloud Modem
                          </button>
                          {isAuthenticated && (
                            <button 
                              onClick={handleSyncData}
                              disabled={syncStatus === 'syncing'}
                              className="w-full text-left px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                            >
                              {syncStatus === 'syncing' ? '⏳ Syncing...' : 
                               syncStatus === 'success' ? '✅ Synced!' : 
                               syncStatus === 'error' ? '❌ Sync Failed' : 
                               '🔄 Sync to Cloud'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">Cloud Mode</p>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">Your data is synced across all devices.</p>
                        <button 
                          onClick={switchToGuestMode}
                          className="w-full text-left px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                        >
                          🏠 Switch to Local Mode
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                // Sun icon for light mode
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="max-w-xs bg-white dark:bg-gray-700 flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-colors duration-300"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-200">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </span>
                  </div>
                </button>
              </div>
              {isProfileDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 focus:outline-none z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                    <div className="font-medium">{user?.full_name}</div>
                    <div className="text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}