'use client'

import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Alert, Badge, Button, Offcanvas, Placeholder, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useAdminNotifications } from '@/context/useAdminNotificationsContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import type { AdminNotificationItem } from '@/types/admin'

dayjs.extend(relativeTime

const severityConfig: Record<AdminNotificationItem['severity'], { icon: string; tone: string; label: string }> = {
  INFO: { icon: 'solar:info-circle-bold-duotone', tone: 'info', label: 'Info' },
  SUCCESS: { icon: 'solar:check-circle-bold-duotone', tone: 'success', label: 'Success' },
  WARNING: { icon: 'solar:shield-warning-bold-duotone', tone: 'warning', label: 'Warning' },
  ERROR: { icon: 'solar:danger-triangle-bold-duotone', tone: 'danger', label: 'Error' },
  SECURITY: { icon: 'solar:shield-keyhole-bold-duotone', tone: 'dark', label: 'Security' },
}

const Notifications = () => {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement | null>(null
  const triggerRef = useRef<HTMLButtonElement | null>(null
  const [open, setOpen] = useState(false
  const [isMobile, setIsMobile] = useState(false
  const [busyId, setBusyId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false
  const {
    unreadCount,
    latestNotifications,
    loading,
    error,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAdminNotifications()
  const { showNotification } = useNotificationContext()

  const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768
    updateViewport()
    window.addEventListener('resize', updateViewport
    return () => window.removeEventListener('resize', updateViewport
  }, []

  useEffect(() => {
    if (!open || isMobile) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown
    document.addEventListener('keydown', onKeyDown
    return () => {
      document.removeEventListener('mousedown', onPointerDown
      document.removeEventListener('keydown', onKeyDown
    }
  }, [open, isMobile]

  const handleOpenNotification = async (notification: AdminNotificationItem) => {
    if (notification.actionUrl && !notification.actionUrl.startsWith('/')) {
      showNotification({ message: 'Unsafe notification link blocked.', variant: 'danger' }
      return
    }

    setBusyId(notification.id
    try {
      if (!notification.readAt) {
        await markNotificationAsRead(notification.id
      }
      if (notification.actionUrl) {
        setOpen(false
        router.push(notification.actionUrl
      }
    } catch (err: any) {
      showNotification({ message: err?.message || 'Unable to open notification.', variant: 'danger' }
    } finally {
      setBusyId(null
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true
    try {
      await markAllNotificationsAsRead()
      showNotification({ message: 'All notifications marked as read.', variant: 'success' }
    } catch (err: any) {
      showNotification({ message: err?.message || 'Unable to mark all notifications as read.', variant: 'danger' }
    } finally {
      setMarkingAll(false
    }
  }

  const bodyContent = ()
    <>
      <div className="notification-panel-header border-bottom">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h6 className="mb-1 fw-semibold">Notifications</h6>
            <p className="mb-0 text-muted small">Admin activity and security updates</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {unreadCount > 0 && <Badge bg="danger" pill>{unreadLabel}</Badge>}
            <Button variant="link" className="p-0 text-decoration-none notification-panel-action" onClick={() => void handleMarkAllRead()} disabled={markingAll || unreadCount === 0}>
              {markingAll ? 'Updating...' : 'Mark all as read'}
            </Button>
          </div>
        </div>
      </div>

      <div className="notification-panel-body">
        {loading ? ()
          <div className="p-3">
            {Array.from({ length: 4 }).map((_, index) => ()
              <div key={index} className="d-flex gap-3 py-3 border-bottom">
                <Placeholder animation="glow" className="rounded-circle flex-shrink-0" style={{ width: 44, height: 44 }} />
                <div className="flex-grow-1">
                  <Placeholder animation="glow"><Placeholder xs={8} /></Placeholder>
                  <Placeholder animation="glow"><Placeholder xs={11} /></Placeholder>
                  <Placeholder animation="glow"><Placeholder xs={5} /></Placeholder>
                </div>
              </div>
            ))}
          </div>
        ) : error ? ()
          <div className="p-3">
            <Alert variant="light" className="mb-0 border">
              <div className="fw-semibold mb-1">Unable to load notifications.</div>
              <Button variant="outline-primary" size="sm" onClick={() => void refreshNotifications()}>
                Retry
              </Button>
            </Alert>
          </div>
        ) : latestNotifications.length === 0 ? ()
          <div className="text-center text-muted py-5 px-4">No notifications yet.</div>
        ) : ()
          <div className="notification-panel-list">
            {latestNotifications.map((notification) => {
              const severity = severityConfig[notification.severity]
              return ()
                <button
                  key={notification.id}
                  type="button"
                  className={clsx('notification-panel-item text-start w-100 border-0', { unread: !notification.readAt })}
                  onClick={() => void handleOpenNotification(notification)}>
                  <div className="d-flex gap-3 align-items-start">
                    <div className={`notification-panel-icon bg-${severity.tone}-subtle text-${severity.tone === 'warning' ? 'dark' : severity.tone}`}>
                      <IconifyIcon icon={severity.icon} className="fs-20" />
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="min-w-0">
                          <div className="fw-semibold text-truncate">{notification.title}</div>
                          <div className="notification-message text-muted small mt-1">{notification.message}</div>
                        </div>
                        {busyId === notification.id ? <Spinner size="sm" animation="border" /> : !notification.readAt ? <span className="badge bg-primary-subtle text-primary">New</span> : null}
                      </div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                        <span className={`badge bg-${severity.tone}-subtle text-${severity.tone === 'warning' ? 'dark' : severity.tone}`}>{severity.label}</span>
                        <span className="badge bg-light text-dark border">{notification.category.replace(/_/g, ' ')}</span>
                        <small className="text-muted ms-auto">{dayjs(notification.createdAt).fromNow()}</small>
                      </div>
                    </div>
                  </div>
                </button>
              
            })}
          </div>
        )}
      </div>

      <div className="notification-panel-footer border-top">
        <Link href="/notifications" className="btn btn-primary w-100" onClick={() => setOpen(false)}>
          View all notifications
        </Link>
      </div>
    </>
  

  return ()
    <div className="topbar-item position-relative notification-panel-root">
      <button
        ref={triggerRef}
        type="button"
        className="topbar-button position-relative content-none"
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls="topbar-notification-panel"
        onClick={() => setOpen((current) => !current)}>
        <IconifyIcon icon="solar:bell-bing-bold-duotone" className="fs-24 align-middle" />
        {unreadCount > 0 && ()
          <span className="position-absolute topbar-badge fs-10 translate-middle badge bg-danger rounded-pill">
            {unreadLabel}
          </span>
        )}
      </button>

      {!isMobile && open && ()
        <div ref={panelRef} id="topbar-notification-panel" className="notification-panel shadow-lg" role="dialog" aria-label="Notifications panel">
          {bodyContent}
        </div>
      )}

      <Offcanvas show={isMobile && open} onHide={() => setOpen(false)} placement="end" className="notification-mobile-canvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Notifications</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">{bodyContent}</Offcanvas.Body>
      </Offcanvas>
    </div>
  
}

export default Notifications
