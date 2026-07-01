'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, apiClient } from '@/lib/apiClient'
import type { AdminNotificationItem } from '@/types/admin'

type NotificationStatus = 'all' | 'unread' | 'read'

type AdminNotificationsContextType = {
  unreadCount: number
  latestNotifications: AdminNotificationItem[]
  loading: boolean
  error: string | null
  lastUpdatedAt: string | null
  fetchUnreadCount: () => Promise<number>
  fetchLatestNotifications: () => Promise<AdminNotificationItem[]>
  refreshNotifications: () => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<number>
  dismissNotification: (id: string) => Promise<void>
  applyUnreadCount: (count: number) => void
}

const AdminNotificationsContext = createContext<AdminNotificationsContextType | undefined>(undefined

function isSafeInternalActionUrl(actionUrl?: string | null) {
  return Boolean(actionUrl && actionUrl.startsWith('/') && !actionUrl.startsWith('//'
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext
  if (!context) {
    throw new Error('useAdminNotifications must be used within AdminNotificationsProvider')
  }
  return context
}

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0
  const [latestNotifications, setLatestNotifications] = useState<AdminNotificationItem[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const pollerRef = useRef<number | null>(null

  const stopPolling = () => {
    if (pollerRef.current !== null) {
      window.clearInterval(pollerRef.current
      pollerRef.current = null
    }
  }

  const fetchUnreadCount = async () => {
    if (!accessToken) return 0
    const res: any = await apiClient(accessToken).get('/admin/notifications/unread-count'
    const count = Number(res.data.unreadCount) || 0
    setUnreadCount(count
    setLastUpdatedAt(new Date().toISOString()
    return count
  }

  const fetchLatestNotifications = async () => {
    if (!accessToken) return []
    const res: any = await apiClient(accessToken).get('/admin/notifications?limit=8&status=all'
    const items = (res.data.items || []).map((item: AdminNotificationItem) => ({
      ...item,
      actionUrl: isSafeInternalActionUrl(item.actionUrl) ? item.actionUrl : null,
    }
    setLatestNotifications(items
    setUnreadCount(Number(res.data.unreadCount) || 0
    setLastUpdatedAt(new Date().toISOString()
    return items
  }

  const refreshNotifications = async () => {
    if (!accessToken) {
      setUnreadCount(0
      setLatestNotifications([]
      setLoading(false
      setError(null
      return
    }

    setLoading(true
    setError(null

    try {
      await fetchLatestNotifications()
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        stopPolling()
      }
      setError(err?.message || 'Unable to load notifications.'
    } finally {
      setLoading(false
    }
  }

  const markNotificationAsRead = async (id: string) => {
    if (!accessToken) return

    const target = latestNotifications.find((item) => item.id === id
    const wasUnread = Boolean(target && !target.readAt

    setLatestNotifications((current) => current.map((item) => (item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item)
    if (wasUnread) setUnreadCount((current) => Math.max(0, current - 1

    try {
      await apiClient(accessToken).patch(`/admin/notifications/${id}/read`
    } catch (error) {
      if (wasUnread) setUnreadCount((current) => current + 1
      setLatestNotifications((current) => current.map((item) => (item.id === id ? { ...item, readAt: target?.readAt ?? null } : item)
      throw error
    }
  }

  const markAllNotificationsAsRead = async () => {
    if (!accessToken) return 0

    const unreadItems = latestNotifications.filter((item) => !item.readAt).length
    setLatestNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })
    setUnreadCount(0

    try {
      const res: any = await apiClient(accessToken).patch('/admin/notifications/read-all'
      return Number(res.data.updatedCount) || 0
    } catch (error) {
      if (unreadItems > 0) {
        await refreshNotifications()
      }
      throw error
    }
  }

  const dismissNotification = async (id: string) => {
    if (!accessToken) return
    const target = latestNotifications.find((item) => item.id === id
    const wasUnread = Boolean(target && !target.readAt

    setLatestNotifications((current) => current.filter((item) => item.id !== id
    if (wasUnread) setUnreadCount((current) => Math.max(0, current - 1

    try {
      await apiClient(accessToken).delete(`/admin/notifications/${id}`
    } catch (error) {
      await refreshNotifications()
      throw error
    }
  }

  const applyUnreadCount = (count: number) => {
    setUnreadCount(Math.max(0, count
    setLastUpdatedAt(new Date().toISOString()
  }

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      stopPolling()
      setUnreadCount(0
      setLatestNotifications([]
      setLoading(false
      setError(null
      return
    }

    void refreshNotifications()

    stopPolling()
    pollerRef.current = window.setInterval(() => {
      void fetchUnreadCount().catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          stopPolling()
          return
        }
        setError(err?.message || 'Unable to refresh notifications.'
      }
    }, 60000

    return () => {
      stopPolling()
    }
  }, [isAuthenticated, accessToken]

  return ()
    <AdminNotificationsContext.Provider
      value={{
        unreadCount,
        latestNotifications,
        loading,
        error,
        lastUpdatedAt,
        fetchUnreadCount,
        fetchLatestNotifications,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        dismissNotification,
        applyUnreadCount,
      }}>
      {children}
    </AdminNotificationsContext.Provider>
  
}
