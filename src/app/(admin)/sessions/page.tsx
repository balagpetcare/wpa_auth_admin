'use client'

import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Badge,
  Spinner,
  Alert
} from 'react-bootstrap'
import { sessionsApi } from '@/features/sessions/api'
import { adminUsersApi } from '@/features/admin-users/api'
import { ActiveSession } from '@/features/sessions/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatusBadge, EmptyState, ErrorState } from '@/components/dashboard/DashboardComponents'
import adminToast from '@/lib/adminToast'
import { getAdminErrorMessage } from '@/lib/adminErrorMessage'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Modals & Action States
  const [actionLoading, setActionLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'revoke' | 'revoke-user-all'
    targetId: string
    title: string
    message: string
  } | null>(null)

  const extractPaged = (response: any) => {
    const data = response?.data ?? response
    return {
      items: data?.items ?? response?.sessions ?? response?.items ?? [],
      nextCursor: data?.nextCursor ?? response?.nextCursor ?? null,
      hasNextPage: Boolean(data?.hasNextPage ?? response?.hasNextPage),
    }
  }

  const loadSessions = async (append = false) => {
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setError(null)
      setSessions([])
      setNextCursor(null)
      setHasNextPage(false)
    }
    try {
      const response = await sessionsApi.listSessions({
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        limit: 25,
        cursor: append ? nextCursor ?? undefined : undefined,
      })
      if (response.success) {
        const { items, nextCursor: cursor, hasNextPage: next } = extractPaged(response)
        setSessions((prev) => (append ? [...prev, ...items] : items))
        setNextCursor(cursor)
        setHasNextPage(next)
      }
    } catch (err: any) {
      console.error('Failed to load sessions:', err)
      setError(err?.message || 'Access Denied: Missing permissions to query system sessions.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [searchTerm, statusFilter])

  const handleOpenConfirm = (
    type: 'revoke' | 'revoke-user-all',
    targetId: string,
    title: string,
    message: string
  ) => {
    setConfirmAction({ type, targetId, title, message })
    setShowConfirmModal(true)
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    const { type, targetId } = confirmAction

    try {
      if (type === 'revoke') {
        const res = await sessionsApi.revokeSession(targetId)
        if (res.success) {
          adminToast.success('Session revoked successfully.', 'The active session was revoked.')
          loadSessions()
        }
      } else if (type === 'revoke-user-all') {
        const res = await adminUsersApi.revokeUserSessions(targetId)
        if (res.success) {
          adminToast.success('All administrative sessions for this user revoked.', 'The user session list was cleared successfully.')
          loadSessions()
        }
      }
    } catch (err: any) {
      console.error('Revocation failed:', err)
      adminToast.error('Action failed.', getAdminErrorMessage(err, 'Please try again.'))
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Active Authentication Sessions</h4>
          <p className="text-muted mb-0 fs-13">Inspect active sessions across the gateway, trace IP origins, and force-revoke tokens.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => loadSessions()} disabled={loading} className="d-flex align-items-center gap-1 px-3 py-2 shadow-sm">
          <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16' : 'fs-16'} />
          Refresh Directory
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={() => loadSessions()} />}

      <Card className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
        <Card.Body className="p-0">
          {/* SEARCH & FILTER */}
          <div className="p-4 border-bottom d-flex flex-wrap align-items-center gap-3">
            <div style={{ minWidth: '280px' }}>
              <Form.Control
                type="text"
                placeholder="Search by username, email, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '160px' }}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="REVOKED">Revoked</option>
              </Form.Select>
            </div>
          </div>

          {/* LIST */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState message="No active authentication sessions found." icon="solar:bookmark-opened-bold-duotone" />
          ) : (
            <div className="table-responsive">
              <Table className="align-middle mb-0" hover>
                <thead className="table-light">
                  <tr>
                    <th>Session Owner</th>
                    <th>IP Address</th>
                    <th>Device / User Agent</th>
                    <th>Created</th>
                    <th>Last Active</th>
                    <th>Status</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold text-dark fs-14">
                            {session.user?.displayName || session.user?.username || 'Unknown'}
                          </span>
                          <span className="text-muted fs-11">{session.user?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-secondary fs-13 font-monospace">{session.ipAddress || '127.0.0.1'}</span>
                      </td>
                      <td>
                        <span className="text-secondary fs-12 text-truncate d-inline-block" style={{ maxWidth: '240px' }} title={session.userAgent}>
                          {session.userAgent || 'Unknown Device'}
                        </span>
                      </td>
                      <td>
                        <span className="text-secondary fs-13">{new Date(session.createdAt).toLocaleTimeString()}</span>
                      </td>
                      <td>
                        <span className="text-secondary fs-13">
                          {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleTimeString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={session.status} />
                      </td>
                      <td className="text-end px-4">
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              handleOpenConfirm(
                                'revoke',
                                session.id,
                                'Revoke Active Session?',
                                'Are you sure you want to terminate this token? The user will be forced to log in again.'
                              )
                            }
                          >
                            Terminate
                          </Button>
                          {session.userId && (
                            <Button
                              variant="soft-danger"
                              size="sm"
                              onClick={() =>
                                handleOpenConfirm(
                                  'revoke-user-all',
                                  session.userId,
                                  'Revoke All Sessions for User?',
                                  'Are you sure you want to force terminate all active login sessions for this specific user?'
                                )
                              }
                            >
                              Revoke All
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {hasNextPage && (
                <div className="text-center py-3 border-top">
                  <Button variant="outline-primary" size="sm" disabled={loadingMore} onClick={() => loadSessions(true)}>
                    {loadingMore ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* CONFIRM ACTION MODAL */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{confirmAction?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0 fs-14">{confirmAction?.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowConfirmModal(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={executeConfirmAction} disabled={actionLoading}>
            {actionLoading ? 'Revoking...' : 'Terminate Access'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
