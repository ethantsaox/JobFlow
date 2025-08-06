import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useDarkMode } from '../hooks/useDarkMode'
import Navbar from '../components/Navbar'

// Types for social features
interface Friend {
  id: string
  first_name: string
  last_name: string
  email: string
  is_online: boolean
  last_seen?: string
  status_text: string
  total_applications?: number
  interview_count?: number
  offer_count?: number
  current_streak?: number
  longest_streak?: number
  achievements: Array<{
    type: string
    title: string
    description: string
    icon: string
    category: string
    rarity: string
    unlocked_at: string
  }>
  goal_progress?: {
    daily_goal: number
    weekly_goal: number
  }
}

interface FriendRequest {
  id: string
  requester: {
    id: string
    name: string
    email: string
  }
  addressee: {
    id: string
    name: string
    email: string
  }
  status: string
  created_at: string
}

interface FriendsList {
  friends: Friend[]
  pending_sent: FriendRequest[]
  pending_received: FriendRequest[]
}

interface UserSearchResult {
  id: string
  first_name: string
  last_name: string
  email: string
  is_online: boolean
  last_seen?: string
  friendship_status?: string
  can_send_request: boolean
}

export default function Friends() {
  const { user } = useAuth()
  const { isDark } = useDarkMode()
  const [friendsList, setFriendsList] = useState<FriendsList>({
    friends: [],
    pending_sent: [],
    pending_received: []
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard' | 'achievements' | 'search' | 'requests'>('friends')
  const [myAchievements, setMyAchievements] = useState<any>(null)
  const [achievementsLoading, setAchievementsLoading] = useState(false)

  // API base URL
  const API_BASE = 'http://localhost:8000/api'

  // Fetch user's own achievements
  const fetchMyAchievements = async () => {
    setAchievementsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/social/achievements/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Achievements data:', data)
        setMyAchievements(data)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setAchievementsLoading(false)
    }
  }

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/social/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFriendsList(data)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoading(false)
    }
  }

  // Search users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/social/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // Send friend request
  const sendFriendRequest = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/social/friend-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      })
      
      if (response.ok) {
        // Refresh friends list and search results
        fetchFriends()
        searchUsers(searchQuery)
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
    }
  }

  // Accept friend request
  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/social/friend-request/${friendshipId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        fetchFriends()
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  // Decline friend request
  const declineFriendRequest = async (friendshipId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/social/friend-request/${friendshipId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        fetchFriends()
      }
    } catch (error) {
      console.error('Error declining friend request:', error)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    if (activeTab === 'achievements' && !myAchievements) {
      fetchMyAchievements()
    }
  }, [activeTab])

  const OnlineIndicator = ({ isOnline }: { isOnline: boolean }) => (
    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
  )

  const StatCard = ({ title, value, icon }: { title: string; value: number | undefined; icon: string }) => (
    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center text-center">
        <span className="text-lg mb-1">{icon}</span>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {value !== undefined && value !== null ? value : 0}
        </p>
      </div>
    </div>
  )

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
          bg: 'bg-white dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          text: 'text-gray-900 dark:text-white',
          glow: '',
          animation: ''
        }
    }
  }

  const getRarityOrder = (rarity: string): number => {
    const order = { 'mythic': 6, 'legendary': 5, 'epic': 4, 'rare': 3, 'uncommon': 2, 'common': 1 }
    return order[rarity as keyof typeof order] || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Network</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Connect with your professional network and stay motivated through friendly competition
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg mb-6">
          {(['friends', 'leaderboard', 'achievements', 'search', 'requests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab === 'friends' && `Friends (${friendsList.friends.length})`}
              {tab === 'leaderboard' && 'Leaderboard'}
              {tab === 'achievements' && 'Achievements'}
              {tab === 'search' && 'Find Friends'}
              {tab === 'requests' && `Requests (${friendsList.pending_received.length})`}
            </button>
          ))}
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-6">
            {friendsList.friends.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No friends yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start connecting with friends to see their progress and stay motivated!
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="btn-primary"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friendsList.friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {friend.first_name} {friend.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{friend.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <OnlineIndicator isOnline={friend.is_online} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {friend.status_text}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <StatCard
                        title="Applications"
                        value={friend.total_applications}
                        icon="📋"
                      />
                      <StatCard
                        title="Interviews"
                        value={friend.interview_count}
                        icon="💼"
                      />
                      <StatCard
                        title="Current Streak"
                        value={friend.current_streak}
                        icon="🔥"
                      />
                      <StatCard
                        title="Best Streak"
                        value={friend.longest_streak}
                        icon="🏆"
                      />
                    </div>

                    {friend.achievements.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Recent Achievements
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {friend.achievements
                            .sort((a, b) => getRarityOrder(b.rarity) - getRarityOrder(a.rarity))
                            .slice(0, 3)
                            .map((achievement, index) => {
                              const style = getRarityStyle(achievement.rarity)
                              return (
                                <span
                                  key={index}
                                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    achievement.rarity === 'common' 
                                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                                      : `${style.bg} ${style.text} font-medium shadow-sm`
                                  }`}
                                >
                                  {achievement.icon} {achievement.title}
                                </span>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Applications Leaderboard */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">📊</span>
                  Most Applications
                </h3>
                <div className="space-y-3">
                  {friendsList.friends
                    .sort((a, b) => (b.total_applications || 0) - (a.total_applications || 0))
                    .slice(0, 5)
                    .map((friend, index) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {friend.first_name} {friend.last_name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{friend.status_text}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary-600 dark:text-primary-400">
                            {friend.total_applications || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">applications</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Streak Leaderboard */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">🔥</span>
                  Longest Streaks
                </h3>
                <div className="space-y-3">
                  {friendsList.friends
                    .sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
                    .slice(0, 5)
                    .map((friend, index) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {friend.first_name} {friend.last_name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{friend.status_text}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-orange-600 dark:text-orange-400">
                            {friend.current_streak || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">day streak</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Interview Success Leaderboard */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">💼</span>
                  Most Interviews
                </h3>
                <div className="space-y-3">
                  {friendsList.friends
                    .sort((a, b) => (b.interview_count || 0) - (a.interview_count || 0))
                    .slice(0, 5)
                    .map((friend, index) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {friend.first_name} {friend.last_name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{friend.status_text}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                            {friend.interview_count || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">interviews</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Achievement Leaders */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">🏆</span>
                  Achievement Leaders
                </h3>
                <div className="space-y-3">
                  {friendsList.friends
                    .sort((a, b) => (b.achievements?.length || 0) - (a.achievements?.length || 0))
                    .slice(0, 5)
                    .map((friend, index) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {friend.first_name} {friend.last_name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{friend.status_text}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                            {friend.achievements?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">achievements</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {achievementsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : myAchievements ? (
              <div className="space-y-6">
                {/* Achievement Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className="text-2xl mr-2">🏆</span>
                    Achievement Progress
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {myAchievements.total_unlocked}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Unlocked</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                        {myAchievements.total_achievements}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {Math.round(myAchievements.completion_percentage)}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${myAchievements.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Achievement Categories */}
                {Object.entries(myAchievements.by_category).map(([category, achievements]: [string, any[]]) => (
                  <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                      {category} Achievements
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {achievements
                        .sort((a, b) => getRarityOrder(b.rarity) - getRarityOrder(a.rarity))
                        .map((achievement, index) => {
                          const style = getRarityStyle(achievement.rarity)
                          const isUnlocked = achievement.unlocked
                          console.log(`Achievement: ${achievement.title}, Rarity: ${achievement.rarity}, Unlocked: ${isUnlocked}`, style)
                          return (
                            <div
                              key={index}
                              className={`p-3 rounded border transition-all duration-300 ${
                                isUnlocked 
                                  ? `${style.bg} ${style.border} ${style.glow} ${style.animation} hover:scale-105`
                                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className={`text-xl ${isUnlocked ? 'drop-shadow-sm' : 'grayscale'}`}>
                                  {achievement.icon || '🏆'}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-medium ${
                                      isUnlocked ? style.text : 'text-gray-600 dark:text-gray-400'
                                    } drop-shadow-sm`}>
                                      {achievement.title}
                                    </p>
                                    {isUnlocked && achievement.rarity !== 'common' && (
                                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                                        achievement.rarity === 'mythic' ? 'bg-white/20 text-white' :
                                        achievement.rarity === 'legendary' ? 'bg-white/20 text-white' :
                                        achievement.rarity === 'epic' ? 'bg-white/20 text-white' :
                                        achievement.rarity === 'rare' ? 'bg-white/20 text-white' :
                                        'bg-white/20 text-white'
                                      }`}>
                                        {achievement.rarity.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm ${
                                    isUnlocked && style.text === 'text-white' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
                                  } drop-shadow-sm mb-1`}>
                                    {achievement.description}
                                  </p>
                                  
                                  {/* Progress Bar for Locked Achievements */}
                                  {!isUnlocked && achievement.criteria_value > 0 && (
                                    <div className="mt-2">
                                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        <span>{achievement.current_progress}/{achievement.criteria_value}</span>
                                        <span>{Math.round(achievement.progress_percentage)}%</span>
                                      </div>
                                      <div className="bg-gray-300 dark:bg-gray-600 rounded-full h-1.5">
                                        <div 
                                          className="bg-primary-500 rounded-full h-1.5 transition-all duration-300"
                                          style={{ width: `${achievement.progress_percentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Unlock Date for Unlocked Achievements */}
                                  {isUnlocked && achievement.unlocked_at && (
                                    <p className={`text-xs ${
                                      style.text === 'text-white' ? 'text-white/75' : 'text-gray-500 dark:text-gray-500'
                                    } mt-1 drop-shadow-sm`}>
                                      Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Unable to load achievements</p>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="max-w-md">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search by name or email
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter name or email..."
                className="input w-full"
              />
            </div>

            {searchLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <OnlineIndicator isOnline={user.is_online} />
                      </div>
                    </div>

                    <div>
                      {user.friendship_status === 'PENDING' ? (
                        <span className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                          Request Pending
                        </span>
                      ) : user.friendship_status === 'ACCEPTED' ? (
                        <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                          Friends
                        </span>
                      ) : user.can_send_request ? (
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="btn-primary text-sm"
                        >
                          Add Friend
                        </button>
                      ) : (
                        <span className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Enter at least 2 characters to search for friends
                </p>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {friendsList.pending_received.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No pending friend requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Friend requests will appear here when someone wants to connect with you.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pending Requests ({friendsList.pending_received.length})
                </h3>
                {friendsList.pending_received.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {request.requester.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.requester.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Sent {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptFriendRequest(request.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineFriendRequest(request.id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {friendsList.pending_sent.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sent Requests ({friendsList.pending_sent.length})
                </h3>
                {friendsList.pending_sent.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {request.addressee.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.addressee.email}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Friend Profile Modal */}
      {selectedFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedFriend.first_name} {selectedFriend.last_name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedFriend.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <OnlineIndicator isOnline={selectedFriend.is_online} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedFriend.status_text}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Applications"
                  value={selectedFriend.total_applications}
                  icon="📋"
                />
                <StatCard
                  title="Interviews"
                  value={selectedFriend.interview_count}
                  icon="💼"
                />
                <StatCard
                  title="Offers"
                  value={selectedFriend.offer_count}
                  icon="✅"
                />
                <StatCard
                  title="Current Streak"
                  value={selectedFriend.current_streak}
                  icon="🔥"
                />
              </div>

              {selectedFriend.achievements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Achievements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedFriend.achievements
                      .sort((a, b) => getRarityOrder(b.rarity) - getRarityOrder(a.rarity))
                      .map((achievement, index) => {
                        const style = getRarityStyle(achievement.rarity)
                        return (
                          <div
                            key={index}
                            className={`${style.bg} ${style.border} ${style.glow} ${style.animation} p-3 rounded border transition-all duration-300 hover:scale-105`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-xl drop-shadow-sm">{achievement.icon || '🏆'}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium ${style.text} drop-shadow-sm`}>
                                    {achievement.title}
                                  </p>
                                  {achievement.rarity !== 'common' && (
                                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                                      achievement.rarity === 'mythic' ? 'bg-white/20 text-white' :
                                      achievement.rarity === 'legendary' ? 'bg-white/20 text-white' :
                                      achievement.rarity === 'epic' ? 'bg-white/20 text-white' :
                                      achievement.rarity === 'rare' ? 'bg-white/20 text-white' :
                                      'bg-white/20 text-white'
                                    }`}>
                                      {achievement.rarity.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${style.text === 'text-white' ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'} drop-shadow-sm`}>
                                  {achievement.description}
                                </p>
                                <p className={`text-xs ${style.text === 'text-white' ? 'text-white/75' : 'text-gray-500 dark:text-gray-500'} mt-1 drop-shadow-sm`}>
                                  Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {selectedFriend.goal_progress && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Goals
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Daily Goal</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedFriend.goal_progress.daily_goal} applications
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Weekly Goal</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedFriend.goal_progress.weekly_goal} applications
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}