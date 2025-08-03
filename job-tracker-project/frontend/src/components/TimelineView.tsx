import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

interface TimelineEvent {
  id: string
  type: 'application' | 'status_change' | 'interview' | 'follow_up' | 'interaction'
  date: string
  title: string
  description: string
  application_title?: string
  company_name?: string
  status?: string
  metadata?: any
}

interface TimelineViewProps {
  applicationId?: string // Optional: filter to specific application
}

export default function TimelineView({ applicationId }: TimelineViewProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'application' | 'status_change' | 'interview' | 'interaction'>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    fetchTimelineEvents()
  }, [applicationId, dateRange])

  const fetchTimelineEvents = async () => {
    try {
      setLoading(true)
      
      // Calculate date filter
      const now = new Date()
      const fromDate = new Date()
      switch (dateRange) {
        case 'week':
          fromDate.setDate(now.getDate() - 7)
          break
        case 'month':
          fromDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          fromDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          fromDate.setFullYear(now.getFullYear() - 1)
          break
      }

      const events: TimelineEvent[] = []

      // Fetch job applications
      const appsResponse = await fetch('http://localhost:8000/api/job-applications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      })

      if (appsResponse.ok) {
        const applications = await appsResponse.json()
        
        for (const app of applications) {
          if (applicationId && app.id !== applicationId) continue
          
          // Add application creation event
          if (new Date(app.applied_date) >= fromDate) {
            events.push({
              id: `app-${app.id}`,
              type: 'application',
              date: app.applied_date,
              title: 'Applied to position',
              description: `Applied for ${app.title} at ${app.company_name}`,
              application_title: app.title,
              company_name: app.company_name,
              metadata: app
            })
          }

          // Fetch status transitions for this application
          try {
            const transitionsResponse = await fetch(`http://localhost:8000/api/status/transitions/${app.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              }
            })

            if (transitionsResponse.ok) {
              const transitions = await transitionsResponse.json()
              
              for (const transition of transitions) {
                if (new Date(transition.transition_date) >= fromDate) {
                  events.push({
                    id: `transition-${transition.id}`,
                    type: 'status_change',
                    date: transition.transition_date,
                    title: 'Status updated',
                    description: `Status changed from ${transition.from_status || 'initial'} to ${transition.to_status}`,
                    application_title: app.title,
                    company_name: app.company_name,
                    status: transition.to_status,
                    metadata: { ...transition, application: app }
                  })
                }
              }
            }
          } catch (err) {
            console.warn('Failed to fetch transitions for application:', app.id)
          }

          // Fetch interviews for this application
          try {
            const interviewsResponse = await fetch(`http://localhost:8000/api/interviews/job-application/${app.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              }
            })

            if (interviewsResponse.ok) {
              const result = await interviewsResponse.json()
              const interviews = result.interviews || []
              
              for (const interview of interviews) {
                if (interview.scheduled_date && new Date(interview.scheduled_date) >= fromDate) {
                  events.push({
                    id: `interview-${interview.id}`,
                    type: 'interview',
                    date: interview.scheduled_date,
                    title: `${interview.interview_type} interview ${interview.status === 'completed' ? 'completed' : 'scheduled'}`,
                    description: `${interview.interview_type} interview ${interview.interviewer_name ? `with ${interview.interviewer_name}` : ''}`,
                    application_title: app.title,
                    company_name: app.company_name,
                    metadata: { ...interview, application: app }
                  })
                }
              }
            }
          } catch (err) {
            console.warn('Failed to fetch interviews for application:', app.id)
          }
        }
      }

      // Sort events by date (newest first)
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setEvents(events)
    } catch (err) {
      setError('Failed to fetch timeline events')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    return event.type === filter
  })

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'application': return '📝'
      case 'status_change': return '🔄'
      case 'interview': return '👥'
      case 'follow_up': return '📞'
      case 'interaction': return '💬'
      default: return '📌'
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'application': return 'bg-blue-100 border-blue-300 text-blue-700'
      case 'status_change': return 'bg-purple-100 border-purple-300 text-purple-700'
      case 'interview': return 'bg-green-100 border-green-300 text-green-700'
      case 'follow_up': return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      case 'interaction': return 'bg-indigo-100 border-indigo-300 text-indigo-700'
      default: return 'bg-gray-100 border-gray-300 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading timeline...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input"
            >
              <option value="all">All Events</option>
              <option value="application">Applications</option>
              <option value="status_change">Status Changes</option>
              <option value="interview">Interviews</option>
              <option value="interaction">Interactions</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="input"
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past 3 Months</option>
              <option value="year">Past Year</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 self-end pb-2">
            {filteredEvents.length} events found
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">
              No timeline events found for the selected time range and filters.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Timeline events */}
              <div className="space-y-6">
                {filteredEvents.map((event, index) => (
                  <div key={event.id} className="relative flex items-start">
                    {/* Timeline dot */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-full border-4 ${getEventColor(event.type)} flex items-center justify-center text-xl z-10`}>
                      {getEventIcon(event.type)}
                    </div>
                    
                    {/* Event content */}
                    <div className="ml-6 flex-grow">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            {event.application_title && (
                              <p className="text-sm text-gray-600">
                                {event.application_title} • {event.company_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{formatDate(event.date)}</div>
                            <div>{formatTime(event.date)}</div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 text-sm">{event.description}</p>
                        
                        {/* Status badge for status changes */}
                        {event.type === 'status_change' && event.status && (
                          <div className="mt-2">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {event.status}
                            </span>
                          </div>
                        )}
                        
                        {/* Interview details */}
                        {event.type === 'interview' && event.metadata && (
                          <div className="mt-2 text-xs text-gray-600">
                            {event.metadata.interviewer_name && (
                              <div>Interviewer: {event.metadata.interviewer_name}</div>
                            )}
                            {event.metadata.outcome && (
                              <div>Outcome: {event.metadata.outcome}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}