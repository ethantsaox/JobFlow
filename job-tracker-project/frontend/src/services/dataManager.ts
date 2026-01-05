import LocalStorageService, { LocalUser, LocalJobApplication, LocalCompany, LocalStreak, LocalAchievement } from './localStorageService'
import { analyticsApi, jobApplicationsApi } from './api'
import { AuthService } from './auth'

export type DataMode = 'local' | 'authenticated'

// Transform functions to convert between local and API data formats
class DataTransforms {
  static localUserToApiUser(localUser: LocalUser): any {
    return {
      id: localUser.id,
      email: localUser.email || '',
      first_name: localUser.first_name,
      last_name: localUser.last_name,
      full_name: `${localUser.first_name} ${localUser.last_name}`,
      daily_goal: localUser.daily_goal,
      weekly_goal: localUser.weekly_goal,
      timezone: localUser.timezone,
      is_active: true,
      is_verified: false,
      created_at: localUser.created_at,
      last_login: null
    }
  }

  static apiUserToLocalUser(apiUser: any): LocalUser {
    return {
      id: apiUser.id,
      first_name: apiUser.first_name,
      last_name: apiUser.last_name,
      email: apiUser.email,
      daily_goal: apiUser.daily_goal || 5,
      weekly_goal: apiUser.weekly_goal || 25,
      timezone: apiUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      created_at: apiUser.created_at
    }
  }

  static localApplicationToApiApplication(localApp: LocalJobApplication): any {
    return {
      id: localApp.id,
      title: localApp.title,
      company: localApp.company,
      location: localApp.location,
      status: localApp.status,
      applied_date: localApp.applied_date,
      source_platform: localApp.source_platform,
      source_url: localApp.source_url,
      salary_text: localApp.salary_text,
      salary_min: localApp.salary_min,
      salary_max: localApp.salary_max,
      description: localApp.description,
      notes: localApp.notes,
      requirements: localApp.requirements,
      job_type: localApp.job_type,
      remote_ok: localApp.remote_ok,
      created_at: localApp.created_at,
      updated_at: localApp.updated_at
    }
  }

  static apiApplicationToLocalApplication(apiApp: any): LocalJobApplication {
    return {
      id: apiApp.id,
      title: apiApp.title,
      company: apiApp.company,
      location: apiApp.location,
      status: apiApp.status,
      applied_date: apiApp.applied_date,
      source_platform: apiApp.source_platform,
      source_url: apiApp.source_url,
      salary_text: apiApp.salary_text,
      salary_min: apiApp.salary_min,
      salary_max: apiApp.salary_max,
      description: apiApp.description,
      notes: apiApp.notes,
      requirements: apiApp.requirements,
      job_type: apiApp.job_type,
      remote_ok: apiApp.remote_ok,
      created_at: apiApp.created_at,
      updated_at: apiApp.updated_at
    }
  }
}

class DataManager {
  private static currentMode: DataMode = 'local'
  private static modeChangeListeners: ((mode: DataMode) => void)[] = []

  // Mode management
  static getCurrentMode(): DataMode {
    return this.currentMode
  }

  static setMode(mode: DataMode): void {
    this.currentMode = mode
    this.notifyModeChange()
    
    // Store mode preference
    localStorage.setItem('jobtracker_data_mode', mode)
  }

  static initializeMode(): void {
    // Check if user is authenticated
    const hasValidToken = AuthService.hasValidToken()
    
    // Check user's preference
    const savedMode = localStorage.getItem('jobtracker_data_mode') as DataMode
    
    if (hasValidToken && savedMode === 'authenticated') {
      this.setMode('authenticated')
    } else {
      this.setMode('local')
    }

    // Initialize local storage in case it's needed
    LocalStorageService.initialize()
  }

  static onModeChange(callback: (mode: DataMode) => void): () => void {
    this.modeChangeListeners.push(callback)
    return () => {
      this.modeChangeListeners = this.modeChangeListeners.filter(cb => cb !== callback)
    }
  }

  private static notifyModeChange(): void {
    this.modeChangeListeners.forEach(callback => callback(this.currentMode))
  }

  // User operations
  static async getUser(): Promise<any | null> {
    if (this.currentMode === 'authenticated') {
      try {
        const apiUser = await AuthService.getCurrentUser()
        return apiUser
      } catch (error) {
        console.error('Failed to fetch user from API, falling back to local:', error)
        // Fallback to local on API failure
        const localUser = LocalStorageService.getUser()
        return localUser ? DataTransforms.localUserToApiUser(localUser) : null
      }
    } else {
      const localUser = LocalStorageService.getUser()
      return localUser ? DataTransforms.localUserToApiUser(localUser) : null
    }
  }

  static async updateUserGoals(dailyGoal: number, weeklyGoal: number): Promise<boolean> {
    if (this.currentMode === 'authenticated') {
      try {
        const token = AuthService.getToken()
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/analytics/goals`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            daily_goal: dailyGoal,
            weekly_goal: weeklyGoal
          })
        })
        return response.ok
      } catch (error) {
        console.error('Failed to update goals via API:', error)
        return false
      }
    } else {
      LocalStorageService.updateUserGoals(dailyGoal, weeklyGoal)
      return true
    }
  }

  // Job Application operations
  static async getApplications(params?: any): Promise<any[]> {
    if (this.currentMode === 'authenticated') {
      try {
        const response = await jobApplicationsApi.getAll(params)
        return response.data
      } catch (error) {
        console.error('Failed to fetch applications from API, falling back to local:', error)
        // Fallback to local on API failure
        const localApps = LocalStorageService.getApplications(params)
        return localApps.map(DataTransforms.localApplicationToApiApplication)
      }
    } else {
      const localApps = LocalStorageService.getApplications(params)
      return localApps.map(DataTransforms.localApplicationToApiApplication)
    }
  }

  static async getApplicationById(id: string): Promise<any | null> {
    if (this.currentMode === 'authenticated') {
      try {
        const response = await jobApplicationsApi.getById(id)
        return response.data
      } catch (error) {
        console.error('Failed to fetch application from API, falling back to local:', error)
        // Fallback to local on API failure
        const localApp = LocalStorageService.getApplicationById(id)
        return localApp ? DataTransforms.localApplicationToApiApplication(localApp) : null
      }
    } else {
      const localApp = LocalStorageService.getApplicationById(id)
      return localApp ? DataTransforms.localApplicationToApiApplication(localApp) : null
    }
  }

  static async createApplication(applicationData: any): Promise<any> {
    if (this.currentMode === 'authenticated') {
      try {
        const response = await jobApplicationsApi.create(applicationData)
        return response.data
      } catch (error) {
        console.error('Failed to create application via API, falling back to local:', error)
        // Fallback to local on API failure
        const localApp = LocalStorageService.createApplication(applicationData)
        return DataTransforms.localApplicationToApiApplication(localApp)
      }
    } else {
      const localApp = LocalStorageService.createApplication(applicationData)
      return DataTransforms.localApplicationToApiApplication(localApp)
    }
  }

  static async updateApplication(id: string, updates: any): Promise<any | null> {
    if (this.currentMode === 'authenticated') {
      try {
        const response = await jobApplicationsApi.update(id, updates)
        return response.data
      } catch (error) {
        console.error('Failed to update application via API, falling back to local:', error)
        // Fallback to local on API failure
        const localApp = LocalStorageService.updateApplication(id, updates)
        return localApp ? DataTransforms.localApplicationToApiApplication(localApp) : null
      }
    } else {
      const localApp = LocalStorageService.updateApplication(id, updates)
      return localApp ? DataTransforms.localApplicationToApiApplication(localApp) : null
    }
  }

  static async deleteApplication(id: string): Promise<boolean> {
    if (this.currentMode === 'authenticated') {
      try {
        await jobApplicationsApi.delete(id)
        return true
      } catch (error) {
        console.error('Failed to delete application via API, falling back to local:', error)
        // Fallback to local on API failure
        return LocalStorageService.deleteApplication(id)
      }
    } else {
      return LocalStorageService.deleteApplication(id)
    }
  }

  // Analytics operations
  static async getAnalyticsSummary(): Promise<any> {
    if (this.currentMode === 'authenticated') {
      try {
        const response = await analyticsApi.getSummary()
        return response.data
      } catch (error) {
        console.error('Failed to fetch analytics from API, falling back to local:', error)
        // Fallback to local on API failure
        return LocalStorageService.getAnalyticsSummary()
      }
    } else {
      return LocalStorageService.getAnalyticsSummary()
    }
  }

  static async getTimeline(days: number = 30): Promise<any> {
    if (this.currentMode === 'authenticated') {
      try {
        const response = await analyticsApi.getTimeline(days)
        return response.data
      } catch (error) {
        console.error('Failed to fetch timeline from API, falling back to local:', error)
        // Generate local timeline
        const applications = LocalStorageService.getApplications()
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        
        const recentApps = applications.filter(app => 
          new Date(app.applied_date) >= cutoffDate
        )
        
        // Group by date
        const timeline = recentApps.reduce((acc, app) => {
          const date = app.applied_date.split('T')[0]
          if (!acc[date]) {
            acc[date] = { date, count: 0 }
          }
          acc[date].count++
          return acc
        }, {} as Record<string, { date: string, count: number }>)
        
        return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date))
      }
    } else {
      const applications = LocalStorageService.getApplications()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const recentApps = applications.filter(app => 
        new Date(app.applied_date) >= cutoffDate
      )
      
      // Group by date
      const timeline = recentApps.reduce((acc, app) => {
        const date = app.applied_date.split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, count: 0 }
        }
        acc[date].count++
        return acc
      }, {} as Record<string, { date: string, count: number }>)
      
      return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date))
    }
  }

  static async getStatusTimeline(days: number = 30): Promise<any> {
    if (this.currentMode === 'authenticated') {
      try {
        const response = await analyticsApi.getStatusTimeline(days)
        return response.data
      } catch (error) {
        console.error('Failed to fetch status timeline from API, using local fallback')
        return this.generateLocalStatusTimeline(days)
      }
    } else {
      return this.generateLocalStatusTimeline(days)
    }
  }

  private static generateLocalStatusTimeline(days: number): any {
    const applications = LocalStorageService.getApplications()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const recentApps = applications.filter(app => 
      new Date(app.applied_date) >= cutoffDate
    )
    
    // Simple status timeline - just count by status over time
    const timeline = recentApps.reduce((acc, app) => {
      const date = app.applied_date.split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, applied: 0, screening: 0, interview: 0, offer: 0, rejected: 0 }
      }
      acc[date][app.status as keyof typeof acc[string]]++
      return acc
    }, {} as Record<string, any>)
    
    return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date))
  }

  // Achievement operations
  static async getAchievements(): Promise<any> {
    if (this.currentMode === 'authenticated') {
      try {
        const token = AuthService.getToken()
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/social/achievements/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          return data
        } else {
          throw new Error('Failed to fetch achievements')
        }
      } catch (error) {
        console.error('Failed to fetch achievements from API, falling back to local:', error)
        // Fallback to local
        return { by_category: LocalStorageService.getAchievementsByCategory() }
      }
    } else {
      return { by_category: LocalStorageService.getAchievementsByCategory() }
    }
  }

  // Data synchronization
  static async syncLocalToServer(): Promise<{ success: boolean, message: string }> {
    if (this.currentMode !== 'authenticated') {
      return { success: false, message: 'Not in authenticated mode' }
    }

    try {
      const localApplications = LocalStorageService.getApplications()
      
      // Upload applications one by one
      let successCount = 0
      for (const localApp of localApplications) {
        try {
          await jobApplicationsApi.create(DataTransforms.localApplicationToApiApplication(localApp))
          successCount++
        } catch (error) {
          console.error('Failed to sync application:', localApp.title, error)
        }
      }

      return {
        success: successCount > 0,
        message: `Successfully synced ${successCount} out of ${localApplications.length} applications`
      }
    } catch (error) {
      console.error('Sync failed:', error)
      return { success: false, message: 'Sync failed: ' + (error as Error).message }
    }
  }

  // Export/Import
  static exportData(): string {
    return LocalStorageService.exportData()
  }

  static importData(jsonData: string): boolean {
    return LocalStorageService.importData(jsonData)
  }

  static clearLocalData(): void {
    LocalStorageService.clearAllData()
  }
}

export default DataManager
export { DataTransforms }