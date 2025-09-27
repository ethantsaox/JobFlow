import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService } from '../services/auth'
import DataManager, { DataMode } from '../services/dataManager'
import type { User, LoginFormData, RegisterFormData, AuthContextType } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataMode, setDataMode] = useState<DataMode>('local')

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    setLoading(true)
    try {
      // Initialize DataManager mode first
      DataManager.initializeMode()
      const currentMode = DataManager.getCurrentMode()
      setDataMode(currentMode)

      // Try to get user from DataManager (handles both modes)
      const currentUser = await DataManager.getUser()
      
      if (currentMode === 'authenticated') {
        const storedToken = AuthService.getToken()
        
        if (storedToken && AuthService.hasValidToken() && currentUser) {
          setToken(storedToken)
          setUser(currentUser)
        } else {
          // Switch to guest mode if auth fails
          switchToGuestMode()
        }
      } else {
        // Guest mode - get local user
        setUser(currentUser)
        setToken(null)
      }
    } catch (error: any) {
      console.error('Failed to initialize auth:', error)
      
      // On any error, fall back to guest mode
      switchToGuestMode()
    } finally {
      setLoading(false)
    }
  }

  const switchToGuestMode = () => {
    DataManager.setMode('local')
    setDataMode('local')
    setToken(null)
    AuthService.clearTokens()
    
    // Get local user
    DataManager.getUser().then(localUser => {
      setUser(localUser)
    }).catch(console.error)
  }

  const switchToAuthenticatedMode = () => {
    DataManager.setMode('authenticated')
    setDataMode('authenticated')
    // Note: This just sets the mode, actual login still required
  }

  const syncLocalDataToServer = async () => {
    return await DataManager.syncLocalToServer()
  }

  const login = async (credentials: LoginFormData) => {
    setLoading(true)
    try {
      const authResponse = await AuthService.login(credentials)
      
      // Store tokens
      AuthService.setTokens(authResponse)
      setToken(authResponse.access_token)
      
      // Switch to authenticated mode
      DataManager.setMode('authenticated')
      setDataMode('authenticated')
      
      // Get user info
      const currentUser = await AuthService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterFormData) => {
    setLoading(true)
    try {
      // Register user
      await AuthService.register({
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
      })
      
      // Auto-login after registration
      await login({
        email: userData.email,
        password: userData.password,
      })

      // After successful registration and login, sync any local data
      if (dataMode === 'authenticated') {
        try {
          await syncLocalDataToServer()
        } catch (error) {
          console.warn('Failed to sync local data after registration:', error)
        }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await AuthService.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      AuthService.clearTokens()
      setToken(null)
      
      // Switch back to guest mode and get local user
      switchToGuestMode()
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
    isGuestMode: dataMode === 'local',
    dataMode,
    switchToGuestMode,
    switchToAuthenticatedMode,
    syncLocalDataToServer,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}