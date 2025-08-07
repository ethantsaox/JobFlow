import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import api from '../services/api'

interface UserProfile {
  email: string
  first_name: string
  last_name: string
  daily_goal: number
  weekly_goal: number
  created_at: string
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    daily_goal: 5,
    weekly_goal: 25
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Load settings to get complete profile data
      const settingsResponse = await api.get('/api/settings/')
      const profileFromSettings = settingsResponse.data.profile
      
      // Use profile data from settings API (which has the most up-to-date data)
      const profileData: UserProfile = {
        email: profileFromSettings?.email || user?.email || 'user@example.com',
        first_name: profileFromSettings?.first_name || user?.first_name || 'John',
        last_name: profileFromSettings?.last_name || user?.last_name || 'Doe',
        daily_goal: profileFromSettings?.daily_goal || 5,
        weekly_goal: profileFromSettings?.weekly_goal || 25,
        created_at: profileFromSettings?.created_at || new Date().toISOString()
      }
      
      setProfile(profileData)
      setFormData({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        daily_goal: profileData.daily_goal,
        weekly_goal: profileData.weekly_goal
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      
      // Fall back to basic profile without picture
      const fallbackProfile: UserProfile = {
        email: user?.email || 'user@example.com',
        first_name: user?.first_name || 'John',
        last_name: user?.last_name || 'Doe',
        daily_goal: 5,
        weekly_goal: 25,
        created_at: new Date().toISOString()
      }
      
      setProfile(fallbackProfile)
      setFormData({
        first_name: fallbackProfile.first_name,
        last_name: fallbackProfile.last_name,
        daily_goal: fallbackProfile.daily_goal,
        weekly_goal: fallbackProfile.weekly_goal
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Store current scroll position
      const currentScrollY = window.scrollY
      
      // Update profile via API
      await api.patch('/api/settings/profile', formData)
      
      setEditing(false)
      
      // Reload profile from server to reflect changes in UI
      await loadProfile()
      
      // Restore scroll position
      window.scrollTo(0, currentScrollY)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        daily_goal: profile.daily_goal,
        weekly_goal: profile.weekly_goal
      })
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <div className="text-lg text-gray-600 dark:text-gray-300">Loading profile...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your account information and preferences</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Profile Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profile?.first_name} {profile?.last_name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">{profile?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className={editing ? 'btn-secondary' : 'btn-primary'}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile?.first_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile?.last_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white">{profile?.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Goal Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Goals</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Daily Goal
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.daily_goal}
                        onChange={(e) => setFormData({ ...formData, daily_goal: parseInt(e.target.value) || 1 })}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile?.daily_goal} applications per day</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weekly Goal
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={formData.weekly_goal}
                        onChange={(e) => setFormData({ ...formData, weekly_goal: parseInt(e.target.value) || 1 })}
                        className="input"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{profile?.weekly_goal} applications per week</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Member Since
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Save/Cancel buttons */}
            {editing && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}