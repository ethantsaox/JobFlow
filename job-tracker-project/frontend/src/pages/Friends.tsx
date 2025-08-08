import { useState, useEffect } from 'react'
// import { useAuth } from '../hooks/useAuth'
// import { useDarkMode } from '../hooks/useDarkMode'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { API_BASE_URL } from '../services/api'

// Types for social features
interface Friend {
  id: string
  first_name: string
  last_name: string
  email: string
  is_online: boolean
  last_seen?: string
  status_text: string
  profile_picture_url?: string
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
  profile_picture_url?: string
}

export default function Friends() {
  // const { user } = useAuth()
  // const { isDark } = useDarkMode()
  const [searchParams] = useSearchParams()
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
  const [activeLeaderboard, setActiveLeaderboard] = useState<'applications' | 'streaks' | 'interviews' | 'achievements'>('applications')
  const [myAchievements, setMyAchievements] = useState<any>(null)
  const [achievementsLoading, setAchievementsLoading] = useState(false)
  const [currentUserStats, setCurrentUserStats] = useState<any>(null)

  // API base URL
  const API_BASE = `${API_BASE_URL}/api`

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
        setMyAchievements(data)
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setAchievementsLoading(false)
    }
  }

  // Fetch current user's stats for leaderboard
  const fetchCurrentUserStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const [analyticsResponse, profileResponse] = await Promise.all([
        fetch(`${API_BASE}/analytics/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/settings/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      if (analyticsResponse.ok && profileResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        const profileData = await profileResponse.json()
        
        // Get achievements count
        const achievementsCount = myAchievements ? 
          Object.values(myAchievements.by_category).flat().filter((ach: any) => ach.unlocked).length : 0
        
        const userStats = {
          id: 'current-user',
          first_name: profileData.profile.first_name,
          last_name: profileData.profile.last_name,
          email: profileData.profile.email,
          is_online: true,
          status_text: 'Online',
          profile_picture_url: profileData.profile.profile_picture_url,
          total_applications: analyticsData.total_applications,
          interview_count: Math.round(analyticsData.total_applications * analyticsData.interview_rate / 100),
          current_streak: analyticsData.current_streak,
          achievements: { length: achievementsCount }
        }
        
        setCurrentUserStats(userStats)
      }
    } catch (error) {
      console.error('Error fetching current user stats:', error)
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

  // Remove friend
  const removeFriend = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/social/friend/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        fetchFriends()
        setSelectedFriend(null) // Close modal if it was open
      } else {
        alert('Failed to remove friend. Please try again.')
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      alert('Failed to remove friend. Please try again.')
    }
  }

  useEffect(() => {
    fetchFriends()
    fetchMyAchievements()
    // Check if tab parameter is provided in URL
    const tabParam = searchParams.get('tab')
    if (tabParam === 'achievements') {
      setActiveTab('achievements')
    }
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

  useEffect(() => {
    if (activeTab === 'leaderboard' && !currentUserStats) {
      fetchCurrentUserStats()
    }
  }, [activeTab, myAchievements])

  // Helper function to combine friends with current user for leaderboards
  const getLeaderboardData = () => {
    if (!currentUserStats) return friendsList.friends
    
    // Add current user to friends list for leaderboard
    return [...friendsList.friends, currentUserStats]
  }

  // Helper function to check if a user is the current user
  const isCurrentUser = (userId: string) => userId === 'current-user'

  const OnlineIndicator = ({ isOnline }: { isOnline: boolean }) => (
    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
  )

  const ProfilePicture = ({ 
    profilePictureUrl, 
    firstName, 
    lastName, 
    size = 'md' 
  }: { 
    profilePictureUrl?: string
    firstName: string
    lastName: string
    size?: 'sm' | 'md' | 'lg'
  }) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-12 h-12 text-lg',
      lg: 'w-16 h-16 text-xl'
    }

    const getInitials = (first: string, last: string) => {
      if (!first || !last) {
        return "??"
      }
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }

    if (profilePictureUrl) {
      return (
        <img
          src={`${API_BASE_URL}${profilePictureUrl}`}
          alt={`${firstName} ${lastName}`}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200 dark:border-gray-600`}
        />
      )
    }

    return (
      <div className={`${sizeClasses[size]} rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold border-2 border-gray-200 dark:border-gray-600`}>
        {getInitials(firstName, lastName)}
      </div>
    )
  }

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
                    <div className="flex items-start space-x-4 mb-4">
                      <ProfilePicture
                        profilePictureUrl={friend.profile_picture_url}
                        firstName={friend.first_name}
                        lastName={friend.last_name}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {friend.first_name} {friend.last_name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <OnlineIndicator isOnline={friend.is_online} />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {friend.status_text}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{friend.email}</p>
                      </div>
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
            {/* Leaderboard Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveLeaderboard('applications')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeLeaderboard === 'applications'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  📊 Most Applications
                </button>
                <button
                  onClick={() => setActiveLeaderboard('streaks')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeLeaderboard === 'streaks'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🔥 Longest Streaks
                </button>
                <button
                  onClick={() => setActiveLeaderboard('interviews')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeLeaderboard === 'interviews'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  💼 Most Interviews
                </button>
                <button
                  onClick={() => setActiveLeaderboard('achievements')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeLeaderboard === 'achievements'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🏆 Most Achievements
                </button>
              </div>
            </div>

            {/* Current Leaderboard */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {activeLeaderboard === 'applications' && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <span className="text-3xl mr-3">📊</span>
                    Most Applications
                  </h3>
                  {(() => {
                    const sortedFriends = getLeaderboardData()
                      .sort((a, b) => (b.total_applications || 0) - (a.total_applications || 0))
                    const topThree = sortedFriends.slice(0, 3)
                    const remaining = sortedFriends.slice(3, 10)
                    
                    return (
                      <>
                        {/* Podium for Top 3 */}
                        {topThree.length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-end justify-center space-x-4 mb-6">
                              {/* 2nd Place */}
                              {topThree[1] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg p-4 mb-2 shadow-lg" style={{height: '80px', width: '120px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-2xl font-bold mb-1">🥈</div>
                                      <div className="text-xs font-semibold">2nd Place</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                      {isCurrentUser(topThree[1].id) ? 'You' : `${topThree[1].first_name} ${topThree[1].last_name}`}
                                    </p>
                                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                      {topThree[1].total_applications || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">applications</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* 1st Place */}
                              {topThree[0] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg p-4 mb-2 shadow-xl relative" style={{height: '100px', width: '140px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-3xl font-bold mb-1">🥇</div>
                                      <div className="text-xs font-semibold">1st Place</div>
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-yellow-300 rounded-full p-1">
                                      <span className="text-lg">👑</span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {isCurrentUser(topThree[0].id) ? 'You' : `${topThree[0].first_name} ${topThree[0].last_name}`}
                                    </p>
                                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                      {topThree[0].total_applications || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">applications</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* 3rd Place */}
                              {topThree[2] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-orange-500 to-orange-600 rounded-t-lg p-4 mb-2 shadow-lg" style={{height: '70px', width: '100px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-xl font-bold mb-1">🥉</div>
                                      <div className="text-xs font-semibold">3rd Place</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                      {isCurrentUser(topThree[2].id) ? 'You' : `${topThree[2].first_name} ${topThree[2].last_name}`}
                                    </p>
                                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                      {topThree[2].total_applications || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">applications</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Remaining Friends List */}
                        {remaining.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Other Rankings</h4>
                            <div className="space-y-3">
                              {remaining.map((friend, index) => (
                                <div key={friend.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                  isCurrentUser(friend.id) 
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}>
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                      isCurrentUser(friend.id)
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {index + 4}
                                    </div>
                                    <div>
                                      <p className={`font-medium ${
                                        isCurrentUser(friend.id) 
                                          ? 'text-primary-900 dark:text-primary-100'
                                          : 'text-gray-900 dark:text-white'
                                      }`}>
                                        {isCurrentUser(friend.id) ? 'You' : `${friend.first_name} ${friend.last_name}`}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{friend.status_text}</span>
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
                        )}
                      </>
                    )
                  })()}
                </>
              )}

              {activeLeaderboard === 'streaks' && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <span className="text-3xl mr-3">🔥</span>
                    Longest Streaks
                  </h3>
                  {(() => {
                    const sortedFriends = getLeaderboardData()
                      .sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
                    const topThree = sortedFriends.slice(0, 3)
                    const remaining = sortedFriends.slice(3, 10)
                    
                    return (
                      <>
                        {/* Podium for Top 3 */}
                        {topThree.length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-end justify-center space-x-4 mb-6">
                              {/* 2nd Place */}
                              {topThree[1] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg p-4 mb-2 shadow-lg" style={{height: '80px', width: '120px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-2xl font-bold mb-1">🥈</div>
                                      <div className="text-xs font-semibold">2nd Place</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                      {isCurrentUser(topThree[1].id) ? 'You' : `${topThree[1].first_name} ${topThree[1].last_name}`}
                                    </p>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                      {topThree[1].current_streak || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">day streak</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* 1st Place */}
                              {topThree[0] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg p-4 mb-2 shadow-xl relative" style={{height: '100px', width: '140px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-3xl font-bold mb-1">🥇</div>
                                      <div className="text-xs font-semibold">1st Place</div>
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1">
                                      <span className="text-lg">🔥</span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {isCurrentUser(topThree[0].id) ? 'You' : `${topThree[0].first_name} ${topThree[0].last_name}`}
                                    </p>
                                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                      {topThree[0].current_streak || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">day streak</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* 3rd Place */}
                              {topThree[2] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-orange-500 to-orange-600 rounded-t-lg p-4 mb-2 shadow-lg" style={{height: '70px', width: '100px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-xl font-bold mb-1">🥉</div>
                                      <div className="text-xs font-semibold">3rd Place</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                      {isCurrentUser(topThree[2].id) ? 'You' : `${topThree[2].first_name} ${topThree[2].last_name}`}
                                    </p>
                                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                      {topThree[2].current_streak || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">day streak</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Remaining Friends List */}
                        {remaining.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Other Rankings</h4>
                            <div className="space-y-3">
                              {remaining.map((friend, index) => (
                                <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300">
                                      {index + 4}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {isCurrentUser(friend.id) ? 'You' : `${friend.first_name} ${friend.last_name}`}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{friend.status_text}</span>
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
                        )}
                      </>
                    )
                  })()}
                </>
              )}

              {activeLeaderboard === 'interviews' && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <span className="text-3xl mr-3">💼</span>
                    Most Interviews
                  </h3>
                  {(() => {
                    const sortedFriends = getLeaderboardData()
                      .sort((a, b) => (b.interview_count || 0) - (a.interview_count || 0))
                    const topThree = sortedFriends.slice(0, 3)
                    const remaining = sortedFriends.slice(3, 10)
                    
                    return (
                      <>
                        {/* Podium for Top 3 */}
                        {topThree.length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-end justify-center space-x-4 mb-6">
                              {/* 2nd Place */}
                              {topThree[1] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg p-4 mb-2 shadow-lg" style={{height: '80px', width: '120px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-2xl font-bold mb-1">🥈</div>
                                      <div className="text-xs font-semibold">2nd Place</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                      {isCurrentUser(topThree[1].id) ? 'You' : `${topThree[1].first_name} ${topThree[1].last_name}`}
                                    </p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                      {topThree[1].interview_count || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">interviews</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* 1st Place */}
                              {topThree[0] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg p-4 mb-2 shadow-xl relative" style={{height: '100px', width: '140px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-3xl font-bold mb-1">🥇</div>
                                      <div className="text-xs font-semibold">1st Place</div>
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                                      <span className="text-lg">💼</span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {isCurrentUser(topThree[0].id) ? 'You' : `${topThree[0].first_name} ${topThree[0].last_name}`}
                                    </p>
                                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                      {topThree[0].interview_count || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">interviews</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* 3rd Place */}
                              {topThree[2] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-orange-500 to-orange-600 rounded-t-lg p-4 mb-2 shadow-lg" style={{height: '70px', width: '100px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-xl font-bold mb-1">🥉</div>
                                      <div className="text-xs font-semibold">3rd Place</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                      {isCurrentUser(topThree[2].id) ? 'You' : `${topThree[2].first_name} ${topThree[2].last_name}`}
                                    </p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                      {topThree[2].interview_count || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">interviews</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Remaining Friends List */}
                        {remaining.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Other Rankings</h4>
                            <div className="space-y-3">
                              {remaining.map((friend, index) => (
                                <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300">
                                      {index + 4}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {isCurrentUser(friend.id) ? 'You' : `${friend.first_name} ${friend.last_name}`}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{friend.status_text}</span>
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
                        )}
                      </>
                    )
                  })()
                }
                </>
              )}

              {activeLeaderboard === 'achievements' && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <span className="text-3xl mr-3">🏆</span>
                    Most Achievements
                  </h3>
                  {(() => {
                    const sortedFriends = getLeaderboardData()
                      .sort((a, b) => (b.achievements?.length || 0) - (a.achievements?.length || 0))
                    const topThree = sortedFriends.slice(0, 3)
                    const remaining = sortedFriends.slice(3, 10)
                    
                    return (
                      <>
                        {/* Podium for Top 3 */}
                        {topThree.length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-end justify-center space-x-4 mb-6">
                              {/* 2nd Place */}
                              {topThree[1] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg p-4 mb-2 shadow-lg" style={{height: '80px', width: '120px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-2xl font-bold mb-1">🥈</div>
                                      <div className="text-xs font-semibold">2nd Place</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                      {isCurrentUser(topThree[1].id) ? 'You' : `${topThree[1].first_name} ${topThree[1].last_name}`}
                                    </p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                      {topThree[1].achievements?.length || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">achievements</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* 1st Place */}
                              {topThree[0] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg p-4 mb-2 shadow-xl relative" style={{height: '100px', width: '140px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-3xl font-bold mb-1">🥇</div>
                                      <div className="text-xs font-semibold">1st Place</div>
                                    </div>
                                    <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-1">
                                      <span className="text-lg">🏆</span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {isCurrentUser(topThree[0].id) ? 'You' : `${topThree[0].first_name} ${topThree[0].last_name}`}
                                    </p>
                                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                      {topThree[0].achievements?.length || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">achievements</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* 3rd Place */}
                              {topThree[2] && (
                                <div className="flex flex-col items-center">
                                  <div className="bg-gradient-to-t from-orange-500 to-orange-600 rounded-t-lg p-4 mb-2 shadow-lg" style={{height: '70px', width: '100px'}}>
                                    <div className="text-center text-white">
                                      <div className="text-xl font-bold mb-1">🥉</div>
                                      <div className="text-xs font-semibold">3rd Place</div>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                                      {isCurrentUser(topThree[2].id) ? 'You' : `${topThree[2].first_name} ${topThree[2].last_name}`}
                                    </p>
                                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                      {topThree[2].achievements?.length || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">achievements</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Remaining Friends List */}
                        {remaining.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Other Rankings</h4>
                            <div className="space-y-3">
                              {remaining.map((friend, index) => (
                                <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300">
                                      {index + 4}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {isCurrentUser(friend.id) ? 'You' : `${friend.first_name} ${friend.last_name}`}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${friend.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{friend.status_text}</span>
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
                        )}
                      </>
                    )
                  })()
                }
                </>
              )}
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
                {Object.entries(myAchievements.by_category).map(([category, achievements]) => (
                  <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                      {category} Achievements
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(achievements as any[])
                        .sort((a: any, b: any) => getRarityOrder(b.rarity) - getRarityOrder(a.rarity))
                        .map((achievement: any, index: number) => {
                          const style = getRarityStyle(achievement.rarity)
                          const isUnlocked = achievement.unlocked
                          return (
                            <div
                              key={index}
                              className={`p-3 rounded border transition-all duration-300 ${
                                isUnlocked 
                                  ? `${style.bg} ${style.border} ${style.glow} ${style.animation} hover:scale-[1.03]`
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
                      <ProfilePicture
                        profilePictureUrl={user.profile_picture_url}
                        firstName={user.first_name}
                        lastName={user.last_name}
                        size="md"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <OnlineIndicator isOnline={user.is_online} />
                        </div>
                      </div>
                    </div>

                    <div>
                      {user.friendship_status === 'pending' || user.friendship_status === 'PENDING' ? (
                        <span className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                          Request Pending
                        </span>
                      ) : user.friendship_status === 'accepted' || user.friendship_status === 'ACCEPTED' ? (
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
                  <ProfilePicture
                    profilePictureUrl={selectedFriend.profile_picture_url}
                    firstName={selectedFriend.first_name}
                    lastName={selectedFriend.last_name}
                    size="lg"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedFriend.first_name} {selectedFriend.last_name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{selectedFriend.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <OnlineIndicator isOnline={selectedFriend.is_online} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedFriend.status_text}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => removeFriend(selectedFriend.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove Friend
                  </button>
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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