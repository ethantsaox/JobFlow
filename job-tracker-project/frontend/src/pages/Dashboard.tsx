import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi } from '../services/api'

interface DashboardStats {
  total_applications: number
  applications_this_week: number
  applications_today: number
  current_streak: number
  interview_rate: number
  daily_goal: number
  weekly_goal: number
  goal_progress_today: number
  goal_progress_week: number
  status_distribution: { [key: string]: number }
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await analyticsApi.getSummary()
      setStats(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading stats:', error)
      setLoading(false)
      // Set default values on error
      setStats({
        total_applications: 0,
        applications_this_week: 0,
        applications_today: 0,
        current_streak: 0,
        interview_rate: 0,
        daily_goal: 5,
        weekly_goal: 25,
        goal_progress_today: 0,
        goal_progress_week: 0,
        status_distribution: {}
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.first_name}! 🎯
            </h1>
            <p className="text-gray-600 mb-6">
              Here's your job application progress and insights.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                    <p className="text-2xl font-bold">{loading ? '...' : stats?.total_applications || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">🔥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-green-100 text-sm font-medium">Current Streak</p>
                    <p className="text-2xl font-bold">{loading ? '...' : stats?.current_streak || 0} days</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">💼</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-purple-100 text-sm font-medium">Interview Rate</p>
                    <p className="text-2xl font-bold">{loading ? '...' : `${stats?.interview_rate || 0}%`}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-orange-100 text-sm font-medium">This Week</p>
                    <p className="text-2xl font-bold">{loading ? '...' : stats?.applications_this_week || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Progress */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Goal Progress</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {loading ? '...' : `${stats?.applications_today || 0} / ${stats?.daily_goal || 5} applications today`}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {loading ? '...' : `${stats?.goal_progress_today || 0}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.goal_progress_today || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xl">🚀</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Install Extension</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Install our Chrome extension to track jobs with one click from LinkedIn, Indeed, and more.
                  </p>
                  <button className="btn-primary w-full" onClick={() => window.open('chrome://extensions/', '_blank')}>
                    Install Extension
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xl">📝</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Add Job Manually</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Manually add job applications that you applied to outside of supported job sites.
                  </p>
                  <button 
                    className="btn-secondary w-full"
                    onClick={() => navigate('/applications?add=true')}
                  >
                    Add Application
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xl">📊</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">View Analytics</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Get detailed insights about your application patterns, success rates, and trends.
                  </p>
                  <button 
                    className="btn-secondary w-full"
                    onClick={() => navigate('/analytics')}
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            </div>

            {/* Gamification Section */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Streak Counter */}
                <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-3xl mr-2">🔥</span>
                        <h3 className="text-xl font-bold">Current Streak</h3>
                      </div>
                      <div className="text-4xl font-bold mb-1">{stats?.current_streak || 0}</div>
                      <p className="text-orange-100">days in a row</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-100 text-sm">Best: 15 days</p>
                      <p className="text-orange-100 text-sm">Keep it up! 🚀</p>
                    </div>
                  </div>
                </div>

                {/* Weekly Goal Progress */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-2">🎯</span>
                    <h3 className="text-xl font-bold text-gray-900">Weekly Goal</h3>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {stats?.applications_this_week || 0} / {stats?.weekly_goal || 25} applications
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      {Math.round(stats?.goal_progress_week || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stats?.goal_progress_week || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {stats?.goal_progress_week >= 100 ? 
                      "🎉 Goal achieved! You're crushing it!" : 
                      `${Math.max(0, (stats?.weekly_goal || 25) - (stats?.applications_this_week || 0))} more to reach your goal`
                    }
                  </p>
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-2">🏆</span>
                  <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* First Application Achievement */}
                  <div className={`bg-white rounded-lg p-4 border border-gray-200 ${stats?.total_applications > 0 ? '' : 'opacity-50'}`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚀</div>
                      <h4 className="font-semibold text-gray-900 text-sm">First Application</h4>
                      <p className="text-xs text-gray-600">
                        {stats?.total_applications > 0 ? 'Started your journey!' : 'Apply to your first job'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Streak Achievement */}
                  <div className={`bg-white rounded-lg p-4 border border-gray-200 ${(stats?.current_streak || 0) >= 7 ? '' : 'opacity-50'}`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔥</div>
                      <h4 className="font-semibold text-gray-900 text-sm">Week Warrior</h4>
                      <p className="text-xs text-gray-600">
                        {(stats?.current_streak || 0) >= 7 ? '7 day streak unlocked!' : 'Get a 7 day streak'}
                      </p>
                      {(stats?.current_streak || 0) < 7 && (
                        <p className="text-xs text-purple-600 font-medium">{stats?.current_streak || 0}/7</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Interview Achievement */}
                  <div className={`bg-white rounded-lg p-4 border border-gray-200 ${(stats?.status_distribution?.interview || 0) + (stats?.status_distribution?.offer || 0) >= 5 ? '' : 'opacity-50'}`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">💼</div>
                      <h4 className="font-semibold text-gray-900 text-sm">Interview Pro</h4>
                      <p className="text-xs text-gray-600">
                        {(stats?.status_distribution?.interview || 0) + (stats?.status_distribution?.offer || 0) >= 5 
                          ? 'Got 5+ interviews!' 
                          : 'Get 5 interviews'
                        }
                      </p>
                      {(stats?.status_distribution?.interview || 0) + (stats?.status_distribution?.offer || 0) < 5 && (
                        <p className="text-xs text-purple-600 font-medium">
                          {(stats?.status_distribution?.interview || 0) + (stats?.status_distribution?.offer || 0)}/5
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}