'use client'

import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import clsx from 'clsx'
import { Alert, Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Form, Placeholder, Row, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useAdminNotifications } from '@/context/useAdminNotificationsContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import type { AdminNotificationItem } from '@/types/admin'
import { useRouter } from 'next/navigation'

dayjs.extend(relativeTime

const severityConfig: Record<AdminNotificationItem['severity'], { icon: string; tone: string; label: string }> = {
  INFO: { icon: 'solar:info-circle-bold-duotone', tone: 'info', label: 'Info' },
  SUCCESS: { icon: 'solar:check-circle-bold-duotone', tone: 'success', label: 'Success' },
  WARNING: { icon: 'solar:shield-warning-bold-duotone', tone: 'warning', label: 'Warning' },
  ERROR: { icon: 'solar:danger-triangle-bold-duotone', tone: 'danger', label: 'Error' },
  SECURITY: { icon: 'solar:shield-keyhole-bold-duotone', tone: 'dark', label: 'Security' },
}

const defaultFilters = {
  status: 'all',
  category: '',
  severity: '',
}

const NotificationsPageContent = () => {
  const { accessToken } = useAuth()
  const router = useRouter()
  const { showNotification } = useNotificationContext()
  const {
    unreadCount,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
  } = useAdminNotifications()
  const [items, setItems] = useState<AdminNotificationItem[]>([]
  const [loading, setLoading] = useState(true
  const [loadingMore, setLoadingMore] = useState(false
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false
  const [busyId, setBusyId] = useState<string | null>(null)
  const [markAllBusy, setMarkAllBusy] = useState(false
  const [filters, setFilters] = useState(defaultFilters

  const loadNotifications = async (cursor?: string | null, append = false) => {
    if (!accessToken) return

    const params = new URLSearchParams({ limit: '20', status: filters.status }
    if (filters.category) params.set('category', filters.category
    if (filters.severity) params.set('severity', filters.severity
    if (cursor) params.set('cursor', cursor

    if (append) setLoadingMore(true
    else setLoading(true
    setError(null

    try {
      const res: any = await apiClient(accessToken).get(`/admin/notifications?${params.toString()}`
      const safeItems = (res.data.items || []).map((item: AdminNotificationItem) => ({
        ...item,
        actionUrl: item.actionUrl?.startsWith('/') ? item.actionUrl : null,
      })
      setItems((current) => (append ? [...current, ...safeItems] : safeItems)
      setNextCursor(res.data.pagination.nextCursor
      setHasNextPage(res.data.pagination.hasNextPage
    } catch (err: any) {
      setError(err?.message || 'Unable to load notifications.'
    } finally {
      setLoading(false
      setLoadingMore(false
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [accessToken, filters.status, filters.category, filters.severity]

  const summary = useMemo(() => {
    const loadedCount = items.length
    const securityCount = items.filter((item) => item.severity === 'SECURITY' || item.category === 'SECURITY').length
    const systemCount = items.filter((item) => item.category === 'SYSTEM').length
    return { loadedCount, securityCount, systemCount }
  }, [items]

  const handleMarkRead = async (notification: AdminNotificationItem) => {
    setBusyId(notification.id
    try {
      await markNotificationAsRead(notification.id
      setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item))
      showNotification({ message: 'Notification marked as read.', variant: 'success' }
    } catch (err: any) {
      showNotification({ message: err?.message || 'Failed to mark notification as read.', variant: 'danger' }
    } finally {
      setBusyId(null
    }
  }

  const handleMarkAllRead = async () => {
    setMarkAllBusy(true
    try {
      await markAllNotificationsAsRead()
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))
      showNotification({ message: 'All notifications marked as read.', variant: 'success' }
    } catch (err: any) {
      showNotification({ message: err?.message || 'Failed to mark all notifications as read.', variant: 'danger' }
    } finally {
      setMarkAllBusy(false
    }
  }

  const handleDismiss = async (notification: AdminNotificationItem) => {
    setBusyId(notification.id
    try {
      await dismissNotification(notification.id
      setItems((current) => current.filter((item) => item.id !== notification.id)
      showNotification({ message: 'Notification dismissed.', variant: 'success' }
    } catch (err: any) {
      showNotification({ message: err?.message || 'Failed to dismiss notification.', variant: 'danger' }
    } finally {
      setBusyId(null
    }
  }

  const handleOpen = async (notification: AdminNotificationItem) => {
    if (!notification.actionUrl?.startsWith('/')) {
      showNotification({ message: 'Unsafe notification link blocked.', variant: 'danger' }
      return
    }

    try {
      if (!notification.readAt) {
        await handleMarkRead(notification
      }
      router.push(notification.actionUrl
    } catch {
      // handled by mark read
    }
  }

  const isFiltered = Boolean(filters.status !== 'all' || filters.category || filters.severity

  return ()
    <>
      <Row className="align-items-end g-3">
        <Col lg={8}>
          <div className="page-title-box">
            <h4 className="mb-0">Notifications</h4>
            <p className="text-muted mt-1 mb-0">Review security alerts, admin activity, and account updates for your WPA Central Auth admin identity.</p>
          </div>
        </Col>
        <Col lg={4}>
          <div className="d-flex justify-content-lg-end gap-2">
            <Button variant="outline-secondary" onClick={() => void loadNotifications()}>
              Refresh
            </Button>
            <Button variant="primary" onClick={() => void handleMarkAllRead()} disabled={markAllBusy || unreadCount === 0}>
              {markAllBusy ? 'Updating...' : 'Mark all as read'}
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col md={6} xl={3}>
          <Card className="shadow-sm border-0 h-100 notification-summary-card">
            <CardBody><div className="text-muted small">Loaded</div><div className="fs-3 fw-semibold">{summary.loadedCount}</div></CardBody>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="shadow-sm border-0 h-100 notification-summary-card">
            <CardBody><div className="text-muted small">Unread</div><div className="fs-3 fw-semibold">{unreadCount}</div></CardBody>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="shadow-sm border-0 h-100 notification-summary-card">
            <CardBody><div className="text-muted small">Security in current view</div><div className="fs-3 fw-semibold">{summary.securityCount}</div></CardBody>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="shadow-sm border-0 h-100 notification-summary-card">
            <CardBody><div className="text-muted small">System in current view</div><div className="fs-3 fw-semibold">{summary.systemCount}</div></CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 mt-4">
        <CardHeader className="bg-transparent border-bottom">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <CardTitle as="h5" className="mb-1">Notification Center</CardTitle>
              <p className="text-muted mb-0 small">Dedicated enterprise feed for account, security, and operational updates.</p>
            </div>
            <Button variant="light" onClick={() => setFilters(defaultFilters)}>Clear filters</Button>
          </div>
        </CardHeader>
        <CardBody>
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Form.Label>Status</Form.Label>
              <Form.Select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}>
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Category</Form.Label>
              <Form.Select value={filters.category} onChange={(e) => setFilters((current) => ({ ...current, category: e.target.value }))}>
                <option value="">All categories</option>
                <option value="SYSTEM">System</option>
                <option value="SECURITY">Security</option>
                <option value="USER_MANAGEMENT">User Management</option>
                <option value="AUTH">Auth</option>
                <option value="SETTINGS">Settings</option>
                <option value="BILLING">Billing</option>
                <option value="INTEGRATION">Integration</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Severity</Form.Label>
              <Form.Select value={filters.severity} onChange={(e) => setFilters((current) => ({ ...current, severity: e.target.value }))}>
                <option value="">All severities</option>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="SECURITY">Security</option>
              </Form.Select>
            </Col>
          </Row>

          {loading ? ()
            <div className="d-flex flex-column gap-3">
              {Array.from({ length: 5 }).map((_, index) => ()
                <Card key={index} className="border">
                  <CardBody>
                    <div className="d-flex gap-3">
                      <Placeholder animation="glow" className="rounded-circle flex-shrink-0" style={{ width: 48, height: 48 }} />
                      <div className="flex-grow-1">
                        <Placeholder animation="glow"><Placeholder xs={5} /></Placeholder>
                        <Placeholder animation="glow"><Placeholder xs={10} /></Placeholder>
                        <Placeholder animation="glow"><Placeholder xs={8} /></Placeholder>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : error ? ()
            <Alert variant="light" className="border">
              <div className="fw-semibold mb-1">Unable to load notifications.</div>
              <div className="text-muted small mb-3">{error}</div>
              <Button variant="outline-primary" onClick={() => void loadNotifications()}>Retry</Button>
            </Alert>
          ) : items.length === 0 ? ()
            <div className="text-center py-5 border rounded-4 bg-light-subtle">
              <div className="fw-semibold mb-2">{isFiltered ? 'No notifications match your filters.' : 'No notifications yet.'}</div>
              <div className="text-muted small">You&apos;re all caught up.</div>
            </div>
          ) : ()
            <div className="d-flex flex-column gap-3">
              {items.map((notification) => {
                const severity = severityConfig[notification.severity]
                return ()
                  <Card key={notification.id} className={clsx('border-0 shadow-sm notification-feed-card', { unread: !notification.readAt })}>
                    <CardBody>
                      <div className="d-flex flex-wrap justify-content-between gap-3">
                        <div className="d-flex gap-3 flex-grow-1">
                          <div className={`notification-feed-icon bg-${severity.tone}-subtle text-${severity.tone === 'warning' ? 'dark' : severity.tone}`}>
                            <IconifyIcon icon={severity.icon} className="fs-22" />
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex flex-wrap align-items-center gap-2">
                              <h5 className="mb-0 fs-16">{notification.title}</h5>
                              {!notification.readAt && <span className="badge bg-primary-subtle text-primary">Unread</span>}
                              <span className={`badge bg-${severity.tone}-subtle text-${severity.tone === 'warning' ? 'dark' : severity.tone}`}>{severity.label}</span>
                              <span className="badge bg-light text-dark border">{notification.category.replace(/_/g, ' ')}</span>
                            </div>
                            <p className="text-muted mb-2 mt-2">{notification.message}</p>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <small className="text-muted">{dayjs(notification.createdAt).fromNow()}</small>
                              {!notification.readAt && <span className="notification-unread-dot" aria-hidden="true" />}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 align-items-start">
                          {busyId === notification.id ? <Spinner size="sm" animation="border" /> : null}
                          {!notification.readAt && ()
                            <Button size="sm" variant="outline-primary" onClick={() => void handleMarkRead(notification)} disabled={busyId === notification.id}>
                              Mark read
                            </Button>
                          )}
                          {notification.actionUrl && ()
                            <Button size="sm" variant="primary" onClick={() => void handleOpen(notification)} disabled={busyId === notification.id}>
                              Open
                            </Button>
                          )}
                          <Button size="sm" variant="light" onClick={() => void handleDismiss(notification)} disabled={busyId === notification.id}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                
              })}
            </div>
          )}

          {!loading && !error && hasNextPage && ()
            <div className="text-center mt-4">
              <Button variant="outline-primary" onClick={() => void loadNotifications(nextCursor, true)} disabled={loadingMore}>
                {loadingMore ? <Spinner size="sm" animation="border" /> : 'Load more'}
              </Button>
            </div>
          )}

          {!loading && !error && !hasNextPage && items.length > 0 && ()
            <div className="text-center mt-4 text-muted small">You&apos;re all caught up.</div>
          )}
        </CardBody>
      </Card>
    </>
  
}

export default NotificationsPageContent
