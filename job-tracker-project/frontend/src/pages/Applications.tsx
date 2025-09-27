import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DataManager from '../services/dataManager'
import ApplicationDetail from '../components/ApplicationDetail'
import { formatDate } from '../utils/dateUtils'

interface JobApplication {
  id: string
  title: string
  company?: {
    id: string
    name: string
    website?: string
    industry?: string
    size?: string
  }
  location?: string
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected'
  applied_date: string
  source_platform?: string
  source_url?: string
  salary_text?: string
  description?: string
  notes?: string
  ai_match_score?: number
  interview_date?: string
  follow_up_date?: string
}


const statusOptions = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
]

export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'title' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [, setShowBulkActions] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    location: '',
    status: 'applied' as JobApplication['status'],
    salary_text: '',
    description: '',
    notes: '',
    source_platform: '',
    source_url: '',
    interview_date: '',
    follow_up_date: ''
  })

  // Fetch applications
  const fetchApplications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const data = await DataManager.getApplications()
      setApplications(data)
      setFilteredApplications(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Error loading applications')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Filter and sort applications
  useEffect(() => {
    let filtered = applications.filter(app => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      const matchesSearch = !searchTerm || 
        app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesStatus && matchesSearch
    })

    // Sort applications
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      if (sortBy === 'date') {
        aValue = new Date(a.applied_date)
        bValue = new Date(b.applied_date)
      } else if (sortBy === 'company') {
        aValue = a.company?.name.toLowerCase() || ''
        bValue = b.company?.name.toLowerCase() || ''
      } else if (sortBy === 'title') {
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
      } else if (sortBy === 'status') {
        aValue = a.status
        bValue = b.status
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredApplications(filtered)
  }, [applications, statusFilter, searchTerm, sortBy, sortOrder])

  // Add new application
  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await DataManager.createApplication({
        ...formData,
        applied_date: new Date().toISOString(),
        company: {
          id: '', // Will be generated
          name: formData.company,
        }
      })
      
      await fetchApplications()
      setShowAddModal(false)
      resetForm()
      setError(null)
    } catch (err) {
      console.error('Error adding application:', err)
      setError('Error adding application')
    }
  }

  // Update application
  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedApplication) return

    try {
      await DataManager.updateApplication(selectedApplication.id, {
        ...formData,
        company: {
          id: selectedApplication.company?.id || '',
          name: formData.company,
        }
      })
      
      await fetchApplications()
      setShowEditModal(false)
      resetForm()
      setSelectedApplication(null)
      setError(null)
    } catch (err) {
      console.error('Error updating application:', err)
      setError('Error updating application')
    }
  }


  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      company_name: '',
      location: '',
      status: 'applied',
      salary_text: '',
      description: '',
      notes: '',
      source_platform: '',
      source_url: '',
      interview_date: '',
      follow_up_date: ''
    })
  }


  // Open detail modal
  const openDetailModal = (application: JobApplication) => {
    setSelectedApplication(application)
    setShowDetailModal(true)
  }

  // Get follow-up reminders
  const getFollowUpReminders = () => {
    const today = new Date()
    const reminders = applications.filter(app => {
      if (!app.follow_up_date) return false
      const followUpDate = new Date(app.follow_up_date)
      const daysDiff = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
      return daysDiff <= 3 && daysDiff >= 0
    })
    return reminders
  }

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)))
    } else {
      setSelectedApplications(new Set())
    }
  }

  const handleSelectApplication = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedApplications)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedApplications(newSelected)
  }

  const bulkUpdateStatus = async (status: JobApplication['status']) => {
    try {
      const promises = Array.from(selectedApplications).map(id =>
        fetch(`${API_BASE_URL}/api/job-applications/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        })
      )

      await Promise.all(promises)
      await fetchApplications()
      setSelectedApplications(new Set())
      setShowBulkActions(false)
    } catch (err) {
      setError('Failed to update applications')
    }
  }

  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedApplications.size} applications?`)) return

    try {
      const promises = Array.from(selectedApplications).map(id =>
        fetch(`${API_BASE_URL}/api/job-applications/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      )

      await Promise.all(promises)
      await fetchApplications()
      setSelectedApplications(new Set())
      setShowBulkActions(false)
    } catch (err) {
      setError('Failed to delete applications')
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setStatusDropdownOpen(null)
    }
    if (statusDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [statusDropdownOpen])

  // Handle URL parameters
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true)
      // Remove the parameter from URL
      searchParams.delete('add')
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams])

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption ? statusOption : statusOptions[0]
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      await DataManager.updateApplication(applicationId, { status: newStatus })
      
      // Update local state immediately for better UX
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: newStatus as JobApplication['status'] } : app
      ))
      setStatusDropdownOpen(null) // Close dropdown
      setError(null)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Error updating status')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <span className="mr-3">📋</span>
                Job Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage and track your job applications
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <span className="mr-2">+</span>
              Add Application
            </button>
          </div>

          {/* Follow-up Reminders */}
          {!loading && getFollowUpReminders().length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-xl">⏰</span>
                </div>
                <div className="ml-3 w-full">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Upcoming Follow-ups</h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <div className="space-y-1">
                      {getFollowUpReminders().map(app => {
                        const followUpDate = new Date(app.follow_up_date!)
                        const today = new Date()
                        const daysDiff = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
                        return (
                          <div key={app.id} className="flex justify-between items-center">
                            <span>
                              <strong>{app.title}</strong> at {app.company?.name || 'Unknown Company'}
                            </span>
                            <span className="text-xs">
                              {daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Tomorrow' : `In ${daysDiff} days`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="date">Date Applied</option>
                  <option value="company">Company</option>
                  <option value="title">Job Title</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-400"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading applications...</span>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedApplications.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  {selectedApplications.size} application{selectedApplications.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkUpdateStatus(e.target.value as JobApplication['status'])
                      e.target.value = ''
                    }
                  }}
                  className="input text-sm"
                  defaultValue=""
                >
                  <option value="">Update Status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={bulkDelete}
                  className="btn-secondary text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedApplications(new Set())}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        {!loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {applications.length === 0 
                    ? "Start tracking your job applications by adding your first one."
                    : "Try adjusting your filters to see more results."
                  }
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                >
                  Add Your First Application
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-80">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-72">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-60">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                        Website
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Applied Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredApplications.map((application) => {
                      const statusBadge = getStatusBadge(application.status)
                      return (
                        <tr 
                          key={application.id} 
                          data-app-id={application.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={(e) => {
                            // Don't open detail if clicking on checkbox or links
                            const target = e.target as HTMLElement;
                            if (
                              target.closest('input[type="checkbox"]') ||
                              target.closest('a') ||
                              target.tagName === 'A' ||
                              (target as HTMLInputElement).type === 'checkbox'
                            ) {
                              return;
                            }
                            openDetailModal(application);
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedApplications.has(application.id)}
                              onChange={(e) => handleSelectApplication(application.id, e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-64 overflow-x-auto scrollbar-hide">
                              <div className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                {application.title}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-56 overflow-x-auto scrollbar-hide">
                              <div className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                {application.company?.name || 'Unknown Company'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-56 overflow-x-auto scrollbar-hide">
                              <div className="text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                {application.location || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs overflow-x-auto scrollbar-hide">
                              {application.source_platform && application.source_url ? (
                                <a 
                                  href={application.source_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium whitespace-nowrap"
                                >
                                  {application.source_platform}
                                </a>
                              ) : application.source_platform ? (
                                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {application.source_platform}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="relative inline-block">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  const dropdownWidth = 160 // 40 * 4 in pixels
                                  setDropdownPosition({
                                    top: rect.bottom + window.scrollY + 8,
                                    left: Math.max(8, Math.min(
                                      window.innerWidth - dropdownWidth - 8,
                                      rect.left + window.scrollX - (dropdownWidth / 2) + (rect.width / 2)
                                    ))
                                  })
                                  setStatusDropdownOpen(statusDropdownOpen === application.id ? null : application.id)
                                }}
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.color} hover:opacity-80 cursor-pointer transition-opacity`}
                              >
                                {statusBadge.label}
                              </button>
                              
                              {statusDropdownOpen === application.id && (
                                <div 
                                  className="fixed w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999]"
                                  style={{
                                    top: `${dropdownPosition.top}px`,
                                    left: `${dropdownPosition.left}px`
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-2">
                                    {statusOptions.map((option) => {
                                      const isSelected = application.status === option.value
                                      const colorClasses = {
                                        'applied': 'text-blue-700 bg-blue-50 border-blue-200',
                                        'screening': 'text-yellow-700 bg-yellow-50 border-yellow-200', 
                                        'interview': 'text-purple-700 bg-purple-50 border-purple-200',
                                        'offer': 'text-green-700 bg-green-50 border-green-200',
                                        'rejected': 'text-red-700 bg-red-50 border-red-200'
                                      }
                                      const darkColorClasses = {
                                        'applied': 'dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-800',
                                        'screening': 'dark:text-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-800',
                                        'interview': 'dark:text-purple-300 dark:bg-purple-900/20 dark:border-purple-800', 
                                        'offer': 'dark:text-green-300 dark:bg-green-900/20 dark:border-green-800',
                                        'rejected': 'dark:text-red-300 dark:bg-red-900/20 dark:border-red-800'
                                      }
                                      
                                      return (
                                        <button
                                          key={option.value}
                                          onClick={() => updateApplicationStatus(application.id, option.value)}
                                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2 ${
                                            isSelected 
                                              ? `${colorClasses[option.value as keyof typeof colorClasses]} ${darkColorClasses[option.value as keyof typeof darkColorClasses]} font-medium border-l-2` 
                                              : 'text-gray-700 dark:text-gray-300'
                                          }`}
                                        >
                                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                            option.value === 'applied' ? 'bg-blue-500' :
                                            option.value === 'screening' ? 'bg-yellow-500' :
                                            option.value === 'interview' ? 'bg-purple-500' :
                                            option.value === 'offer' ? 'bg-green-500' :
                                            'bg-red-500'
                                          }`}></div>
                                          <span className="flex-1">{option.label}</span>
                                          {isSelected && (
                                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(application.applied_date)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Application</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-400"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddApplication} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salary
                  </label>
                  <input
                    type="text"
                    value={formData.salary_text}
                    onChange={(e) => setFormData({...formData, salary_text: e.target.value})}
                    className="input w-full"
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job URL
                </label>
                <input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({...formData, source_url: e.target.value})}
                  className="input w-full"
                  placeholder="https://company.com/careers/job-posting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input w-full h-24"
                  placeholder="Paste the job description here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input w-full h-20"
                  placeholder="Add any notes about this application..."
                />
              </div>


              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {showEditModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Application</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-400"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateApplication} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salary
                  </label>
                  <input
                    type="text"
                    value={formData.salary_text}
                    onChange={(e) => setFormData({...formData, salary_text: e.target.value})}
                    className="input w-full"
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job URL
                </label>
                <input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({...formData, source_url: e.target.value})}
                  className="input w-full"
                  placeholder="https://company.com/careers/job-posting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input w-full h-24"
                  placeholder="Paste the job description here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input w-full h-20"
                  placeholder="Add any notes about this application..."
                />
              </div>


              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {showDetailModal && selectedApplication && (
        <ApplicationDetail
          applicationId={selectedApplication.id}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedApplication(null)
            // Refresh data without loading state
            fetchApplications(false)
          }}
          onUpdate={() => {}}
        />
      )}
    </div>
  )
}