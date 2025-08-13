import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { API_BASE_URL } from '../services/api'

// Types for analytics data
export interface AnalyticsSummary {
  total_applications: number
  applications_this_week: number
  applications_today: number
  current_streak: number
  interview_rate: number
  status_distribution: { [key: string]: number }
  daily_goal: number
  weekly_goal: number
  goal_progress_today: number
  goal_progress_week: number
}

export interface TimelineData {
  timeline: { date: string; applications: number }[]
  period_days: number
  total_applications: number
}

export interface StatusTimelineData {
  timeline: { 
    date: string; 
    applied: number;
    screening: number;
    interview: number;
    offer: number;
    rejected: number;
  }[]
  period_days: number
  total_applications: number
}

export interface RoleDistribution {
  role_distribution: { role: string; count: number }[]
  top_titles: { title: string; count: number }[]
}

export interface CompanyAnalysis {
  top_companies: { name: string; size: string; industry: string; applications: number }[]
  company_size_distribution: { size: string; count: number }[]
  industry_distribution: { industry: string; count: number }[]
}

export interface SuccessRates {
  funnel: {
    applied: number
    screening: number
    interview: number
    offers: number
  }
  rates: {
    screening_rate: number
    interview_rate: number
    offer_rate: number
  }
}

export interface StreakData {
  current_streak: number
  longest_streak: number
  streak_calendar: { date: string; applications: number; goal_met: boolean }[]
  goals_met_last_30_days: number
}

// API client function
const fetchWithAuth = async <T = any>(endpoint: string): Promise<T> => {
  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('No authentication token')
  }

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Hook for analytics summary
export const useAnalyticsSummary = (): UseQueryResult<AnalyticsSummary> => {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics', 'summary'],
    queryFn: () => fetchWithAuth<AnalyticsSummary>('/analytics/summary'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for timeline data
export const useTimelineData = (days: number = 30): UseQueryResult<TimelineData> => {
  return useQuery<TimelineData>({
    queryKey: ['analytics', 'timeline', days],
    queryFn: () => fetchWithAuth<TimelineData>(`/analytics/timeline?days=${days}`),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}


// Hook for role distribution
export const useRoleDistribution = (): UseQueryResult<RoleDistribution> => {
  return useQuery<RoleDistribution>({
    queryKey: ['analytics', 'role-distribution'],
    queryFn: () => fetchWithAuth<RoleDistribution>('/analytics/role-distribution'),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Hook for company analysis
export const useCompanyAnalysis = (): UseQueryResult<CompanyAnalysis> => {
  return useQuery<CompanyAnalysis>({
    queryKey: ['analytics', 'company-analysis'],
    queryFn: () => fetchWithAuth<CompanyAnalysis>('/analytics/company-analysis'),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Hook for success rates
export const useSuccessRates = (): UseQueryResult<SuccessRates> => {
  return useQuery<SuccessRates>({
    queryKey: ['analytics', 'success-rates'],
    queryFn: () => fetchWithAuth<SuccessRates>('/analytics/success-rates'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Hook for streak analytics
export const useStreakAnalytics = (): UseQueryResult<StreakData> => {
  return useQuery<StreakData>({
    queryKey: ['analytics', 'streaks'],
    queryFn: () => fetchWithAuth<StreakData>('/analytics/streaks'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Hook for comprehensive analytics data
export const useAllAnalytics = (timeRange: number = 30) => {
  const summary = useAnalyticsSummary()
  const timeline = useTimelineData(timeRange)
  const roleDistribution = useRoleDistribution()
  const companyAnalysis = useCompanyAnalysis()
  const successRates = useSuccessRates()
  const streaks = useStreakAnalytics()

  return {
    summary,
    timeline,
    roleDistribution,
    companyAnalysis,
    successRates,
    streaks,
    isLoading: summary.isLoading || timeline.isLoading || roleDistribution.isLoading || 
               companyAnalysis.isLoading || successRates.isLoading || streaks.isLoading,
    isError: summary.isError || timeline.isError || roleDistribution.isError || 
             companyAnalysis.isError || successRates.isError || streaks.isError,
    error: summary.error || timeline.error || roleDistribution.error || 
           companyAnalysis.error || successRates.error || streaks.error,
  }
}

// Hook for data export
export const useDataExport = () => {
  const exportData = async (format: 'csv' | 'json', type: 'applications' | 'streaks' | 'analytics') => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token')
    }

    let endpoint = ''
    if (format === 'csv' && type === 'applications') {
      endpoint = '/analytics/export/applications/csv'
    } else if (format === 'csv' && type === 'streaks') {
      endpoint = '/analytics/export/streaks/csv'
    } else if (format === 'json' && type === 'analytics') {
      endpoint = '/analytics/export/analytics/json'
    } else {
      throw new Error('Invalid export configuration')
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const timestamp = new Date().toISOString().split('T')[0]
    a.download = `${type}_${timestamp}.${format}`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return { exportData }
}