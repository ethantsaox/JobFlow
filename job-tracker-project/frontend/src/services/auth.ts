import api from './api'

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

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  }

  static async register(userData: RegisterRequest): Promise<User> {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  }

  static async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/auth/me')
    return response.data
  }

  static async logout(): Promise<void> {
    await api.post('/api/auth/logout')
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post('/api/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  }

  // Utility methods
  static setTokens(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.access_token)
    if (authResponse.refresh_token) {
      localStorage.setItem('refreshToken', authResponse.refresh_token)
    }
  }

  static clearTokens(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  static getToken(): string | null {
    return localStorage.getItem('token')
  }

  static hasValidToken(): boolean {
    const token = this.getToken()
    if (!token) return false

    // Basic token validation (you might want to decode and check expiry)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Date.now() / 1000
      return payload.exp > now
    } catch {
      return false
    }
  }
}

export default AuthService