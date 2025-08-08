import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { API_BASE_URL } from '../services/api'

interface InterviewSchedulerProps {
  applicationId: string
  applicationTitle: string
  companyName: string
  currentInterviewDate?: string
  onClose: () => void
  onUpdate: () => void
}

interface InterviewType {
  value: string
  label: string
  duration: string
}

const interviewTypes: InterviewType[] = [
  { value: 'phone_screening', label: 'Phone Screening', duration: '30 min' },
  { value: 'video_interview', label: 'Video Interview', duration: '60 min' },
  { value: 'technical_interview', label: 'Technical Interview', duration: '90 min' },
  { value: 'panel_interview', label: 'Panel Interview', duration: '60 min' },
  { value: 'final_interview', label: 'Final Interview', duration: '45 min' },
  { value: 'onsite_interview', label: 'Onsite Interview', duration: '4 hours' },
  { value: 'other', label: 'Other', duration: '60 min' }
]

export default function InterviewScheduler({ 
  applicationId, 
  applicationTitle, 
  companyName, 
  currentInterviewDate,
  onClose, 
  onUpdate 
}: InterviewSchedulerProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    interview_date: currentInterviewDate ? currentInterviewDate.split('T')[0] : '',
    interview_time: currentInterviewDate ? new Date(currentInterviewDate).toTimeString().slice(0, 5) : '',
    interview_type: 'video_interview',
    interviewer_name: '',
    interviewer_email: '',
    location: '',
    notes: '',
    preparation_notes: '',
    questions_to_ask: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Combine date and time
      const interviewDateTime = new Date(`${formData.interview_date}T${formData.interview_time}`)
      
      const response = await fetch(`${API_BASE_URL}/api/job-applications/${applicationId}/interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          interview_date: interviewDateTime.toISOString(),
          interview_type: formData.interview_type,
          interviewer_name: formData.interviewer_name,
          interviewer_email: formData.interviewer_email,
          location: formData.location,
          notes: formData.notes,
          preparation_notes: formData.preparation_notes,
          questions_to_ask: formData.questions_to_ask,
          timezone: formData.timezone
        })
      })

      if (response.ok) {
        onUpdate()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to schedule interview')
      }
    } catch (err) {
      setError('Network error while scheduling interview')
    } finally {
      setLoading(false)
    }
  }

  const selectedInterviewType = interviewTypes.find(type => type.value === formData.interview_type)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
            <p className="text-gray-600">{applicationTitle} at {companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
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

        <form onSubmit={handleScheduleInterview} className="p-6 space-y-6">
          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type *
            </label>
            <select
              required
              value={formData.interview_type}
              onChange={(e) => setFormData({...formData, interview_type: e.target.value})}
              className="input w-full"
            >
              {interviewTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} ({type.duration})
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Date *
              </label>
              <input
                type="date"
                required
                value={formData.interview_date}
                onChange={(e) => setFormData({...formData, interview_date: e.target.value})}
                className="input w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Time *
              </label>
              <input
                type="time"
                required
                value={formData.interview_time}
                onChange={(e) => setFormData({...formData, interview_time: e.target.value})}
                className="input w-full"
              />
            </div>
          </div>

          {/* Interviewer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer Name
              </label>
              <input
                type="text"
                value={formData.interviewer_name}
                onChange={(e) => setFormData({...formData, interviewer_name: e.target.value})}
                className="input w-full"
                placeholder="John Smith"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer Email
              </label>
              <input
                type="email"
                value={formData.interviewer_email}
                onChange={(e) => setFormData({...formData, interviewer_email: e.target.value})}
                className="input w-full"
                placeholder="john.smith@company.com"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location / Meeting Link
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="input w-full"
              placeholder="Zoom link, office address, or phone number"
            />
          </div>

          {/* Interview Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="input w-full h-20"
              placeholder="Any specific details about the interview..."
            />
          </div>

          {/* Preparation Section */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📚 Interview Preparation</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparation Notes
              </label>
              <textarea
                value={formData.preparation_notes}
                onChange={(e) => setFormData({...formData, preparation_notes: e.target.value})}
                className="input w-full h-24"
                placeholder="Key points to study, technologies to review, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Questions to Ask
              </label>
              <textarea
                value={formData.questions_to_ask}
                onChange={(e) => setFormData({...formData, questions_to_ask: e.target.value})}
                className="input w-full h-24"
                placeholder="Questions you want to ask the interviewer..."
              />
            </div>
          </div>

          {/* Interview Tips */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2">💡 Interview Tips</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Research the company and role thoroughly</li>
              <li>• Prepare STAR method examples for behavioral questions</li>
              <li>• Test your tech setup 15 minutes before (for video interviews)</li>
              <li>• Prepare questions about the role, team, and company culture</li>
              <li>• Have your resume and portfolio easily accessible</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </span>
              ) : (
                'Schedule Interview'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}