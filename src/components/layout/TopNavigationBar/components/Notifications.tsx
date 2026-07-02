'use client'

import React, { useEffect, useState } from 'react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient'
import { apiClient } from '@/lib/apiClient'
import Link from 'next/link'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'

interface NotificationData {
  id: string
  title: string
  message: string
  createdAt: string
  status: string
  severity: string
  category: string
}

const normalizeNotificationItems = (payload: any): NotificationData[] => {
  const candidates = [
    payload?.items,
    payload?.notifications,
    payload?.data?.items,
    payload?.data?.notifications,
    payload?.data,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

const normalizeUnreadCount = (payload: any): number => {
  const candidates = [
    payload?.unreadCount,
    payload?.data?.unreadCount,
    payload?.data?.count,
    payload?.count,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'number') return candidate
  }
  return 0
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const [listRes, countRes] = await Promise.allSettled([
        apiClient.get('/admin/notifications'),
        apiClient.get('/admin/notifications/unread-count'),
      ])

      const listPayload = listRes.status === 'fulfilled' ? listRes.value : null
      const countPayload = countRes.status === 'fulfilled' ? countRes.value : null

      setItems(normalizeNotificationItems(listPayload))
      setUnreadCount(normalizeUnreadCount(countPayload ?? listPayload))
    } catch (err) {
      console.error('Failed to load topbar notifications:', err)
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleClearAll = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await apiClient.patch('/admin/notifications/read-all')
      setItems([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark notifications read:', err)
    }
  }

  return (
    <Dropdown className="topbar-item">
      <DropdownToggle
        as={'a'}
        type="button"
        className="topbar-button position-relative content-none"
        id="page-header-notifications-dropdown"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <IconifyIcon icon="solar:bell-bing-bold-duotone" className="fs-24 align-middle" />
        {unreadCount > 0 && (
          <span className="position-absolute topbar-badge fs-10 translate-middle badge bg-danger rounded-pill">
            {unreadCount}
            <span className="visually-hidden">unread messages</span>
          </span>
        )}
      </DropdownToggle>
      <DropdownMenu className="py-0 dropdown-lg dropdown-menu-end" aria-labelledby="page-header-notifications-dropdown">
        <div className="p-3 border-top-0 border-start-0 border-end-0 border-dashed border">
          <Row className="align-items-center">
            <div className="col">
              <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
            </div>
            <div className="col-auto">
              <Link href="" className="text-dark text-decoration-underline" onClick={handleClearAll}>
                <small>Clear All</small>
              </Link>
            </div>
          </Row>
        </div>
        <SimplebarReactClient style={{ maxHeight: 280 }}>
          {items.length === 0 ? (
            <div className="p-3 text-center text-muted fs-13">No notifications</div>
          ) : (
            items.map((notification) => (
              <DropdownItem key={notification.id} className="py-3 border-bottom text-wrap">
                <div className="d-flex align-items-start gap-2">
                  <div className="avatar-sm flex-shrink-0">
                    <span className={`avatar-title rounded-circle fs-16 ${
                      notification.severity === 'SECURITY' ? 'bg-soft-danger text-danger' : 'bg-soft-info text-info'
                    }`}>
                      {notification.category.substring(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-0 fw-semibold text-dark fs-13">{notification.title}</p>
                    <p className="mb-0 text-muted fs-12">{notification.message}</p>
                  </div>
                </div>
              </DropdownItem>
            ))
          )}
        </SimplebarReactClient>
        {/* UI polish fix (docs/admin-panel-shell-ui-polish.md): this used to
            be a "View All Notification" button linking to /dashboard — there
            is no dedicated notifications page in this app, so that link was
            dead/misleading. Removed rather than inventing a new page, per
            the instruction to fix shell integration only, not build a new
            notifications module. */}
      </DropdownMenu>
    </Dropdown>
  )
}
