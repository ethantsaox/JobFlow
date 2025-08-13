import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { analyticsApi } from '../services/api'
import { 
  StatusDistributionChart, 
  ApplicationTimelineChart,
  StatusTimelineChart
} from '../components/JobChart'

interface FilterState {
  timeRange: number
}

export default function Analytics() {
  const [filters, setFilters] = useState<FilterState>({
    timeRange: 30
  })
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  

  useEffect(() => {
    loadAnalyticsData()
  }, [filters.timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const [summaryResponse, timelineResponse, statusTimelineResponse] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getTimeline(filters.timeRange),
        analyticsApi.getStatusTimeline(filters.timeRange)
      ])
      
      setAnalyticsData({
        summary: summaryResponse.data,
        timeline: timelineResponse.data,
        statusTimeline: statusTimelineResponse.data
      })
    } catch (error) {
      console.error('Error loading analytics data:', error)
      // Set default data on error
      setAnalyticsData({
        summary: {
          total_applications: 0,
          applications_this_week: 0,
          applications_today: 0,
          current_streak: 0,
          interview_rate: 0,
          status_distribution: {},
          daily_goal: 5,
          weekly_goal: 25,
          goal_progress_today: 0,
          goal_progress_week: 0
        },
        timeline: {
          timeline: [],
          period_days: filters.timeRange,
          total_applications: 0
        },
        statusTimeline: {
          timeline: [],
          period_days: filters.timeRange,
          total_applications: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }



  return (
    <>
      <style>
        {`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            body {
              background: white !important;
            }
            
            .print\\:hidden {
              display: none !important;
            }
            
            /* Preserve grid layouts */
            .grid {
              display: grid !important;
            }
            
            /* Preserve colors and backgrounds */
            .bg-white,
            .bg-gray-50,
            .bg-blue-100,
            .bg-green-100,
            .bg-purple-100,
            .bg-orange-100 {
              background-color: inherit !important;
              border: 1px solid #e5e7eb !important;
            }
            
            /* Preserve shadows as borders */
            .shadow {
              box-shadow: none !important;
              border: 1px solid #d1d5db !important;
            }
            
            /* Page breaks */
            .page-break {
              page-break-before: always;
            }
            
            /* Chart containers */
            canvas {
              max-width: 100% !important;
              height: auto !important;
            }
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="print:hidden">
          <Navbar />
        </div>
      
      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Deep insights into your job search progress</p>
            </div>
            
            {/* Export Controls */}
            <div className="flex space-x-3">
              <button
                onClick={() => window.print()}
                className="btn-secondary text-sm print:hidden"
              >
                🖨️ Print
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 print:hidden">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Range
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: Number(e.target.value) }))}
                  className="input text-sm"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last year</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing data for {filters.timeRange} days • {loading ? '...' : analyticsData?.timeline?.total_applications || 0} total applications
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : analyticsData?.summary?.total_applications || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">🔥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : analyticsData?.summary?.current_streak || 0} days</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">💼</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Interview Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : analyticsData?.summary?.interview_rate || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">📅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : analyticsData?.summary?.applications_this_week || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Application Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Timeline (Last {filters.timeRange} Days)</h3>
            <ApplicationTimelineChart data={loading ? [] : analyticsData?.timeline?.timeline || []} />
          </div>

          {/* Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Status</h3>
            <div className="h-80 flex items-center justify-center">
              <StatusDistributionChart data={loading ? {} : analyticsData?.summary?.status_distribution || {}} />
            </div>
          </div>
        </div>

        {/* Status Timeline - New chart below */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution Timeline</h3>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : analyticsData?.statusTimeline?.timeline && analyticsData.statusTimeline.timeline.length > 0 ? (
              <StatusTimelineChart data={analyticsData.statusTimeline.timeline} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No status timeline data available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {analyticsData?.statusTimeline ? `Data length: ${analyticsData.statusTimeline.timeline?.length || 0}` : 'No data'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Success Funnel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Success Funnel</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : (
                Object.entries(analyticsData?.summary?.status_distribution || {}).map(([status, count]) => {
                  const total = analyticsData?.summary?.total_applications || 1;
                  const numCount = typeof count === 'number' ? count : 0;
                  const percentage = total > 0 ? (numCount / total * 100) : 0;
                  const colors: Record<string, string> = {
                    applied: 'bg-blue-500',
                    screening: 'bg-yellow-500', 
                    interview: 'bg-purple-500',
                    offer: 'bg-green-500',
                    rejected: 'bg-red-500'
                  };
                  
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{status}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{numCount} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colors[status] || 'bg-gray-500'}`} 
                          style={{width: `${percentage}%`}}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Average daily applications</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {loading ? '...' : ((analyticsData?.summary?.total_applications || 0) / Math.max(filters.timeRange, 1)).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Success rate</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{loading ? '...' : analyticsData?.summary?.interview_rate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Weekly progress</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {loading ? '...' : Math.round(analyticsData?.summary?.goal_progress_week || 0)}%
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Weekly Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Week Progress</h3>
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {loading ? '...' : analyticsData?.summary?.applications_this_week || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-300 mb-4">applications this week</div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mb-2">
              <div 
                className="bg-blue-500 h-4 rounded-full transition-all duration-500" 
                style={{width: `${Math.min((analyticsData?.summary?.goal_progress_week || 0), 100)}%`}}
              ></div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Goal: {loading ? '...' : analyticsData?.summary?.weekly_goal || 25} applications ({loading ? '...' : Math.round(analyticsData?.summary?.goal_progress_week || 0)}% complete)
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  )
}