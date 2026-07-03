'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { apiClient } from '@/lib/apiClient'
import ApiErrorState from '@/components/common/ApiErrorState'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

type NotificationItem = {
  id: string
  title: string
  message: string
  status: 'UNREAD' | 'READ' | 'ARCHIVED'
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SECURITY' | 'CRITICAL'
  category: 'SECURITY' | 'SYSTEM' | 'ADMIN' | 'OAUTH' | 'MAIL' | 'SMS' | 'GENERAL' | 'AUTH' | 'SETTINGS' | 'USER_MANAGEMENT' | 'BILLING' | 'INTEGRATION'
  createdAt: string
  readAt?: string | null
  archivedAt?: string | null
  actionUrl?: string | null
}

type NotificationListResponse = {
  items?: NotificationItem[]
}

const FILTERS = [
  { label: 'All', status: 'all' },
  { label: 'Unread', status: 'unread' },
  { label: 'Security', status: 'all', category: 'SECURITY' },
  { label: 'System', status: 'all', category: 'SYSTEM' },
  { label: 'Admin', status: 'all', category: 'ADMIN' },
  { label: 'OAuth', status: 'all', category: 'OAUTH' },
  { label: 'Mail/SMS', status: 'all', category: 'MAIL' },
  { label: 'Archived', status: 'archived' },
] as const

const severityVariant: Record<string, string> = {
  CRITICAL: 'danger',
  SECURITY: 'danger',
  ERROR: 'danger',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info',
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [selected, setSelected] = useState<NotificationItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams()
      if (statusFilter !== 'all') query.set('status', statusFilter)
      if (categoryFilter) query.set('category', categoryFilter)
      query.set('limit', '50')
      const data = await apiClient.get<NotificationListResponse>(`/admin/notifications?${query.toString()}`)
      setItems(data?.items ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load notifications.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter, categoryFilter])

  const filteredItems = useMemo(() => items, [items])

  const updateItem = (id: string, patch: Partial<NotificationItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const markRead = async (id: string) => {
    setMutating(id)
    try {
      const notification = await apiClient.patch<NotificationItem>(`/admin/notifications/${id}/read`)
      updateItem(id, { ...notification, status: 'READ' })
    } finally {
      setMutating(null)
    }
  }

  const archiveNotification = async (id: string) => {
    if (!window.confirm('Archive this notification?')) return
    setMutating(id)
    try {
      const notification = await apiClient.delete<NotificationItem>(`/admin/notifications/${id}`)
      updateItem(id, { ...notification, status: 'ARCHIVED' })
    } finally {
      setMutating(null)
    }
  }

  const markAllRead = async () => {
    if (!window.confirm('Mark all visible notifications as read?')) return
    setMutating('all')
    try {
      await apiClient.patch('/admin/notifications/read-all')
      setItems((prev) => prev.map((item) => ({ ...item, status: item.status === 'ARCHIVED' ? item.status : 'READ' })))
    } finally {
      setMutating(null)
    }
  }

  const clearArchived = async () => {
    if (!window.confirm('Clear archived notifications from the current view?')) return
    setMutating('clear')
    try {
      setItems((prev) => prev.filter((item) => item.status !== 'ARCHIVED'))
    } finally {
      setMutating(null)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Notifications</h4>
          <p className="text-muted mb-0 fs-13">Security and system notifications only. Audit activity stays in audit logs.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={load} disabled={loading}>
            <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16 me-1' : 'fs-16 me-1'} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={markAllRead} disabled={mutating !== null}>
            Mark all read
          </Button>
        </div>
      </div>

      {error ? (
        <ApiErrorState message={error} onRetry={load} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <Row className="g-2 align-items-center mb-3">
              <Col md={3}>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                  {FILTERS.filter((item): item is (typeof FILTERS)[number] & { category?: never } => !('category' in item)).map((item) => (
                    <option key={item.label} value={item.status}>
                      {item.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="">All categories</option>
                  <option value="SECURITY">Security</option>
                  <option value="SYSTEM">System</option>
                  <option value="ADMIN">Admin</option>
                  <option value="OAUTH">OAuth</option>
                  <option value="MAIL">Mail</option>
                  <option value="SMS">SMS</option>
                  <option value="GENERAL">General</option>
                </Form.Select>
              </Col>
              <Col md="auto" className="ms-auto">
                <Button variant="outline-danger" size="sm" onClick={clearArchived} disabled={mutating !== null}>
                  Safe clear archived
                </Button>
              </Col>
            </Row>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState message="No notifications match the current filters." icon="solar:bell-bing-bold-duotone" />
            ) : (
              <Table responsive hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((notification) => (
                    <tr key={notification.id}>
                      <td>
                        <div className="fw-semibold text-dark">{notification.title}</div>
                        <div className="text-muted fs-12 text-wrap">{notification.message}</div>
                      </td>
                      <td><Badge bg="soft-secondary" className="text-secondary">{notification.category}</Badge></td>
                      <td><Badge bg={`soft-${severityVariant[notification.severity] ?? 'info'}`} className={`text-${severityVariant[notification.severity] ?? 'info'}`}>{notification.severity}</Badge></td>
                      <td><Badge bg={notification.status === 'UNREAD' ? 'soft-danger' : notification.status === 'READ' ? 'soft-success' : 'soft-secondary'} className={notification.status === 'UNREAD' ? 'text-danger' : notification.status === 'READ' ? 'text-success' : 'text-secondary'}>{notification.status}</Badge></td>
                      <td className="text-secondary fs-13">{new Date(notification.createdAt).toLocaleString()}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          {notification.status !== 'READ' && (
                            <Button size="sm" variant="outline-primary" onClick={() => markRead(notification.id)} disabled={mutating === notification.id}>
                              Mark read
                            </Button>
                          )}
                          {notification.status !== 'ARCHIVED' && (
                            <Button size="sm" variant="outline-danger" onClick={() => archiveNotification(notification.id)} disabled={mutating === notification.id}>
                              Archive
                            </Button>
                          )}
                          <Button size="sm" variant="outline-secondary" onClick={() => setSelected(notification)}>
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
          <Modal.Title>Notification Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap gap-2">
                <Badge bg="soft-primary" className="text-primary">{selected.category}</Badge>
                <Badge bg={`soft-${severityVariant[selected.severity] ?? 'info'}`} className={`text-${severityVariant[selected.severity] ?? 'info'}`}>{selected.severity}</Badge>
                <Badge bg="soft-secondary" className="text-secondary">{selected.status}</Badge>
              </div>
              <div><strong>Title:</strong> {selected.title}</div>
              <div><strong>Message:</strong> {selected.message}</div>
              <div><strong>Created:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
              <div><strong>Read:</strong> {selected.readAt ? new Date(selected.readAt).toLocaleString() : 'Not read'}</div>
              <div><strong>Archived:</strong> {selected.archivedAt ? new Date(selected.archivedAt).toLocaleString() : 'Not archived'}</div>
              {selected.actionUrl && <div><strong>Action:</strong> {selected.actionUrl}</div>}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
