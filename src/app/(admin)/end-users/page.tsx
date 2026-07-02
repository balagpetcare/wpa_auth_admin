'use client'

// Phase 2 module (docs/phase-2-core-identity-admin-modules.md): the admin
// panel previously had no screen for actual platform end-users/customers,
// only for internal admin operators (see /admin-users). This page is backed
// by the dedicated GET/PATCH /admin/end-users* routes added in
// admin.routes.ts, which are permission-gated (users:read / users:manage)
// separately from the admin-team routes.

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Button, Form, Offcanvas, Modal, Spinner, Badge, Tabs, Tab } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { endUsersApi } from '@/features/end-users/api'
import { EndUser, EndUserDetail } from '@/features/end-users/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatusBadge, EmptyState } from '@/components/dashboard/DashboardComponents'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'

export default function EndUsersPage() {
  const [users, setUsers] = useState<EndUser[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [selectedUser, setSelectedUser] = useState<EndUserDetail | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ targetId: string; nextStatus: string; title: string; message: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadUsers = async (opts: { cursor?: string; append?: boolean } = {}) => {
    if (opts.append) setLoadingMore(true)
    else {
      setLoading(true)
      setPageError(null)
    }
    try {
      const response = await endUsersApi.listEndUsers({
        q: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        limit: 25,
        cursor: opts.cursor,
      })
      if (response.success && response.data) {
        const items = response.data.items || []
        setUsers((prev) => (opts.append ? [...prev, ...items] : items))
        setNextCursor(response.data.pagination?.nextCursor ?? null)
        setHasNextPage(Boolean(response.data.pagination?.hasNextPage))
      }
    } catch (error: any) {
      console.error('Failed to load end users:', error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setPageError({ message: 'You do not have permission to view end users.', status: error.status })
        } else {
          setPageError({ message: error.message || 'Unable to load end users.', status: error.status })
        }
      } else {
        setPageError({ message: 'Unable to load end users.' })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter])

  const handleOpenDrawer = async (user: EndUser) => {
    setShowDrawer(true)
    setDrawerLoading(true)
    setSelectedUser(user)
    try {
      const response = await endUsersApi.getEndUser(user.id)
      if (response.success) {
        setSelectedUser(response.user)
      }
    } catch (error) {
      console.error('Failed to load end user detail:', error)
      toast.error('Failed to load user detail.')
    } finally {
      setDrawerLoading(false)
    }
  }

  const handleOpenConfirm = (targetId: string, nextStatus: string, title: string, message: string) => {
    setConfirmAction({ targetId, nextStatus, title, message })
    setShowConfirmModal(true)
  }

  const executeStatusChange = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      const res = await endUsersApi.updateStatus(confirmAction.targetId, confirmAction.nextStatus)
      if (res.success) {
        toast.success(`User status set to ${confirmAction.nextStatus}.`)
        setUsers((prev) => prev.map((u) => (u.id === confirmAction.targetId ? { ...u, status: confirmAction.nextStatus as EndUser['status'] } : u)))
        if (selectedUser?.id === confirmAction.targetId) {
          setSelectedUser({ ...selectedUser, status: confirmAction.nextStatus as EndUser['status'] })
        }
      }
    } catch (error: any) {
      console.error('Failed to update user status:', error)
      toast.error(error?.message || 'Failed to update user status.')
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">End Users</h4>
          <p className="text-muted mb-0 fs-13">Platform customer accounts — separate from internal admin operators.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={6} lg={4}>
              <Form.Control
                type="search"
                placeholder="Search by email, username, name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col md={4} lg={3}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="DELETED">Deleted</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {pageError ? (
        <ApiErrorState message={pageError.message} status={pageError.status} onRetry={() => loadUsers()} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : users.length === 0 ? (
              <EmptyState message="No end users found." icon="solar:users-group-rounded-bold-duotone" />
            ) : (
              <>
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4">User</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Verification</th>
                      <th>Created</th>
                      <th>Last Login</th>
                      <th className="text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-13"
                              style={{ width: '36px', height: '36px' }}
                            >
                              {(user.displayName || user.username || user.email).substring(0, 2).toUpperCase()}
                            </div>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold text-dark fs-14">{user.displayName || user.username || '—'}</span>
                              <span className="text-muted fs-11">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-secondary fs-13">{user.phone || '—'}</span>
                        </td>
                        <td>
                          <StatusBadge status={user.status} />
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Badge bg={user.emailVerifiedAt ? 'soft-success' : 'soft-secondary'} className={user.emailVerifiedAt ? 'text-success' : 'text-secondary'}>
                              Email {user.emailVerifiedAt ? '✓' : '—'}
                            </Badge>
                            <Badge bg={user.phoneVerifiedAt ? 'soft-success' : 'soft-secondary'} className={user.phoneVerifiedAt ? 'text-success' : 'text-secondary'}>
                              Phone {user.phoneVerifiedAt ? '✓' : '—'}
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <span className="text-secondary fs-13">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td>
                          <span className="text-secondary fs-13">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                        </td>
                        <td className="text-end px-4">
                          <div className="d-flex justify-content-end gap-1">
                            <Button variant="link" size="sm" className="p-0 text-primary me-2" onClick={() => handleOpenDrawer(user)}>
                              View
                            </Button>
                            {user.status === 'ACTIVE' ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-danger"
                                disabled={user.isLastSuperAdmin}
                                title={user.isLastSuperAdmin ? 'Cannot suspend the last active super admin.' : undefined}
                                onClick={() =>
                                  handleOpenConfirm(
                                    user.id,
                                    'SUSPENDED',
                                    'Suspend User?',
                                    `Suspend ${user.displayName || user.email}? They will be signed out and unable to log back in until reactivated.`
                                  )
                                }
                              >
                                Suspend
                              </Button>
                            ) : user.status === 'SUSPENDED' ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-success"
                                onClick={() =>
                                  handleOpenConfirm(user.id, 'ACTIVE', 'Activate User?', `Restore active access for ${user.displayName || user.email}?`)
                                }
                              >
                                Activate
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {hasNextPage && (
                  <div className="text-center py-3 border-top">
                    <Button variant="outline-primary" size="sm" disabled={loadingMore} onClick={() => loadUsers({ cursor: nextCursor || undefined, append: true })}>
                      {loadingMore ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {/* DETAIL DRAWER */}
      <Offcanvas show={showDrawer} onHide={() => setShowDrawer(false)} placement="end" style={{ width: '450px' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold">User Profile</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {drawerLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : selectedUser ? (
            <div>
              <div className="text-center py-4 border-bottom mb-3">
                <div
                  className="bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-20 mx-auto mb-3"
                  style={{ width: '64px', height: '64px' }}
                >
                  {(selectedUser.displayName || selectedUser.username || selectedUser.email).substring(0, 2).toUpperCase()}
                </div>
                <h5 className="fw-bold mb-0">{selectedUser.displayName || selectedUser.username || 'Unnamed User'}</h5>
                <p className="text-muted mb-2 fs-13">{selectedUser.email}</p>
                <StatusBadge status={selectedUser.status} />
              </div>

              <Tabs defaultActiveKey="profile" className="mb-3">
                <Tab eventKey="profile" title="Profile">
                  <div className="d-flex flex-column gap-2 mt-2 fs-13">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Phone</span>
                      <span className="fw-semibold">{selectedUser.phone || '—'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Email Verified</span>
                      <span className="fw-semibold">{selectedUser.emailVerifiedAt ? new Date(selectedUser.emailVerifiedAt).toLocaleDateString() : 'No'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Phone Verified</span>
                      <span className="fw-semibold">{selectedUser.phoneVerifiedAt ? new Date(selectedUser.phoneVerifiedAt).toLocaleDateString() : 'No'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Created</span>
                      <span className="fw-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Last Login</span>
                      <span className="fw-semibold">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                    {selectedUser.oauthProviders && selectedUser.oauthProviders.length > 0 && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Connected Accounts</span>
                        <span className="fw-semibold">{selectedUser.oauthProviders.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </Tab>
                <Tab eventKey="sessions" title="Sessions">
                  <div className="mt-2">
                    {selectedUser.recentSessions && selectedUser.recentSessions.length > 0 ? (
                      selectedUser.recentSessions.map((s) => (
                        <div key={s.id} className="border-bottom py-2 fs-12">
                          <div className="fw-semibold">{s.ipAddress || 'Unknown IP'}</div>
                          <div className="text-muted text-truncate">{s.userAgent || 'Unknown device'}</div>
                          <div className="text-muted">{new Date(s.createdAt).toLocaleString()} {s.revokedAt ? '(revoked)' : ''}</div>
                        </div>
                      ))
                    ) : (
                      <EmptyState message="No recent sessions." icon="solar:bookmark-opened-bold-duotone" />
                    )}
                  </div>
                </Tab>
                <Tab eventKey="activity" title="Activity">
                  <div className="mt-2">
                    {selectedUser.recentAuditLogs && selectedUser.recentAuditLogs.length > 0 ? (
                      selectedUser.recentAuditLogs.map((a) => (
                        <div key={a.id} className="border-bottom py-2 fs-12">
                          <div className="fw-semibold">{a.action}</div>
                          <div className="text-muted">{new Date(a.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    ) : (
                      <EmptyState message="No recent audit activity." icon="solar:document-text-bold-duotone" />
                    )}
                  </div>
                </Tab>
              </Tabs>

              <div className="border-top pt-3 mt-3">
                {selectedUser.status === 'ACTIVE' ? (
                  <Button
                    variant="outline-danger"
                    className="w-100"
                    disabled={selectedUser.isLastSuperAdmin}
                    onClick={() =>
                      handleOpenConfirm(selectedUser.id, 'SUSPENDED', 'Suspend User?', `Suspend ${selectedUser.displayName || selectedUser.email}?`)
                    }
                  >
                    Suspend Account
                  </Button>
                ) : selectedUser.status === 'SUSPENDED' ? (
                  <Button
                    variant="outline-success"
                    className="w-100"
                    onClick={() => handleOpenConfirm(selectedUser.id, 'ACTIVE', 'Activate User?', `Restore access for ${selectedUser.displayName || selectedUser.email}?`)}
                  >
                    Activate Account
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </Offcanvas.Body>
      </Offcanvas>

      {/* CONFIRM MODAL */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-18">{confirmAction?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmAction?.message}</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowConfirmModal(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button variant={confirmAction?.nextStatus === 'SUSPENDED' ? 'danger' : 'success'} onClick={executeStatusChange} disabled={actionLoading}>
            {actionLoading ? <Spinner animation="border" size="sm" className="me-1" /> : <IconifyIcon icon="solar:check-circle-bold-duotone" className="me-1" />}
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
