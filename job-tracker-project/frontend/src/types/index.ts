export * from './auth'

// Common types
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Job Application Types
export interface JobApplication extends BaseEntity {
  company_id?: string
  company?: Company
  position: string
  status: 'applied' | 'screening' | 'interviewing' | 'offer' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  application_date: string
  job_url?: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  location?: string
  job_type?: string
  description?: string
  requirements?: string
  benefits?: string
  notes?: string
  interview_date?: string
  interview_time?: string
  interview_type?: 'phone' | 'virtual' | 'onsite'
  interview_notes?: string
  offer_amount?: number
  offer_details?: string
  offer_deadline?: string
  rejection_reason?: string
  rejection_feedback?: string
}

// Company Types
export interface Company extends BaseEntity {
  name: string
  industry?: string
  size?: string
  location?: string
  website?: string
  logo_url?: string
  description?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}