import React from 'react'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ 
  currentStreak, 
  longestStreak 
}) => {
  return (
    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <span className="text-3xl mr-2">🔥</span>
            <h3 className="text-xl font-bold">Current Streak</h3>
          </div>
          <div className="text-4xl font-bold mb-1">{currentStreak}</div>
          <div className="text-orange-100">
            {currentStreak === 1 ? 'day' : 'days'} in a row
          </div>
        </div>
        <div className="text-right">
          <div className="text-orange-100 text-sm">Personal Best</div>
          <div className="text-2xl font-bold">{longestStreak}</div>
        </div>
      </div>
      
      {currentStreak > 0 && (
        <div className="mt-4 text-orange-100 text-sm">
          {currentStreak >= 30 ? "🏆 You're on fire! Amazing consistency!" :
           currentStreak >= 14 ? "💪 Two weeks strong! Keep it up!" :
           currentStreak >= 7 ? "⭐ One week streak! You're building momentum!" :
           currentStreak >= 3 ? "🎯 Great start! Keep the momentum going!" :
           "🚀 Off to a good start!"}
        </div>
      )}
    </div>
  )
}

interface StreakCalendarProps {
  data: { date: string; applications: number; goal_met: boolean }[]
  dailyGoal: number
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({ 
  data, 
  dailyGoal 
}) => {
  const getIntensityClass = (applications: number, goalMet: boolean) => {
    if (applications === 0) return 'bg-gray-100 border-gray-200'
    if (goalMet) {
      if (applications >= dailyGoal * 2) return 'bg-green-600 border-green-700'
      if (applications >= dailyGoal) return 'bg-green-500 border-green-600'
      return 'bg-green-300 border-green-400'
    } else {
      if (applications >= dailyGoal * 0.8) return 'bg-yellow-400 border-yellow-500'
      if (applications >= 1) return 'bg-yellow-200 border-yellow-300'
      return 'bg-gray-200 border-gray-300'
    }
  }

  // Group data by weeks
  const weeks: Array<Array<{date: string; applications: number; goal_met: boolean}>> = []
  let currentWeek: Array<{date: string; applications: number; goal_met: boolean}> = []

  data.forEach((day, index) => {
    currentWeek.push(day)
    if (currentWeek.length === 7 || index === data.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Calendar</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 bg-gray-100 rounded-sm border"></div>
          <div className="w-3 h-3 bg-yellow-200 rounded-sm border"></div>
          <div className="w-3 h-3 bg-green-300 rounded-sm border"></div>
          <div className="w-3 h-3 bg-green-500 rounded-sm border"></div>
          <div className="w-3 h-3 bg-green-600 rounded-sm border"></div>
          <span>More</span>
        </div>
      </div>
      
      <div className="flex space-x-1 overflow-x-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col space-y-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm border transition-colors cursor-pointer ${getIntensityClass(day.applications, day.goal_met)}`}
                title={`${day.date}: ${day.applications} applications${day.goal_met ? ' (Goal met!)' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-3">
        <span>{Math.floor(data.length / 7)} weeks ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

interface StreakMilestonesProps {
  currentStreak: number
}

export const StreakMilestones: React.FC<StreakMilestonesProps> = ({ 
  currentStreak 
}) => {
  const milestones = [
    { days: 1, title: "First Day", icon: "🎯", achieved: currentStreak >= 1 },
    { days: 3, title: "Getting Started", icon: "🚀", achieved: currentStreak >= 3 },
    { days: 7, title: "One Week", icon: "⭐", achieved: currentStreak >= 7 },
    { days: 14, title: "Two Weeks", icon: "💪", achieved: currentStreak >= 14 },
    { days: 30, title: "One Month", icon: "🏆", achieved: currentStreak >= 30 },
    { days: 100, title: "Centurion", icon: "👑", achieved: currentStreak >= 100 },
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Streak Milestones</h3>
      <div className="space-y-3">
        {milestones.map((milestone) => (
          <div 
            key={milestone.days}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              milestone.achieved 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className={`text-2xl mr-3 ${milestone.achieved ? '' : 'grayscale opacity-50'}`}>
              {milestone.icon}
            </div>
            <div className="flex-1">
              <div className={`font-medium ${milestone.achieved ? 'text-green-800' : 'text-gray-600'}`}>
                {milestone.title}
              </div>
              <div className={`text-sm ${milestone.achieved ? 'text-green-600' : 'text-gray-500'}`}>
                {milestone.days} day{milestone.days > 1 ? 's' : ''} streak
              </div>
            </div>
            {milestone.achieved && (
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}