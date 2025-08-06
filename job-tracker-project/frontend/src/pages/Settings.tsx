import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import api from '../services/api'

interface UserSettings {
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private'
    analytics_sharing: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    timezone: string
    date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  }
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [settings, setSettings] = useState<UserSettings>({
    privacy: {
      profile_visibility: 'private',
      analytics_sharing: false
    },
    preferences: {
      theme: 'light',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      date_format: 'MM/DD/YYYY'
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/settings/')
      setSettings(response.data)
      
      // Set global preferences
      localStorage.setItem('dateFormat', response.data.preferences.date_format)
      localStorage.setItem('timezone', response.data.preferences.timezone)
      localStorage.setItem('theme', response.data.preferences.theme)
    } catch (error) {
      console.error('Error loading settings:', error)
      // Keep default settings on error
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Store current scroll position
      const currentScrollY = window.scrollY
      
      // Prepare update payload
      const updatePayload = {
        profile_visibility: settings.privacy.profile_visibility,
        analytics_sharing: settings.privacy.analytics_sharing,
        theme: settings.preferences.theme,
        timezone: settings.preferences.timezone,
        date_format: settings.preferences.date_format
      }
      
      await api.patch('/api/settings/', updatePayload)
      
      // Update global preferences
      localStorage.setItem('dateFormat', settings.preferences.date_format)
      localStorage.setItem('timezone', settings.preferences.timezone)
      localStorage.setItem('theme', settings.preferences.theme)
      
      // Show success message (you could add a toast notification here)
      console.log('Settings saved successfully!')
      
      // Reload settings from server to reflect changes in UI
      await loadSettings()
      
      // Restore scroll position
      window.scrollTo(0, currentScrollY)
    } catch (error) {
      console.error('Error saving settings:', error)
      // You could show an error toast here
    } finally {
      setSaving(false)
    }
  }


  const updatePrivacySetting = (key: keyof UserSettings['privacy'], value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }))
  }

  const updatePreferenceSetting = (key: keyof UserSettings['preferences'], value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // TODO: Implement actual API call to delete account
        console.log('Deleting account...')
        logout()
      } catch (error) {
        console.error('Error deleting account:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <div className="text-lg text-gray-600 dark:text-gray-300">Loading settings...</div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your account preferences and privacy settings</p>
        </div>

        <div className="space-y-6">

          {/* Privacy */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Privacy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={settings.privacy.profile_visibility}
                  onChange={(e) => updatePrivacySetting('profile_visibility', e.target.value)}
                  className="input"
                >
                  <option value="private">Private - Only you can see your profile</option>
                  <option value="friends">Friends Only - Only your friends can see your profile</option>
                  <option value="public">Public - Anyone can see your profile</option>
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {settings.privacy.profile_visibility === 'private' && 'Your profile, job applications, and activity are completely hidden from other users.'}
                  {settings.privacy.profile_visibility === 'friends' && 'Only users you\'ve added as friends can see your profile and achievements.'}
                  {settings.privacy.profile_visibility === 'public' && 'Your profile and achievements are visible to all JobFlow users (job applications remain private).'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Analytics Sharing</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Help improve our platform by sharing anonymous usage data
                    {settings.privacy.analytics_sharing && (
                      <span className="block mt-1 text-xs text-blue-600 dark:text-blue-400">
                        ✓ Enabled - We collect anonymous usage patterns, feature usage, and performance metrics. No personal information is shared.
                      </span>
                    )}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.analytics_sharing}
                    onChange={(e) => {
                      updatePrivacySetting('analytics_sharing', e.target.checked)
                      if (e.target.checked) {
                        // Track analytics opt-in event
                        console.log('User opted into analytics sharing:', {
                          timestamp: new Date().toISOString(),
                          userId: user?.id,
                          userAgent: navigator.userAgent,
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        })
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Format
                </label>
                <select
                  value={settings.preferences.date_format}
                  onChange={(e) => updatePreferenceSetting('date_format', e.target.value)}
                  className="input"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => updatePreferenceSetting('timezone', e.target.value)}
                  className="input"
                >
                  <optgroup label="US Timezones">
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                  </optgroup>
                  <optgroup label="Other Common Timezones">
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris (CET/CEST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-red-200 dark:border-red-700">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-4">Danger Zone</h2>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-900 dark:text-red-400 mb-2">Delete Account</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Once you delete your account, there is no going back. All your data will be permanently deleted.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}