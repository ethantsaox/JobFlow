import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import { API_BASE_URL } from '../services/api'

interface Friend {
  id: string
  first_name: string
  last_name: string
  email: string
  is_online: boolean
  status_text: string
  total_applications?: number
  interview_count?: number
  current_streak?: number
  longest_streak?: number
}

interface FriendsList {
  friends: Friend[]
  pending_received: Array<{
    id: string
    requester: {
      name: string
      email: string
    }
  }>
}

export default function SocialWidget() {
  const { isDark } = useDarkMode()
  const [friendsList, setFriendsList] = useState<FriendsList>({
    friends: [],
    pending_received: []
  })
  const [loading, setLoading] = useState(true)

  const API_BASE = `${API_BASE_URL}/api`

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

  useEffect(() => {
    fetchFriends()
  }, [])

  const OnlineIndicator = ({ isOnline }: { isOnline: boolean }) => (
    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
  )

  const topPerformers = friendsList.friends
    .filter(friend => friend.total_applications !== undefined)
    .sort((a, b) => (b.total_applications || 0) - (a.total_applications || 0))
    .slice(0, 3)

  const topStreaks = friendsList.friends
    .filter(friend => friend.current_streak !== undefined)
    .sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
    .slice(0, 3)

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Network
        </h3>
        <Link
          to="/network"
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
        >
          View All
        </Link>
      </div>

      {friendsList.friends.length === 0 ? (
        <div className="text-center py-6">
          <div className="mb-3">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h10m-6 4h10m0 4H9"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M26 8a2 2 0 100-4 2 2 0 000 4zM22 8a2 2 0 100-4 2 2 0 000 4z"></path>
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            No connections yet! Build your network to stay motivated.
          </p>
          <Link
            to="/network?tab=search"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-200 dark:hover:bg-primary-800"
          >
            Build Network
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Friend Requests */}
          {friendsList.pending_received.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Friend Requests
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {friendsList.pending_received.length}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {friendsList.pending_received.slice(0, 2).map((request, index) => (
                  <div key={request.id} className="mb-1">
                    {request.requester.name} wants to connect
                  </div>
                ))}
                {friendsList.pending_received.length > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{friendsList.pending_received.length - 2} more requests
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Online Friends */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Online Now ({friendsList.friends.filter(f => f.is_online).length})
            </h4>
            <div className="space-y-2">
              {friendsList.friends
                .filter(friend => friend.is_online)
                .slice(0, 3)
                .map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-2">
                    <OnlineIndicator isOnline={friend.is_online} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {friend.first_name} {friend.last_name}
                    </span>
                  </div>
                ))}
              {friendsList.friends.filter(f => f.is_online).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No friends online right now
                </p>
              )}
            </div>
          </div>

          {/* Top Performers This Week */}
          {topPerformers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🏆 Top Performers
              </h4>
              <div className="space-y-2">
                {topPerformers.map((friend, index) => (
                  <div key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {friend.first_name} {friend.last_name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {friend.total_applications || 0} apps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Streak Leaders */}
          {topStreaks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔥 Streak Leaders
              </h4>
              <div className="space-y-2">
                {topStreaks.map((friend, index) => (
                  <div key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {friend.first_name} {friend.last_name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {friend.current_streak || 0} days
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}