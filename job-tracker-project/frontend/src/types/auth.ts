export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login: string | null
}

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  first_name: string
  last_name: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: LoginFormData) => Promise<void>
  register: (userData: RegisterFormData) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
  // Guest mode properties
  isGuestMode: boolean
  dataMode: 'local' | 'authenticated'
  switchToGuestMode: () => void
  switchToAuthenticatedMode: () => void
  syncLocalDataToServer: () => Promise<{ success: boolean, message: string }>
}

export interface ApiError {
  message: string
  detail?: string
  status?: number
}