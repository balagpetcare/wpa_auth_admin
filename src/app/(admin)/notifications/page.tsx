'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import ApiErrorState from '@/components/common/ApiErrorState'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { apiClient, ApiError } from '@/lib/apiClient'
import adminToast from '@/lib/adminToast'
import { getAdminErrorMessage } from '@/lib/adminErrorMessage'

type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED'
type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SECURITY' | 'CRITICAL'
type NotificationCategory = 'SECURITY' | 'SYSTEM' | 'ADMIN' | 'OAUTH' | 'MAIL' | 'SMS' | 'GENERAL' | 'AUTH' | 'SETTINGS' | 'USER_MANAGEMENT' | 'BILLING' | 'INTEGRATION'

type NotificationItem = {
  id: string
  title: string
  message: string
  type?: string | null
  source?: string | null
  status: NotificationStatus
  severity: NotificationSeverity
  category: NotificationCategory
  createdAt: string
  readAt?: string | null
  archivedAt?: string | null
  actionUrl?: string | null
  metadata?: Record<string, unknown> | null
}

type NotificationListResponse = {
  items?: NotificationItem[]
  unreadCount?: number
  totalCount?: number
  readCount?: number
  archivedCount?: number
  pagination?: {
    limit?: number
    nextCursor?: string | null
    hasNextPage?: boolean
  }
}

type DatePreset = 'all' | 'today' | '7d' | '30d'

const categoryOptions: Array<{ label: string; value: string }> = [
  { label: 'All categories', value: '' },
  { label: 'Security', value: 'SECURITY' },
  { label: 'System', value: 'SYSTEM' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'OAuth', value: 'OAUTH' },
  { label: 'Mail', value: 'MAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'General', value: 'GENERAL' },
  { label: 'Auth', value: 'AUTH' },
  { label: 'Settings', value: 'SETTINGS' },
  { label: 'User management', value: 'USER_MANAGEMENT' },
  { label: 'Billing', value: 'BILLING' },
  { label: 'Integration', value: 'INTEGRATION' },
]

const severityVariant: Record<NotificationSeverity, { bg: string; text: string; label: string }> = {
  INFO: { bg: 'soft-info', text: 'info', label: 'Info' },
  SUCCESS: { bg: 'soft-success', text: 'success', label: 'Success' },
  WARNING: { bg: 'soft-warning', text: 'warning', label: 'Warning' },
  ERROR: { bg: 'soft-danger', text: 'danger', label: 'Error' },
  SECURITY: { bg: 'soft-danger', text: 'danger', label: 'Security' },
  CRITICAL: { bg: 'soft-danger', text: 'danger', label: 'Critical' },
}

const statusVariant: Record<NotificationStatus, { bg: string; text: string; label: string }> = {
  UNREAD: { bg: 'soft-danger', text: 'danger', label: 'Unread' },
  READ: { bg: 'soft-success', text: 'success', label: 'Read' },
  ARCHIVED: { bg: 'soft-secondary', text: 'secondary', label: 'Archived' },
}

const categoryIcon: Record<NotificationCategory, string> = {
  SECURITY: 'solar:shield-keyhole-bold-duotone',
  SYSTEM: 'solar:server-bold-duotone',
  ADMIN: 'solar:settings-bold-duotone',
  OAUTH: 'solar:key-minimalistic-bold-duotone',
  MAIL: 'solar:letter-bold-duotone',
  SMS: 'solar:chat-round-call-bold-duotone',
  GENERAL: 'solar:bell-bold-duotone',
  AUTH: 'solar:user-check-bold-duotone',
  SETTINGS: 'solar:settings-bold-duotone',
  USER_MANAGEMENT: 'solar:users-group-rounded-bold-duotone',
  BILLING: 'solar:card-bold-duotone',
  INTEGRATION: 'solar:link-circle-bold-duotone',
}

const normalizeNotificationResponse = (payload: any): NotificationListResponse => payload?.data ?? payload ?? {}

const toRange = (preset: DatePreset) => {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  if (preset === 'all') return {}
  const start = new Date(now)
  if (preset === 'today') start.setHours(0, 0, 0, 0)
  if (preset === '7d') start.setDate(start.getDate() - 7)
  if (preset === '30d') start.setDate(start.getDate() - 30)
  start.setHours(0, 0, 0, 0)
  return { createdFrom: start.toISOString(), createdTo: end.toISOString() }
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

const redactMetadata = (value: unknown, depth = 0): unknown => {
  if (value == null || depth > 6) return value
  if (Array.isArray(value)) return value.map((item) => redactMetadata(item, depth + 1))
  if (typeof value !== 'object') return value
  const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    const lower = key.toLowerCase()
    if (/(token|secret|password|otp|authorization|api[-_]?key|refresh|private[-_]?key|client[-_]?secret)/.test(lower)) {
      return [key, '[REDACTED]']
    }
    return [key, redactMetadata(item, depth + 1)]
  })
  return Object.fromEntries(entries)
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<NotificationItem | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [datePreset, setDatePreset] = useState<DatePreset>('all')

  const [summary, setSummary] = useState({ total: 0, unread: 0, read: 0, archived: 0 })
  const [pageMeta, setPageMeta] = useState({ nextCursor: null as string | null, hasNextPage: false, limit: 20 })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams()
      query.set('limit', String(pageMeta.limit))
      if (statusFilter !== 'all') query.set('status', statusFilter)
      if (categoryFilter) query.set('category', categoryFilter)
      if (search.trim()) query.set('search', search.trim())
      const range = toRange(datePreset) as Partial<{ createdFrom: string; createdTo: string }>
      if (range.createdFrom && range.createdTo) {
        query.set('createdFrom', range.createdFrom)
        query.set('createdTo', range.createdTo)
      }
      const payload = await apiClient.get<NotificationListResponse>(`/admin/notifications?${query.toString()}`)
      const data = normalizeNotificationResponse(payload)
      setItems(data.items ?? [])
      setSummary({
        total: data.totalCount ?? data.items?.length ?? 0,
        unread: data.unreadCount ?? 0,
        read: data.readCount ?? 0,
        archived: data.archivedCount ?? 0,
      })
      setPageMeta({
        nextCursor: data.pagination?.nextCursor ?? null,
        hasNextPage: Boolean(data.pagination?.hasNextPage),
        limit: data.pagination?.limit ?? pageMeta.limit,
      })
      return true
    } catch (err: any) {
      const message = getAdminErrorMessage(err, 'Failed to load notifications.')
      setError(message)
      adminToast.error('Failed to load notifications.', message)
      setItems([])
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, datePreset])

  useEffect(() => {
    const handler = () => {
      void load()
    }
    window.addEventListener('wpa_notifications_changed', handler)
    return () => window.removeEventListener('wpa_notifications_changed', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, datePreset, search, pageMeta.limit])

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!term) return true
      const haystack = [
        item.title,
        item.message,
        item.category,
        item.type ?? '',
        item.source ?? '',
      ].join(' ').toLowerCase()
      return haystack.includes(term)
    })
  }, [items, search])

  const refresh = async () => {
    const ok = await load()
    if (ok) {
      window.dispatchEvent(new Event('wpa_notifications_changed'))
      adminToast.success('Notifications refreshed.', 'The latest notification data is now visible.')
    }
  }

  const updateItem = (id: string, patch: Partial<NotificationItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const markRead = async (id: string) => {
    setMutating(id)
    try {
      const response = await apiClient.patch<NotificationItem>(`/admin/notifications/${id}/read`)
      const notification = normalizeNotificationResponse(response) as NotificationItem
      updateItem(id, { ...notification, status: 'READ' })
      window.dispatchEvent(new Event('wpa_notifications_changed'))
      void load()
      adminToast.success('Notification marked as read.', 'The notification has been updated successfully.')
    } catch (err) {
      adminToast.error('Failed to update notification.', getAdminErrorMessage(err, 'Please try again.'))
    } finally {
      setMutating(null)
    }
  }

  const markUnread = async (id: string) => {
    setMutating(id)
    try {
      const response = await apiClient.patch<NotificationItem>(`/admin/notifications/${id}/unread`)
      const notification = normalizeNotificationResponse(response) as NotificationItem
      updateItem(id, { ...notification, status: 'UNREAD' })
      window.dispatchEvent(new Event('wpa_notifications_changed'))
      void load()
      adminToast.success('Notification marked as unread.', 'The notification has been updated successfully.')
    } catch (err) {
      adminToast.error('Failed to update notification.', getAdminErrorMessage(err, 'Please try again.'))
    } finally {
      setMutating(null)
    }
  }

  const archiveNotification = async (id: string) => {
    setMutating(id)
    try {
      const response = await apiClient.delete<NotificationItem>(`/admin/notifications/${id}`)
      const notification = normalizeNotificationResponse(response) as NotificationItem
      updateItem(id, { ...notification, status: 'ARCHIVED' })
      window.dispatchEvent(new Event('wpa_notifications_changed'))
      void load()
      adminToast.success('Notification archived.', 'The notification has been archived successfully.')
    } catch (err) {
      adminToast.error('Failed to archive notification.', getAdminErrorMessage(err, 'Please try again.'))
    } finally {
      setMutating(null)
    }
  }

  const markAllRead = async () => {
    if (!window.confirm('Mark all visible notifications as read?')) return
    setMutating('all')
    try {
      await apiClient.patch('/admin/notifications/read-all')
      setItems((prev) => prev.map((item) => (item.status === 'ARCHIVED' ? item : { ...item, status: 'READ', readAt: item.readAt ?? new Date().toISOString() })))
      window.dispatchEvent(new Event('wpa_notifications_changed'))
      void load()
      adminToast.success('All visible notifications marked as read.', 'Unread items were updated successfully.')
    } catch (err) {
      adminToast.error('Failed to mark notifications as read.', getAdminErrorMessage(err, 'Please try again.'))
    } finally {
      setMutating(null)
    }
  }

  const clearArchived = async () => {
    if (!window.confirm('Remove archived notifications from this view?')) return
    setMutating('clear')
    try {
      await apiClient.delete('/admin/notifications/archived')
      await refresh()
      window.dispatchEvent(new Event('wpa_notifications_changed'))
      adminToast.success('Archived notifications cleared.', 'Archived items were removed from the current list.')
    } catch (err) {
      adminToast.error('Failed to clear archived notifications.', getAdminErrorMessage(err, 'Please try again.'))
    } finally {
      setMutating(null)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Notifications</h4>
          <p className="text-muted mb-0 fs-13">Security and system notifications stay in sync with the topbar bell.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-secondary" size="sm" onClick={refresh} disabled={loading}>
            <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16 me-1' : 'fs-16 me-1'} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={markAllRead} disabled={mutating !== null}>
            Mark all as read
          </Button>
          <Button variant="outline-danger" size="sm" onClick={clearArchived} disabled={mutating !== null}>
            Safe clear archived
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {[
          { label: 'Total', value: summary.total, icon: 'solar:bell-bold-duotone', tone: 'primary' },
          { label: 'Unread', value: summary.unread, icon: 'solar:bell-bing-bold-duotone', tone: 'danger' },
          { label: 'Read', value: summary.read, icon: 'solar:check-circle-bold-duotone', tone: 'success' },
          { label: 'Archived', value: summary.archived, icon: 'solar:archive-bold-duotone', tone: 'secondary' },
        ].map((card) => (
          <Col lg={3} md={6} key={card.label}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted fs-12">{card.label}</div>
                  <div className="fs-3 fw-bold text-dark">{card.value}</div>
                </div>
                <div className={`avatar-md bg-soft-${card.tone} text-${card.tone} rounded-circle d-flex align-items-center justify-content-center`}>
                  <IconifyIcon icon={card.icon} className="fs-20" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {error ? (
        <ApiErrorState message={error} onRetry={load} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-end mb-3">
              <Col lg={4} md={6}>
                <Form.Label className="fw-semibold fs-13">Search</Form.Label>
                <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, message, category, source" />
              </Col>
              <Col lg={2} md={6}>
                <Form.Label className="fw-semibold fs-13">Status</Form.Label>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="archived">Archived</option>
                </Form.Select>
              </Col>
              <Col lg={2} md={6}>
                <Form.Label className="fw-semibold fs-13">Category</Form.Label>
                <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  {categoryOptions.map((option) => (
                    <option key={option.label} value={option.value}>{option.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={2} md={6}>
                <Form.Label className="fw-semibold fs-13">Date range</Form.Label>
                <Form.Select value={datePreset} onChange={(e) => setDatePreset(e.target.value as DatePreset)}>
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </Form.Select>
              </Col>
              <Col lg={2} className="d-flex gap-2 justify-content-lg-end">
                <Button variant="outline-secondary" size="sm" onClick={load} disabled={loading}>
                  Refresh
                </Button>
                <Button variant="outline-primary" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter(''); setDatePreset('all'); }}>
                  Reset
                </Button>
              </Col>
            </Row>

            {loading ? (
              <div className="py-5 text-center"><Spinner animation="border" variant="primary" /></div>
            ) : visibleItems.length === 0 ? (
              <EmptyState
                message="No notifications found for the selected filters."
                icon="solar:bell-bing-bold-duotone"
              />
            ) : (
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '32%' }}>Notification</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((notification) => (
                    <tr key={notification.id}>
                      <td>
                        <div className="d-flex align-items-start gap-3">
                          <div className={`avatar-sm bg-soft-${severityVariant[notification.severity].text} text-${severityVariant[notification.severity].text} rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`}>
                            <IconifyIcon icon={categoryIcon[notification.category]} className="fs-16" />
                          </div>
                          <div>
                            <div className="fw-semibold text-dark mb-1">{notification.title}</div>
                            <div className="text-muted fs-12 text-wrap">{notification.message}</div>
                            {notification.actionUrl ? <div className="fs-12 text-primary mt-1">{notification.actionUrl}</div> : null}
                          </div>
                        </div>
                      </td>
                      <td><Badge bg="soft-secondary" className="text-secondary">{notification.category.replace('_', ' ')}</Badge></td>
                      <td><Badge bg={severityVariant[notification.severity].bg} className={`text-${severityVariant[notification.severity].text}`}>{severityVariant[notification.severity].label}</Badge></td>
                      <td><Badge bg={statusVariant[notification.status].bg} className={`text-${statusVariant[notification.status].text}`}>{statusVariant[notification.status].label}</Badge></td>
                      <td className="text-secondary fs-13">{formatDateTime(notification.createdAt)}</td>
                      <td className="text-end">
                        <div className="d-inline-flex flex-wrap gap-2 justify-content-end">
                          {notification.status === 'UNREAD' ? (
                            <Button size="sm" variant="outline-primary" disabled={mutating === notification.id} onClick={() => markRead(notification.id)}>
                              <IconifyIcon icon="solar:check-read-bold-duotone" className="me-1 fs-14" />
                              Mark read
                            </Button>
                          ) : notification.status === 'READ' ? (
                            <Button size="sm" variant="outline-secondary" disabled={mutating === notification.id} onClick={() => markUnread(notification.id)}>
                              <IconifyIcon icon="solar:bell-bing-bold-duotone" className="me-1 fs-14" />
                              Mark unread
                            </Button>
                          ) : null}
                          {notification.status !== 'ARCHIVED' && (
                            <Button size="sm" variant="outline-danger" disabled={mutating === notification.id} onClick={() => archiveNotification(notification.id)}>
                              <IconifyIcon icon="solar:archive-bold-duotone" className="me-1 fs-14" />
                              Archive
                            </Button>
                          )}
                          <Button size="sm" variant="outline-secondary" onClick={() => setSelected(notification)}>
                            <IconifyIcon icon="solar:eye-bold-duotone" className="me-1 fs-14" />
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={Boolean(selected)} onHide={() => setSelected(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Notification details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap gap-2">
                <Badge bg={statusVariant[selected.status].bg} className={`text-${statusVariant[selected.status].text}`}>{statusVariant[selected.status].label}</Badge>
                <Badge bg={severityVariant[selected.severity].bg} className={`text-${severityVariant[selected.severity].text}`}>{severityVariant[selected.severity].label}</Badge>
                <Badge bg="soft-secondary" className="text-secondary">{selected.category.replace('_', ' ')}</Badge>
              </div>
              <div><strong>Title:</strong> {selected.title}</div>
              <div><strong>Message:</strong> {selected.message}</div>
              <div><strong>Created:</strong> {formatDateTime(selected.createdAt)}</div>
              <div><strong>Read:</strong> {selected.readAt ? formatDateTime(selected.readAt) : 'Not read'}</div>
              <div><strong>Archived:</strong> {selected.archivedAt ? formatDateTime(selected.archivedAt) : 'Not archived'}</div>
              {selected.actionUrl ? <div><strong>Action:</strong> {selected.actionUrl}</div> : null}
              <div className="d-flex flex-wrap gap-2">
                {selected.status === 'UNREAD' ? (
                  <Button size="sm" variant="outline-primary" onClick={() => void markRead(selected.id)} disabled={mutating === selected.id}>
                    <IconifyIcon icon="solar:check-read-bold-duotone" className="me-1 fs-14" />
                    Mark read
                  </Button>
                ) : selected.status === 'READ' ? (
                  <Button size="sm" variant="outline-secondary" onClick={() => void markUnread(selected.id)} disabled={mutating === selected.id}>
                    <IconifyIcon icon="solar:bell-bing-bold-duotone" className="me-1 fs-14" />
                    Mark unread
                  </Button>
                ) : null}
                {selected.status !== 'ARCHIVED' ? (
                  <Button size="sm" variant="outline-danger" onClick={() => void archiveNotification(selected.id)} disabled={mutating === selected.id}>
                    <IconifyIcon icon="solar:archive-bold-duotone" className="me-1 fs-14" />
                    Archive
                  </Button>
                ) : null}
              </div>
              {selected.metadata ? (
                <div>
                  <div className="fw-semibold mb-2">Metadata</div>
                  <pre className="bg-light border rounded p-3 mb-0 fs-12" style={{ whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(redactMetadata(selected.metadata), null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
