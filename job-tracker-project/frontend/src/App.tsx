import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import { DarkModeProvider } from './hooks/useDarkMode'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import ProtectedRoute from './components/ProtectedRoute'
import InitialRoute from './components/InitialRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Applications from './pages/Applications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Friends from './pages/Friends'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

const OnlineStatusProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  useOnlineStatus()
  return <>{children}</>
}

const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <AuthProvider>
          <OnlineStatusProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Applications page */}
              <Route
                path="/applications"
                element={
                  <ProtectedRoute>
                    <Applications />
                  </ProtectedRoute>
                }
              />
              
              {/* Analytics page */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />

              {/* Profile page */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Settings page */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Network page */}
              <Route
                path="/network"
                element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                }
              />
              
              {/* Default redirect - handles welcome vs dashboard */}
              <Route path="/" element={<InitialRoute />} />
              
              {/* 404 fallback */}
              <Route path="*" element={<InitialRoute />} />
              </Routes>
              </div>
            </Router>
          </OnlineStatusProvider>
        </AuthProvider>
      </DarkModeProvider>
    </QueryClientProvider>
  )
}

export default App