import { useState, useEffect } from 'react'
import InterviewScheduler from './InterviewScheduler'
import { API_BASE_URL } from '../services/api'

interface JobApplication {
  id: string
  title: string
  company?: {
    id: string
    name: string
    website?: string
  }
  location?: string
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected'
  applied_date: string
  source_platform?: string
  source_url?: string
  salary_min?: number
  salary_max?: number
  description?: string
  notes?: string
}

interface ApplicationDetailProps {
  applicationId: string
  onClose: () => void
  onUpdate: () => void
}

const statusOptions = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
]

export default function ApplicationDetail({ applicationId, onClose, onUpdate }: ApplicationDetailProps) {
  const [application, setApplication] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showInterviewScheduler, setShowInterviewScheduler] = useState(false)

  // Form data for editing
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    status: 'applied' as JobApplication['status'],
    salary_min: '',
    salary_max: '',
    description: '',
    notes: '',
    source_platform: ''
  })

  // Fetch application details
  const fetchApplication = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/job-applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApplication(data)
        setFormData({
          title: data.title,
          company_name: data.company?.name || '',
          location: data.location || '',
          status: data.status,
          salary_min: data.salary_min || '',
          salary_max: data.salary_max || '',
          description: data.description || '',
          notes: data.notes || '',
          source_platform: data.source_platform || ''
        })
      } else {
        setError('Failed to fetch application details')
      }
    } catch (err) {
      setError('Network error while fetching application')
    } finally {
      setLoading(false)
    }
  }

  // Update application
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/job-applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          salary_min: formData.salary_min ? Number(formData.salary_min) : undefined,
          salary_max: formData.salary_max ? Number(formData.salary_max) : undefined
        })
      })

      if (response.ok) {
        // Update local state without re-fetching
        setApplication(prev => prev ? {
          ...prev,
          title: formData.title,
          company: prev.company ? {
            ...prev.company,
            name: formData.company_name
          } : { id: '', name: formData.company_name },
          location: formData.location,
          status: formData.status,
          salary_min: formData.salary_min ? Number(formData.salary_min) : undefined,
          salary_max: formData.salary_max ? Number(formData.salary_max) : undefined,
          description: formData.description,
          notes: formData.notes,
          source_platform: formData.source_platform
        } : null)
        setIsEditing(false)
        onUpdate()
      } else {
        const errorData = await response.json()
        // Handle validation errors properly
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((err: any) => err.msg).join(', ')
          setError(`Validation error: ${errorMessages}`)
        } else {
          setError(errorData.detail || 'Failed to update application')
        }
      }
    } catch (err) {
      setError('Network error while updating application')
    }
  }

  // Single quick update function for all sidebar inputs
  const handleQuickUpdate = async () => {
    try {
      console.log('💾 Quick update - saving form data:', formData)
      const response = await fetch(`${API_BASE_URL}/api/job-applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          salary_min: formData.salary_min ? Number(formData.salary_min) : undefined,
          salary_max: formData.salary_max ? Number(formData.salary_max) : undefined
        })
      })

      if (response.ok) {
        console.log('✅ Quick update successful')
        setApplication(prev => prev ? {
          ...prev,
          notes: formData.notes,
          salary_min: formData.salary_min ? Number(formData.salary_min) : undefined,
          salary_max: formData.salary_max ? Number(formData.salary_max) : undefined
        } : null)
        onUpdate()
      } else {
        const errorData = await response.json()
        console.error('❌ Quick update failed:', errorData)
        // Handle validation errors properly
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((err: any) => err.msg).join(', ')
          setError(`Validation error: ${errorMessages}`)
        } else {
          setError(errorData.detail || 'Failed to update application')
        }
      }
    } catch (err) {
      console.error('❌ Quick update error:', err)
      setError('Network error while updating application')
    }
  }

  useEffect(() => {
    fetchApplication()
  }, [applicationId])

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption || statusOptions[0]
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-60 flex items-center justify-center z-50 invisible">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading application details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Application Not Found</h3>
            <button onClick={onClose} className="btn-primary">Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{application.title}</h2>
            <p className="text-gray-600 dark:text-gray-300">{application.company?.name || 'Unknown Company'}</p>
          </div>
          <div className="flex items-center space-x-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 dark:text-red-300">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="input w-full"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Salary
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={formData.salary_min}
                      onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                      className="input w-full"
                      placeholder="80000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Salary
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={formData.salary_max}
                      onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                      className="input w-full"
                      placeholder="100000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source Platform
                  </label>
                  <input
                    type="text"
                    value={formData.source_platform}
                    onChange={(e) => setFormData({...formData, source_platform: e.target.value})}
                    className="input w-full"
                    placeholder="e.g., LinkedIn, Indeed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input w-full h-32"
                  placeholder="Job description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input w-full h-24"
                  placeholder="Add notes about this application..."
                />
              </div>


              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Application Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Application Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
                        <p className="text-gray-900 dark:text-gray-100">{application.company?.name || 'Unknown Company'}</p>
                      </div>
                      {application.location && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                          <p className="text-gray-900 dark:text-gray-100">📍 {application.location}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Applied Date</label>
                        <p className="text-gray-900 dark:text-gray-100">{new Date(application.applied_date).toLocaleDateString()}</p>
                      </div>
                      {application.source_platform && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</label>
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900 dark:text-gray-100">{application.source_platform}</p>
                            {application.source_url && (
                              <a
                                href={application.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                              >
                                🔗 View Original
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Description */}
                  {application.description && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Job Description</h3>
                      <div className="max-h-96 overflow-y-auto">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{application.description}</p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Status */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">Current Status</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(application.status).color}`}>
                        {getStatusBadge(application.status).label}
                      </span>
                    </div>
                  </div>

                  {/* Quick Notes */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📝 Quick Notes</h3>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      onBlur={handleQuickUpdate}
                      className="input w-full"
                      placeholder="Add your notes about this application..."
                    />
                  </div>

                  {/* Salary Info */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">💰 Salary Range</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Min</label>
                        <input
                          type="number"
                          step="5000"
                          value={formData.salary_min}
                          onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                          onBlur={handleQuickUpdate}
                          className="input w-full text-sm"
                          placeholder="80000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Max</label>
                        <input
                          type="number"
                          step="5000"
                          value={formData.salary_max}
                          onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                          onBlur={handleQuickUpdate}
                          className="input w-full text-sm"
                          placeholder="100000"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interview Scheduler Modal */}
      {showInterviewScheduler && application && (
        <InterviewScheduler
          applicationId={application.id}
          applicationTitle={application.title}
          companyName={application.company?.name || 'Unknown Company'}
          currentInterviewDate={undefined}
          onClose={() => setShowInterviewScheduler(false)}
          onUpdate={() => {
            fetchApplication()
            onUpdate()
          }}
        />
      )}
    </div>
  )
}