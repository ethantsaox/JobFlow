import { v4 as uuidv4 } from 'uuid'

// Local data types - matching API structures
interface LocalUser {
  id: string
  first_name: string
  last_name: string
  email?: string
  daily_goal: number
  weekly_goal: number
  timezone: string
  created_at: string
}

interface LocalJobApplication {
  id: string
  title: string
  company: {
    id: string
    name: string
    website?: string
    industry?: string
    size?: string
  }
  location?: string
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  applied_date: string
  source_platform?: string
  source_url?: string
  salary_text?: string
  salary_min?: number
  salary_max?: number
  description?: string
  notes?: string
  requirements?: string
  job_type?: string
  remote_ok?: boolean
  created_at: string
  updated_at: string
}

interface LocalCompany {
  id: string
  name: string
  website?: string
  industry?: string
  size?: string
  created_at: string
}

interface LocalStreak {
  id: string
  start_date: string
  end_date?: string
  current_count: number
  is_active: boolean
  created_at: string
}

interface LocalAchievement {
  id: string
  title: string
  description: string
  icon?: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  category: string
  unlocked: boolean
  unlocked_at?: string
  progress?: number
  target?: number
}

class LocalStorageService {
  private static readonly KEYS = {
    USER: 'jobtracker_local_user',
    APPLICATIONS: 'jobtracker_local_applications',
    COMPANIES: 'jobtracker_local_companies',
    STREAKS: 'jobtracker_local_streaks',
    ACHIEVEMENTS: 'jobtracker_local_achievements',
    SETTINGS: 'jobtracker_local_settings',
    VERSION: 'jobtracker_local_version'
  }

  private static readonly CURRENT_VERSION = '1.0.0'

  // Initialize local storage with default data
  static initialize(): void {
    const version = localStorage.getItem(this.KEYS.VERSION)
    
    if (!version || version !== this.CURRENT_VERSION) {
      this.setupDefaults()
      localStorage.setItem(this.KEYS.VERSION, this.CURRENT_VERSION)
    }
  }

  private static setupDefaults(): void {
    // Create default user if none exists
    if (!this.getUser()) {
      const defaultUser: LocalUser = {
        id: uuidv4(),
        first_name: 'Guest',
        last_name: 'User',
        daily_goal: 5,
        weekly_goal: 25,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        created_at: new Date().toISOString()
      }
      this.saveUser(defaultUser)
    }

    // Initialize empty arrays if they don't exist
    if (!localStorage.getItem(this.KEYS.APPLICATIONS)) {
      localStorage.setItem(this.KEYS.APPLICATIONS, JSON.stringify([]))
    }
    if (!localStorage.getItem(this.KEYS.COMPANIES)) {
      localStorage.setItem(this.KEYS.COMPANIES, JSON.stringify([]))
    }
    if (!localStorage.getItem(this.KEYS.ACHIEVEMENTS)) {
      this.setupDefaultAchievements()
    }
  }

  private static setupDefaultAchievements(): void {
    const defaultAchievements: LocalAchievement[] = [
      {
        id: uuidv4(),
        title: 'First Steps',
        description: 'Submit your first job application',
        icon: '🎯',
        rarity: 'common',
        category: 'applications',
        unlocked: false,
        target: 1
      },
      {
        id: uuidv4(),
        title: 'Getting Started',
        description: 'Submit 5 job applications',
        icon: '📝',
        rarity: 'common',
        category: 'applications',
        unlocked: false,
        target: 5
      },
      {
        id: uuidv4(),
        title: 'Dedicated Applicant',
        description: 'Submit 25 job applications',
        icon: '💼',
        rarity: 'uncommon',
        category: 'applications',
        unlocked: false,
        target: 25
      },
      {
        id: uuidv4(),
        title: 'Job Hunting Pro',
        description: 'Submit 50 job applications',
        icon: '🚀',
        rarity: 'rare',
        category: 'applications',
        unlocked: false,
        target: 50
      },
      {
        id: uuidv4(),
        title: 'Consistency King',
        description: 'Maintain a 7-day application streak',
        icon: '🔥',
        rarity: 'uncommon',
        category: 'streaks',
        unlocked: false,
        target: 7
      }
    ]
    localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(defaultAchievements))
  }

  // User operations
  static getUser(): LocalUser | null {
    const userData = localStorage.getItem(this.KEYS.USER)
    return userData ? JSON.parse(userData) : null
  }

  static saveUser(user: LocalUser): void {
    localStorage.setItem(this.KEYS.USER, JSON.stringify(user))
  }

  static updateUserGoals(dailyGoal: number, weeklyGoal: number): void {
    const user = this.getUser()
    if (user) {
      user.daily_goal = dailyGoal
      user.weekly_goal = weeklyGoal
      this.saveUser(user)
    }
  }

  // Job Applications operations
  static getApplications(params?: { 
    status?: string, 
    search?: string, 
    sortBy?: string,
    limit?: number,
    offset?: number 
  }): LocalJobApplication[] {
    const data = localStorage.getItem(this.KEYS.APPLICATIONS)
    let applications: LocalJobApplication[] = data ? JSON.parse(data) : []

    // Apply filters
    if (params?.status && params.status !== 'all') {
      applications = applications.filter(app => app.status === params.status)
    }

    if (params?.search) {
      const searchTerm = params.search.toLowerCase()
      applications = applications.filter(app =>
        app.title.toLowerCase().includes(searchTerm) ||
        app.company.name.toLowerCase().includes(searchTerm) ||
        app.location?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply sorting
    if (params?.sortBy) {
      applications.sort((a, b) => {
        switch (params.sortBy) {
          case 'date':
            return new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime()
          case 'company':
            return a.company.name.localeCompare(b.company.name)
          case 'title':
            return a.title.localeCompare(b.title)
          case 'status':
            return a.status.localeCompare(b.status)
          default:
            return 0
        }
      })
    }

    // Apply pagination
    if (params?.limit) {
      const start = params.offset || 0
      applications = applications.slice(start, start + params.limit)
    }

    return applications
  }

  static getApplicationById(id: string): LocalJobApplication | null {
    const applications = this.getApplications()
    return applications.find(app => app.id === id) || null
  }

  static createApplication(applicationData: Omit<LocalJobApplication, 'id' | 'created_at' | 'updated_at'>): LocalJobApplication {
    const applications = this.getApplications()
    
    // Find or create company
    const company = this.findOrCreateCompany(applicationData.company.name, applicationData.company)
    
    const newApplication: LocalJobApplication = {
      ...applicationData,
      id: uuidv4(),
      company,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    applications.push(newApplication)
    localStorage.setItem(this.KEYS.APPLICATIONS, JSON.stringify(applications))

    // Update streak and check achievements
    this.updateStreaks()
    this.checkAchievements()

    return newApplication
  }

  static updateApplication(id: string, updates: Partial<LocalJobApplication>): LocalJobApplication | null {
    const applications = this.getApplications()
    const index = applications.findIndex(app => app.id === id)

    if (index === -1) return null

    applications[index] = {
      ...applications[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    localStorage.setItem(this.KEYS.APPLICATIONS, JSON.stringify(applications))
    return applications[index]
  }

  static deleteApplication(id: string): boolean {
    const applications = this.getApplications()
    const filtered = applications.filter(app => app.id !== id)
    
    if (filtered.length === applications.length) return false

    localStorage.setItem(this.KEYS.APPLICATIONS, JSON.stringify(filtered))
    return true
  }

  // Company operations
  static getCompanies(): LocalCompany[] {
    const data = localStorage.getItem(this.KEYS.COMPANIES)
    return data ? JSON.parse(data) : []
  }

  static findOrCreateCompany(name: string, companyData?: Partial<LocalCompany>): LocalCompany {
    const companies = this.getCompanies()
    const existing = companies.find(c => c.name.toLowerCase() === name.toLowerCase())

    if (existing) {
      // Update with any new data
      if (companyData) {
        Object.assign(existing, companyData)
        localStorage.setItem(this.KEYS.COMPANIES, JSON.stringify(companies))
      }
      return existing
    }

    // Create new company
    const newCompany: LocalCompany = {
      id: uuidv4(),
      name,
      ...companyData,
      created_at: new Date().toISOString()
    }

    companies.push(newCompany)
    localStorage.setItem(this.KEYS.COMPANIES, JSON.stringify(companies))
    return newCompany
  }

  // Analytics operations
  static getAnalyticsSummary(): any {
    const applications = this.getApplications()
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const thisWeek = applications.filter(app => 
      new Date(app.applied_date) >= startOfWeek
    )
    const today = applications.filter(app => 
      new Date(app.applied_date) >= startOfDay
    )

    const statusDistribution = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const interviewApplications = applications.filter(app => 
      app.status === 'interview' || app.status === 'offer'
    )
    const interviewRate = applications.length > 0 
      ? Math.round((interviewApplications.length / applications.length) * 100)
      : 0

    const user = this.getUser()
    const currentStreak = this.getCurrentStreak()

    return {
      total_applications: applications.length,
      applications_this_week: thisWeek.length,
      applications_today: today.length,
      current_streak: currentStreak?.current_count || 0,
      interview_rate: interviewRate,
      daily_goal: user?.daily_goal || 5,
      weekly_goal: user?.weekly_goal || 25,
      goal_progress_today: Math.min(100, (today.length / (user?.daily_goal || 5)) * 100),
      goal_progress_week: Math.min(100, (thisWeek.length / (user?.weekly_goal || 25)) * 100),
      status_distribution: statusDistribution
    }
  }

  // Streak operations
  private static updateStreaks(): void {
    const applications = this.getApplications()
    const today = new Date().toISOString().split('T')[0]
    
    // Check if user applied today
    const todayApplications = applications.filter(app => 
      app.applied_date.split('T')[0] === today
    )

    if (todayApplications.length === 0) return

    let streaks = this.getStreaks()
    let currentStreak = streaks.find(s => s.is_active)

    if (!currentStreak) {
      // Start new streak
      currentStreak = {
        id: uuidv4(),
        start_date: today,
        current_count: 1,
        is_active: true,
        created_at: new Date().toISOString()
      }
      streaks.push(currentStreak)
    } else {
      // Update existing streak
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const lastActivityDate = applications
        .filter(app => new Date(app.applied_date) < new Date(today + 'T00:00:00'))
        .sort((a, b) => new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime())[0]?.applied_date.split('T')[0]

      if (lastActivityDate === yesterdayStr) {
        // Continue streak
        currentStreak.current_count += 1
      } else if (lastActivityDate !== today) {
        // Reset streak
        currentStreak.end_date = lastActivityDate
        currentStreak.is_active = false
        
        // Start new streak
        const newStreak = {
          id: uuidv4(),
          start_date: today,
          current_count: 1,
          is_active: true,
          created_at: new Date().toISOString()
        }
        streaks.push(newStreak)
      }
    }

    localStorage.setItem(this.KEYS.STREAKS, JSON.stringify(streaks))
  }

  static getStreaks(): LocalStreak[] {
    const data = localStorage.getItem(this.KEYS.STREAKS)
    return data ? JSON.parse(data) : []
  }

  static getCurrentStreak(): LocalStreak | null {
    const streaks = this.getStreaks()
    return streaks.find(s => s.is_active) || null
  }

  // Achievement operations
  private static checkAchievements(): void {
    const achievements = this.getAchievements()
    const applications = this.getApplications()
    const currentStreak = this.getCurrentStreak()

    let updated = false

    achievements.forEach(achievement => {
      if (achievement.unlocked) return

      let progress = 0
      let shouldUnlock = false

      switch (achievement.category) {
        case 'applications':
          progress = applications.length
          shouldUnlock = progress >= (achievement.target || 0)
          break
        case 'streaks':
          progress = currentStreak?.current_count || 0
          shouldUnlock = progress >= (achievement.target || 0)
          break
      }

      achievement.progress = progress

      if (shouldUnlock) {
        achievement.unlocked = true
        achievement.unlocked_at = new Date().toISOString()
        updated = true
      }
    })

    if (updated) {
      localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(achievements))
    }
  }

  static getAchievements(): LocalAchievement[] {
    const data = localStorage.getItem(this.KEYS.ACHIEVEMENTS)
    return data ? JSON.parse(data) : []
  }

  static getAchievementsByCategory(): Record<string, LocalAchievement[]> {
    const achievements = this.getAchievements()
    return achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = []
      }
      acc[achievement.category].push(achievement)
      return acc
    }, {} as Record<string, LocalAchievement[]>)
  }

  // Export/Import functionality
  static exportData(): string {
    const data = {
      user: this.getUser(),
      applications: this.getApplications(),
      companies: this.getCompanies(),
      streaks: this.getStreaks(),
      achievements: this.getAchievements(),
      version: this.CURRENT_VERSION,
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      // Validate data structure
      if (!data.version || !data.user) {
        throw new Error('Invalid data format')
      }

      // Import data
      if (data.user) localStorage.setItem(this.KEYS.USER, JSON.stringify(data.user))
      if (data.applications) localStorage.setItem(this.KEYS.APPLICATIONS, JSON.stringify(data.applications))
      if (data.companies) localStorage.setItem(this.KEYS.COMPANIES, JSON.stringify(data.companies))
      if (data.streaks) localStorage.setItem(this.KEYS.STREAKS, JSON.stringify(data.streaks))
      if (data.achievements) localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(data.achievements))

      localStorage.setItem(this.KEYS.VERSION, this.CURRENT_VERSION)
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }

  static clearAllData(): void {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }
}

export default LocalStorageService
export type { LocalUser, LocalJobApplication, LocalCompany, LocalStreak, LocalAchievement }