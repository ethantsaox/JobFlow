import React, { useState, useEffect } from 'react'

interface MotivationMessageProps {
  message: string
  type: 'start' | 'progress' | 'goal_met' | 'maintain_streak' | 'celebration'
  currentStreak: number
  todayProgress: number
  dailyGoal: number
}

export const MotivationMessage: React.FC<MotivationMessageProps> = ({
  message,
  type,
  currentStreak,
  todayProgress,
  dailyGoal
}) => {
  const getEmoji = () => {
    switch (type) {
      case 'start': return '🚀'
      case 'progress': return '💪'
      case 'goal_met': return '🎯'
      case 'maintain_streak': return '🔥'
      case 'celebration': return '🏆'
      default: return '✨'
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'start': return 'from-blue-50 to-blue-100 border-blue-200'
      case 'progress': return 'from-yellow-50 to-yellow-100 border-yellow-200'
      case 'goal_met': return 'from-green-50 to-green-100 border-green-200'
      case 'maintain_streak': return 'from-orange-50 to-red-100 border-orange-200'
      case 'celebration': return 'from-purple-50 to-purple-100 border-purple-200'
      default: return 'from-gray-50 to-gray-100 border-gray-200'
    }
  }

  return (
    <div className={`bg-gradient-to-r ${getBgColor()} rounded-xl p-6 border-2`}>
      <div className="flex items-start space-x-3">
        <div className="text-3xl">{getEmoji()}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">Daily Motivation</h3>
          <p className="text-gray-700 leading-relaxed">{message}</p>
          
          {type === 'celebration' && (
            <div className="mt-3 flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                🔥 {currentStreak} day streak
              </span>
              <span className="flex items-center">
                🎯 {todayProgress}/{dailyGoal} today
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DailyTipProps {
  tip: {
    type: string
    title: string
    message: string
    icon: string
  }
}

export const DailyTip: React.FC<DailyTipProps> = ({ tip }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{tip.icon}</div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">{tip.title}</h4>
          <p className="text-gray-600 text-sm leading-relaxed">{tip.message}</p>
        </div>
      </div>
    </div>
  )
}

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  achievement?: {
    title: string
    description: string
    icon: string
  }
  milestone?: {
    type: 'streak' | 'goal' | 'application_count'
    value: number
  }
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  achievement,
  milestone
}) => {
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setConfetti(true)
      const timer = setTimeout(() => setConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-auto relative overflow-hidden">
        
        {/* Confetti Animation */}
        {confetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              >
                {['🎉', '✨', '🎊', '⭐', '🏆'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        )}

        <div className="text-center relative z-10">
          <div className="text-6xl mb-4 animate-bounce">
            {achievement?.icon || '🎉'}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {achievement ? 'Achievement Unlocked!' : 'Milestone Reached!'}
          </h2>
          
          {achievement && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {achievement.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {achievement.description}
              </p>
            </>
          )}

          {milestone && (
            <div className="mb-6">
              <p className="text-lg text-gray-700">
                {milestone.type === 'streak' && `🔥 ${milestone.value} day streak!`}
                {milestone.type === 'goal' && `🎯 Daily goal completed!`}
                {milestone.type === 'application_count' && `📊 ${milestone.value} applications sent!`}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="btn-primary px-8 py-3 text-lg"
          >
            Awesome! 🚀
          </button>
        </div>
      </div>
    </div>
  )
}

interface QuickStatsProps {
  stats: {
    todayProgress: number
    dailyGoal: number
    currentStreak: number
    weekProgress: number
    weeklyGoal: number
  }
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
  const todayPercentage = (stats.todayProgress / stats.dailyGoal) * 100
  const weekPercentage = (stats.weekProgress / stats.weeklyGoal) * 100

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
      
      <div className="space-y-4">
        {/* Today's Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Today's Goal</span>
            <span className="text-sm text-gray-600">
              {stats.todayProgress}/{stats.dailyGoal}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                todayPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(todayPercentage, 100)}%` }}
            />
          </div>
          {todayPercentage >= 100 && (
            <div className="text-green-600 text-sm mt-1 flex items-center">
              <span className="mr-1">🎉</span>
              Goal completed!
            </div>
          )}
        </div>

        {/* Current Streak */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🔥</span>
            <span className="font-medium text-gray-800">Current Streak</span>
          </div>
          <span className="text-xl font-bold text-orange-600">
            {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Weekly Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">This Week</span>
            <span className="text-sm text-gray-600">
              {stats.weekProgress}/{stats.weeklyGoal}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(weekPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {weekPercentage.toFixed(0)}% of weekly goal
          </div>
        </div>
      </div>
    </div>
  )
}

interface EncouragementBannerProps {
  currentStreak: number
  todayProgress: number
  dailyGoal: number
  onDismiss?: () => void
}

export const EncouragementBanner: React.FC<EncouragementBannerProps> = ({
  currentStreak,
  todayProgress,
  dailyGoal,
  onDismiss
}) => {
  const isGoalMet = todayProgress >= dailyGoal
  const isCloseToGoal = todayProgress >= dailyGoal * 0.8

  if (isGoalMet) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white relative">
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="absolute top-2 right-2 text-white hover:text-gray-200"
          >
            ✕
          </button>
        )}
        <div className="flex items-center space-x-3">
          <div className="text-3xl">🎉</div>
          <div>
            <h4 className="font-semibold">Congratulations!</h4>
            <p className="text-green-100">
              You've completed your daily goal! 
              {currentStreak > 0 && ` Keep your ${currentStreak}-day streak alive!`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isCloseToGoal) {
    return (
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-4 text-white relative">
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="absolute top-2 right-2 text-white hover:text-gray-200"
          >
            ✕
          </button>
        )}
        <div className="flex items-center space-x-3">
          <div className="text-3xl">⚡</div>
          <div>
            <h4 className="font-semibold">Almost there!</h4>
            <p className="text-yellow-100">
              Just {dailyGoal - todayProgress} more applications to reach your daily goal!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white relative">
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 text-white hover:text-gray-200"
        >
          ✕
        </button>
      )}
      <div className="flex items-center space-x-3">
        <div className="text-3xl">💪</div>
        <div>
          <h4 className="font-semibold">Let's get started!</h4>
          <p className="text-blue-100">
            {todayProgress === 0 
              ? "Apply to your first job today to start building momentum!"
              : `Great progress! ${dailyGoal - todayProgress} more to reach your goal.`
            }
          </p>
        </div>
      </div>
    </div>
  )
}