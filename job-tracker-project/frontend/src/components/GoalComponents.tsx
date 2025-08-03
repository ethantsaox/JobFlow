import React, { useState } from 'react'

interface GoalProgressProps {
  current: number
  goal: number
  label: string
  period: 'daily' | 'weekly'
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ 
  current, 
  goal, 
  label, 
  period 
}) => {
  const percentage = Math.min((current / goal) * 100, 100)
  const isComplete = current >= goal
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          <p className="text-sm text-gray-600">
            {current} of {goal} applications {period === 'daily' ? 'today' : 'this week'}
          </p>
        </div>
        <div className={`text-2xl ${isComplete ? 'animate-bounce' : ''}`}>
          {isComplete ? '🎯' : period === 'daily' ? '📅' : '📊'}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm font-medium">
          <span className={isComplete ? 'text-green-600' : 'text-gray-700'}>
            Progress
          </span>
          <span className={isComplete ? 'text-green-600' : 'text-gray-700'}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ease-out ${
            isComplete 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : percentage > 80 
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isComplete ? (
        <div className="text-center py-2">
          <span className="text-green-600 font-medium text-sm">
            🎉 Goal completed! Great job!
          </span>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-gray-600 text-sm">
            {goal - current} more to reach your {period} goal
          </span>
        </div>
      )}
    </div>
  )
}

interface GoalSettingsProps {
  dailyGoal: number
  weeklyGoal: number
  onUpdate: (daily: number, weekly: number) => void
}

export const GoalSettings: React.FC<GoalSettingsProps> = ({ 
  dailyGoal, 
  weeklyGoal, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempDaily, setTempDaily] = useState(dailyGoal)
  const [tempWeekly, setTempWeekly] = useState(weeklyGoal)

  const handleSave = () => {
    onUpdate(tempDaily, tempWeekly)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempDaily(dailyGoal)
    setTempWeekly(weeklyGoal)
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Goal Settings</h3>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-secondary text-sm"
          >
            Edit Goals
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Goal
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="20"
                value={tempDaily}
                onChange={(e) => setTempDaily(Number(e.target.value))}
                className="input flex-1"
              />
              <span className="text-sm text-gray-500">applications per day</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekly Goal
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={tempDaily * 7}
                max="100"
                value={tempWeekly}
                onChange={(e) => setTempWeekly(Number(e.target.value))}
                className="input flex-1"
              />
              <span className="text-sm text-gray-500">applications per week</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: {tempDaily * 7} (daily goal × 7)
            </p>
          </div>

          <div className="flex space-x-2">
            <button onClick={handleSave} className="btn-primary flex-1">
              Save Changes
            </button>
            <button onClick={handleCancel} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📅</span>
              <div>
                <div className="font-medium text-blue-900">Daily Goal</div>
                <div className="text-sm text-blue-700">Applications per day</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">{dailyGoal}</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <div className="font-medium text-green-900">Weekly Goal</div>
                <div className="text-sm text-green-700">Applications per week</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">{weeklyGoal}</div>
          </div>
        </div>
      )}
    </div>
  )
}

interface WeeklyOverviewProps {
  weekData: { day: string; applications: number; goal: number }[]
}

export const WeeklyOverview: React.FC<WeeklyOverviewProps> = ({ weekData }) => {
  const totalApps = weekData.reduce((sum, day) => sum + day.applications, 0)
  const totalGoal = weekData.reduce((sum, day) => sum + day.goal, 0)
  const completedDays = weekData.filter(day => day.applications >= day.goal).length

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Progress</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalApps}</div>
          <div className="text-sm text-gray-600">Total Apps</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completedDays}</div>
          <div className="text-sm text-gray-600">Goals Met</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {((totalApps / totalGoal) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Weekly Progress</div>
        </div>
      </div>

      <div className="space-y-2">
        {weekData.map((day, index) => {
          const dayPercentage = (day.applications / day.goal) * 100
          const isToday = index === 6 // Assuming Sunday is the last day
          
          return (
            <div key={day.day} className="flex items-center space-x-3">
              <div className={`w-16 text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                {day.day}
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      day.applications >= day.goal 
                        ? 'bg-green-500' 
                        : dayPercentage > 50 
                        ? 'bg-yellow-500' 
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(dayPercentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm text-gray-600">
                {day.applications}/{day.goal}
              </div>
              {day.applications >= day.goal && (
                <span className="text-green-500">✓</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}