import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { API_BASE_URL } from '../services/api'

const API_BASE = `${API_BASE_URL}/api`

interface OnlineStatusHookOptions {
  heartbeatInterval?: number // in milliseconds, default 5 minutes
  enabled?: boolean // default true
}

export function useOnlineStatus(options: OnlineStatusHookOptions = {}) {
  const { user } = useAuth()
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const isOnlineRef = useRef(false)
  
  const {
    heartbeatInterval = 5 * 60 * 1000, // 5 minutes
    enabled = true
  } = options

  const sendStatusUpdate = async (endpoint: string, data?: any) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${API_BASE}/social/status/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      })

      if (!response.ok) {
        console.warn(`Failed to update status: ${endpoint}`)
      }
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }

  const markOnline = async () => {
    if (!user || !enabled || isOnlineRef.current) return
    
    const sessionId = localStorage.getItem('session_id') || `session_${Date.now()}`
    localStorage.setItem('session_id', sessionId)
    
    await sendStatusUpdate('online', {
      session_id: sessionId,
      device_info: navigator.userAgent
    })
    
    isOnlineRef.current = true
  }

  const markOffline = async () => {
    if (!user || !enabled || !isOnlineRef.current) return
    
    await sendStatusUpdate('offline')
    isOnlineRef.current = false
  }

  const sendHeartbeat = async () => {
    if (!user || !enabled) return
    
    await sendStatusUpdate('activity')
  }

  const startHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }
    
    heartbeatRef.current = setInterval(sendHeartbeat, heartbeatInterval)
  }

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }

  useEffect(() => {
    if (!user || !enabled) return

    // Mark online when component mounts
    markOnline()
    
    // Start heartbeat
    startHeartbeat()

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, reduce heartbeat frequency but don't mark offline
        stopHeartbeat()
      } else {
        // Page is visible again, resume normal heartbeat
        sendHeartbeat() // Send immediate heartbeat
        startHeartbeat()
      }
    }

    // Handle page unload (user leaving/refreshing)
    const handleBeforeUnload = () => {
      markOffline()
    }

    // Handle user activity (mouse/keyboard)
    const handleUserActivity = () => {
      if (!isOnlineRef.current) {
        markOnline()
        startHeartbeat()
      }
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // User activity listeners
    document.addEventListener('mousedown', handleUserActivity)
    document.addEventListener('keydown', handleUserActivity)
    document.addEventListener('scroll', handleUserActivity)
    document.addEventListener('touchstart', handleUserActivity)

    return () => {
      // Cleanup
      stopHeartbeat()
      markOffline()
      
      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('mousedown', handleUserActivity)
      document.removeEventListener('keydown', handleUserActivity)
      document.removeEventListener('scroll', handleUserActivity)
      document.removeEventListener('touchstart', handleUserActivity)
    }
  }, [user, enabled, heartbeatInterval])

  return {
    markOnline,
    markOffline,
    sendHeartbeat
  }
}