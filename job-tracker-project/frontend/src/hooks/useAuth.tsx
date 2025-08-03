import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService } from '../services/auth'
import type { User, LoginFormData, RegisterFormData, AuthContextType } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    setLoading(true)
    try {
      const storedToken = AuthService.getToken()
      
      if (storedToken && AuthService.hasValidToken()) {
        setToken(storedToken)
        // Fetch current user info
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
      } else {
        // Clear invalid tokens
        AuthService.clearTokens()
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      AuthService.clearTokens()
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginFormData) => {
    setLoading(true)
    try {
      const authResponse = await AuthService.login(credentials)
      
      // Store tokens
      AuthService.setTokens(authResponse)
      setToken(authResponse.access_token)
      
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
      setUser(null)
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