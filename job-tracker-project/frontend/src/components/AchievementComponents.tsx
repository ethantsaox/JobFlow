import React, { useState, useEffect } from 'react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  criteria_value: number
  current_progress: number
  unlocked: boolean
  unlocked_at?: string
  progress_percentage: number
  category: string
}

interface AchievementBadgeProps {
  achievement: Achievement
  isNew?: boolean
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  isNew = false 
}) => {
  const [showAnimation, setShowAnimation] = useState(isNew)

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShowAnimation(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isNew])

  return (
    <div 
      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
        achievement.unlocked
          ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 shadow-lg'
          : 'bg-gray-50 border-gray-200'
      } ${showAnimation ? 'animate-pulse ring-4 ring-yellow-300' : ''}`}
    >
      {achievement.unlocked && showAnimation && (
        <div className="absolute -top-2 -right-2 animate-bounce">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
            NEW!
          </span>
        </div>
      )}
      
      <div className="text-center">
        <div className={`text-4xl mb-2 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        <h4 className={`font-semibold text-sm mb-1 ${
          achievement.unlocked ? 'text-yellow-800' : 'text-gray-600'
        }`}>
          {achievement.title}
        </h4>
        <p className={`text-xs mb-2 ${
          achievement.unlocked ? 'text-yellow-700' : 'text-gray-500'
        }`}>
          {achievement.description}
        </p>
        
        {achievement.unlocked ? (
          <div className="text-xs text-yellow-600">
            Unlocked {achievement.unlocked_at ? new Date(achievement.unlocked_at).toLocaleDateString() : 'recently'}!
          </div>
        ) : (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${achievement.progress_percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {achievement.current_progress}/{achievement.criteria_value}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface AchievementGridProps {
  achievements: { [category: string]: Achievement[] }
  newlyUnlocked?: Achievement[]
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({ 
  achievements, 
  newlyUnlocked = [] 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const categories = Object.keys(achievements)
  const allAchievements = Object.values(achievements).flat()
  
  const filteredAchievements = selectedCategory === 'all' 
    ? allAchievements 
    : achievements[selectedCategory] || []

  const unlockedCount = allAchievements.filter(a => a.unlocked).length
  const totalCount = allAchievements.length

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Achievements</h3>
          <p className="text-sm text-gray-600">
            {unlockedCount}/{totalCount} unlocked ({((unlockedCount/totalCount)*100).toFixed(0)}%)
          </p>
        </div>
        <div className="text-3xl">🏆</div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAchievements.map(achievement => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            isNew={newlyUnlocked.some(newAch => newAch.id === achievement.id)}
          />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No achievements in this category yet.
        </div>
      )}
    </div>
  )
}

interface ProgressTowardsNextProps {
  achievements: Achievement[]
}

export const ProgressTowardsNext: React.FC<ProgressTowardsNextProps> = ({ 
  achievements 
}) => {
  const unlockedAchievements = achievements
    .filter(a => !a.unlocked && a.progress_percentage > 0)
    .sort((a, b) => b.progress_percentage - a.progress_percentage)
    .slice(0, 5)

  if (unlockedAchievements.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Towards Next</h3>
        <div className="text-center py-6 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <p>Start applying to unlock achievements!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Almost There!</h3>
      <div className="space-y-4">
        {unlockedAchievements.map(achievement => (
          <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl">{achievement.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{achievement.title}</div>
              <div className="text-sm text-gray-600 mb-2">{achievement.description}</div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${achievement.progress_percentage}%` }}
                  />
                </div>
                <div className="text-sm font-medium text-blue-600">
                  {achievement.progress_percentage.toFixed(0)}%
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {achievement.criteria_value - achievement.current_progress} more to unlock
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface RecentUnlocksProps {
  recentAchievements: Achievement[]
}

export const RecentUnlocks: React.FC<RecentUnlocksProps> = ({ 
  recentAchievements 
}) => {
  if (recentAchievements.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🎉</span>
        Recent Achievements
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recentAchievements.slice(0, 4).map(achievement => (
          <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
            <div className="text-2xl">{achievement.icon}</div>
            <div>
              <div className="font-medium text-gray-900">{achievement.title}</div>
              <div className="text-sm text-gray-600">{achievement.description}</div>
              <div className="text-xs text-yellow-600 mt-1">
                Unlocked {achievement.unlocked_at ? new Date(achievement.unlocked_at).toLocaleDateString() : 'recently'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}