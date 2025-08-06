import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import SocialWidget from '../components/SocialWidget'
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
  const [recentAchievements, setRecentAchievements] = useState<any[]>([])
  const [achievementsLoading, setAchievementsLoading] = useState(true)
  const [editingGoals, setEditingGoals] = useState(false)
  const [tempDailyGoal, setTempDailyGoal] = useState(5)
  const [tempWeeklyGoal, setTempWeeklyGoal] = useState(25)

  useEffect(() => {
    loadStats()
    loadRecentAchievements()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await analyticsApi.getSummary()
      setStats(response.data)
      setTempDailyGoal(response.data.daily_goal || 5)
      setTempWeeklyGoal(response.data.weekly_goal || 25)
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

  const loadRecentAchievements = async () => {
    try {
      setAchievementsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/social/achievements/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Get all unlocked achievements and sort by unlock date
        const allUnlockedAchievements = Object.values(data.by_category)
          .flat()
          .filter((achievement: any) => achievement.unlocked && achievement.unlocked_at)
          .sort((a: any, b: any) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
          .slice(0, 3)
        
        setRecentAchievements(allUnlockedAchievements)
      }
    } catch (error) {
      console.error('Error loading recent achievements:', error)
    } finally {
      setAchievementsLoading(false)
    }
  }

  const saveGoals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/analytics/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          daily_goal: tempDailyGoal,
          weekly_goal: tempWeeklyGoal
        })
      })

      if (response.ok) {
        // Reload stats to reflect changes
        await loadStats()
        setEditingGoals(false)
      } else {
        console.error('Failed to save goals')
      }
    } catch (error) {
      console.error('Error saving goals:', error)
    }
  }

  const cancelGoalsEdit = () => {
    setTempDailyGoal(stats?.daily_goal || 5)
    setTempWeeklyGoal(stats?.weekly_goal || 25)
    setEditingGoals(false)
  }

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'mythic':
        return {
          bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 dark:from-purple-700 dark:via-pink-700 dark:to-orange-700',
          border: 'border-purple-500 dark:border-purple-400',
          text: 'text-white',
          glow: 'shadow-lg shadow-purple-500/25',
          animation: 'animate-pulse'
        }
      case 'legendary':
        return {
          bg: 'bg-gradient-to-br from-yellow-500 to-orange-600 dark:from-yellow-600 dark:to-orange-700',
          border: 'border-yellow-400 dark:border-yellow-300',
          text: 'text-white',
          glow: 'shadow-lg shadow-yellow-500/25',
          animation: ''
        }
      case 'epic':
        return {
          bg: 'bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700',
          border: 'border-purple-400 dark:border-purple-300',
          text: 'text-white',
          glow: 'shadow-md shadow-purple-500/20',
          animation: ''
        }
      case 'rare':
        return {
          bg: 'bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700',
          border: 'border-blue-400 dark:border-blue-300',
          text: 'text-white',
          glow: 'shadow-md shadow-blue-500/20',
          animation: ''
        }
      case 'uncommon':
        return {
          bg: 'bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700',
          border: 'border-green-400 dark:border-green-300',
          text: 'text-white',
          glow: 'shadow-sm shadow-green-500/15',
          animation: ''
        }
      case 'common':
      default:
        return {
          bg: 'bg-white dark:bg-gray-700',
          border: 'border-gray-200 dark:border-gray-600',
          text: 'text-gray-900 dark:text-white',
          glow: '',
          animation: ''
        }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.first_name}! 
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
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
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Goal Progress</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {loading ? '...' : `${stats?.applications_today || 0} / ${stats?.daily_goal || 5} applications today`}
                </span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {loading ? '...' : `${stats?.goal_progress_today || 0}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.goal_progress_today || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xl">🚀</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Install Extension</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Track jobs with one click from LinkedIn, Indeed, and more.
                  </p>
                  <button className="btn-primary w-full" onClick={() => window.open('chrome://extensions/', '_blank')}>
                    Install Extension
                  </button>
                </div>

                <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xl">📝</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Job Manually</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Manually add job applications that you applied to outside of supported job sites.
                  </p>
                  <button 
                    className="btn-primary w-full"
                    onClick={() => navigate('/applications?add=true')}
                  >
                    Add Application
                  </button>
                </div>

                <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xl">📊</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">View Analytics</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Get detailed insights about your application patterns, success rates, and trends.
                  </p>
                  <button 
                    className="btn-primary w-full"
                    onClick={() => navigate('/analytics')}
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            </div>

            {/* Gamification Section */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Progress</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

                {/* Goals Progress */}
                <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-3xl mr-2">🎯</span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Goals</h3>
                    </div>
                    {!editingGoals ? (
                      <button
                        onClick={() => setEditingGoals(true)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex space-x-2 relative z-10">
                        <button
                          onClick={saveGoals}
                          className="text-sm bg-primary-600 text-white px-3 py-2 rounded hover:bg-primary-700 transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelGoalsEdit}
                          className="text-sm bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Daily Goal */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Goal</h4>
                      {editingGoals && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={tempDailyGoal}
                            onChange={(e) => setTempDailyGoal(parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">apps/day</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {stats?.applications_today || 0} / {editingGoals ? tempDailyGoal : (stats?.daily_goal || 5)} applications today
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {Math.round(stats?.goal_progress_today || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats?.goal_progress_today || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-xs">
                      {(stats?.goal_progress_today || 0) >= 100 ? 
                        "✨ Daily goal achieved!" : 
                        `${Math.max(0, (editingGoals ? tempDailyGoal : (stats?.daily_goal || 5)) - (stats?.applications_today || 0))} more to reach daily goal`
                      }
                    </p>
                  </div>

                  {/* Weekly Goal */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Goal</h4>
                      {editingGoals && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={tempWeeklyGoal}
                            onChange={(e) => setTempWeeklyGoal(parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">apps/week</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {stats?.applications_this_week || 0} / {editingGoals ? tempWeeklyGoal : (stats?.weekly_goal || 25)} applications
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {Math.round(stats?.goal_progress_week || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats?.goal_progress_week || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-xs">
                      {(stats?.goal_progress_week || 0) >= 100 ? 
                        "🎉 Weekly goal achieved! You're crushing it!" : 
                        `${Math.max(0, (editingGoals ? tempWeeklyGoal : (stats?.weekly_goal || 25)) - (stats?.applications_this_week || 0))} more to reach weekly goal`
                      }
                    </p>
                  </div>
                </div>

                {/* Social Widget */}
                <SocialWidget />
              </div>

              {/* Recent Achievements */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">🏆</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Achievements</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/network?tab=achievements')}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    View All →
                  </button>
                </div>
                
                {achievementsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : recentAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentAchievements.map((achievement, index) => {
                      const style = getRarityStyle(achievement.rarity)
                      return (
                        <div 
                          key={index}
                          className={`${style.bg} ${style.border} ${style.glow} ${style.animation} rounded-lg p-4 border transition-all duration-300 hover:scale-105`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2 drop-shadow-sm">
                              {achievement.icon || '🏆'}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <h4 className={`font-semibold text-sm ${style.text} drop-shadow-sm`}>
                                {achievement.title}
                              </h4>
                              {achievement.rarity !== 'common' && (
                                <span className={`px-1 py-0.5 text-xs font-bold rounded-full ${
                                  achievement.rarity === 'mythic' ? 'bg-white/20 text-white' :
                                  achievement.rarity === 'legendary' ? 'bg-white/20 text-white' :
                                  achievement.rarity === 'epic' ? 'bg-white/20 text-white' :
                                  achievement.rarity === 'rare' ? 'bg-white/20 text-white' :
                                  'bg-white/20 text-white'
                                }`}>
                                  {achievement.rarity.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs mb-1 ${
                              style.text === 'text-white' ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'
                            } drop-shadow-sm`}>
                              {achievement.description}
                            </p>
                            <p className={`text-xs ${
                              style.text === 'text-white' ? 'text-white/75' : 'text-gray-500 dark:text-gray-400'
                            } drop-shadow-sm`}>
                              {new Date(achievement.unlocked_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">🎯</span>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">No achievements unlocked yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Start applying to jobs to unlock your first achievements!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}