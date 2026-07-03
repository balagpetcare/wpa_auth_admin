'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge, Button, Card, Col, Form, Modal, Offcanvas, Row, Spinner, Table } from 'react-bootstrap'
import { toast } from 'react-toastify'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ApiErrorState from '@/components/common/ApiErrorState'
import { EmptyState, StatusBadge } from '@/components/dashboard/DashboardComponents'
import { apiClient, ApiError } from '@/lib/apiClient'
import { endUsersApi } from '@/features/end-users/api'
import { EndUser, EndUserDetail, EndUserPresence } from '@/features/end-users/types'
import { useAuth } from '@/context/useAuthContext'

type ListState = {
  items: EndUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type Filters = Record<string, string>

const PAGE_SIZES = [25, 50, 100]
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'lastLoginAt:desc', label: 'Last login newest' },
  { value: 'lastLoginAt:asc', label: 'Last login oldest' },
  { value: 'failedLoginCount:desc', label: 'Highest failed login count' },
  { value: 'riskScore:desc', label: 'Highest risk score' },
  { value: 'country:asc', label: 'Country A-Z' },
  { value: 'status:asc', label: 'Status' },
  { value: 'emailVerifiedAt:desc', label: 'Verification status' },
]

const SAVED_SEGMENTS: Record<string, Filters> = {
  unverified: { emailVerified: 'false' },
  suspended: { status: 'SUSPENDED' },
  highRisk: { riskLevel: 'HIGH' },
  neverLoggedIn: { loginActivity: 'never' },
  noPhone: { hasPhone: 'false' },
  bangladesh: { country: 'Bangladesh' },
  recent: { createdFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  suspicious: { loginActivity: '7d', riskLevel: 'HIGH' },
}

function readParams(searchParams: ReturnType<typeof useSearchParams>) {
  const current: Filters = {}
  searchParams.forEach((value, key) => {
    current[key] = value
  })
  return current
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  return params.toString()
}

function chipLabel(key: string, value: string) {
  const names: Record<string, string> = {
    q: 'Search',
    status: 'Status',
    country: 'Country',
    emailVerified: 'Email verified',
    phoneVerified: 'Phone verified',
    hasEmail: 'Email',
    hasPhone: 'Phone',
    loginActivity: 'Login activity',
    riskLevel: 'Risk',
    sortBy: 'Sort',
    pageSize: 'Page size',
  }
  return `${names[key] ?? key}: ${value}`
}

export default function EndUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = useMemo(() => readParams(searchParams), [searchParams])
  const [data, setData] = useState<ListState>({ items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedUser, setSelectedUser] = useState<EndUserDetail | null>(null)
  const [presence, setPresence] = useState<EndUserPresence | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [savedSegment, setSavedSegment] = useState('')
  const { admin } = useAuth()

  const hasPermission = (permission: string) => {
    const perms = admin?.permissions ?? []
    return perms.includes(permission) || (admin?.roles ?? []).some((role) => ['admin', 'super_admin'].includes(role.toLowerCase()))
  }

  const currentPage = Number(filters.page || '1')
  const pageSize = Number(filters.pageSize || '50')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await endUsersApi.listEndUsers({
        q: filters.q,
        status: filters.status,
        country: filters.country,
        state: filters.state,
        city: filters.city,
        timezone: filters.timezone,
        registrationSource: filters.registrationSource,
        emailVerified: filters.emailVerified as any,
        phoneVerified: filters.phoneVerified as any,
        hasEmail: filters.hasEmail as any,
        hasPhone: filters.hasPhone as any,
        loginActivity: filters.loginActivity as any,
        riskLevel: filters.riskLevel as any,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        lastLoginFrom: filters.lastLoginFrom,
        lastLoginTo: filters.lastLoginTo,
        lastPasswordChangedFrom: filters.lastPasswordChangedFrom,
        lastPasswordChangedTo: filters.lastPasswordChangedTo,
        externalRefId: filters.externalRefId,
        email: filters.email,
        phone: filters.phone,
        username: filters.username,
        userId: filters.userId,
        sortBy: filters.sortBy,
        sortOrder: (filters.sortOrder as 'asc' | 'desc') || 'desc',
        page: currentPage,
        pageSize,
      })
      const pageData = response.data ?? {}
      setData({
        items: pageData.items ?? [],
        total: pageData.total ?? 0,
        page: pageData.page ?? currentPage,
        pageSize: pageData.pageSize ?? pageSize,
        totalPages: pageData.totalPages ?? 1,
      })
    } catch (err: any) {
      console.error('Failed to load end users:', err)
      if (err instanceof ApiError && err.status === 403) {
        setError('You do not have permission to view end users.')
      } else {
        setError(err?.message || 'Unable to load end users.')
      }
      setData({ items: [], total: 0, page: currentPage, pageSize, totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [searchParams.toString()])

  const updateFilters = (patch: Filters) => {
    const next = new URLSearchParams(searchParams.toString())
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    next.delete('page')
    router.replace(`/end-users?${next.toString()}`)
  }

  const clearFilters = () => router.replace('/end-users')

  const openUser = async (user: EndUser) => {
    setDetailLoading(true)
    setSelectedUser(null)
    setPresence(null)
    try {
      const [detailResponse, presenceResponse] = await Promise.all([
        endUsersApi.getEndUser(user.id),
        endUsersApi.getPresence(user.id).catch(() => null),
      ])
      if (detailResponse.success) setSelectedUser(detailResponse.user)
      if (presenceResponse?.success) setPresence(presenceResponse.presence)
    } catch (err) {
      toast.error('Failed to load user details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const changeStatus = async (user: EndUser, status: EndUser['status']) => {
    setActionLoading(true)
    try {
      const res = await endUsersApi.updateStatus(user.id, status)
      if (res.success) {
        toast.success(`User status updated to ${status}.`)
        load()
        if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, status })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user status.')
    } finally {
      setActionLoading(false)
    }
  }

  const activeChips = Object.entries(filters).filter(([key, value]) => !['page', 'pageSize'].includes(key) && value)

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">End Users</h4>
          <p className="text-muted mb-0 fs-13">Server-side search, filters, sorting, and pagination for platform users.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowAdvanced(true)}>
            <IconifyIcon icon="solar:filters-bold-duotone" className="fs-16 me-1" />
            Advanced Filters
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={() => load()} disabled={loading}>
            <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16 me-1' : 'fs-16 me-1'} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-2">
        <Card.Body className="p-3 p-lg-3">
          <div className="d-grid gap-2">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div style={{ flex: '1 1 420px', minWidth: 360 }}>
                <Form.Control
                  size="sm"
                  type="search"
                  className="ps-4"
                  placeholder="Global search: email, phone, username, name, user ID, external reference..."
                  value={filters.q || ''}
                  onChange={(e) => updateFilters({ q: e.target.value })}
                />
              </div>
              <div style={{ flex: '0 0 170px', minWidth: 160 }}>
                <Form.Select size="sm" value={filters.status || ''} onChange={(e) => updateFilters({ status: e.target.value })}>
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_VERIFICATION">Pending verification</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DELETED">Deleted</option>
                </Form.Select>
              </div>
              <div style={{ flex: '0 0 170px', minWidth: 160 }}>
                <Form.Control size="sm" placeholder="Country" value={filters.country || ''} onChange={(e) => updateFilters({ country: e.target.value })} />
              </div>
              <div style={{ flex: '0 0 180px', minWidth: 170 }}>
                <Form.Control size="sm" type="date" value={filters.createdFrom || ''} onChange={(e) => updateFilters({ createdFrom: e.target.value })} />
              </div>
              <div className="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
                <Button variant="outline-danger" size="sm" onClick={clearFilters}>
                  <IconifyIcon icon="solar:close-circle-bold-duotone" className="fs-16 me-1" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <div style={{ flex: '0 0 210px', minWidth: 180 }}>
                <Form.Select size="sm" value={filters.sortBy && filters.sortOrder ? `${filters.sortBy}:${filters.sortOrder}` : 'createdAt:desc'} onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split(':')
                  updateFilters({ sortBy, sortOrder })
                }}>
                  {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Form.Select>
              </div>
              <div style={{ flex: '0 0 140px', minWidth: 130 }}>
                <Form.Select size="sm" value={String(pageSize)} onChange={(e) => updateFilters({ pageSize: e.target.value, page: '1' })}>
                  {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} per page</option>)}
                </Form.Select>
              </div>
              <div className="ms-auto d-flex align-items-center gap-2 flex-shrink-0">
                <Badge bg="soft-secondary" className="text-secondary px-3 py-2 d-inline-flex align-items-center gap-1">
                  <IconifyIcon icon="solar:users-group-rounded-bold-duotone" className="fs-14" />
                  {data.total.toLocaleString()} users
                </Badge>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="d-flex flex-wrap gap-2">
                {activeChips.map(([key, value]) => (
                  <Badge key={key} bg="soft-primary" className="text-primary">{chipLabel(key, value)}</Badge>
                ))}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {error ? (
        <ApiErrorState message={error} onRetry={load} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : data.items.length === 0 ? (
              <EmptyState message="No end users match the current filters." icon="solar:users-group-rounded-bold-duotone" />
            ) : (
              <>
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4">User</th>
                      <th>Phone</th>
                      <th>Country</th>
                      <th>Status</th>
                      <th>Verification</th>
                      <th>Source</th>
                      <th>Risk</th>
                      <th>Last Login</th>
                      <th>Created</th>
                      <th className="text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-13" style={{ width: 36, height: 36 }}>
                              {(user.displayName || user.username || user.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold text-dark fs-14">{user.displayName || user.username || 'Unnamed'}</span>
                              <span className="text-muted fs-11">{user.email}</span>
                              <span className="text-muted fs-11">{user.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary fs-13">{user.phone || '—'}</td>
                        <td className="text-secondary fs-13">{user.country || '—'}</td>
                        <td><StatusBadge status={user.status} /></td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            <Badge bg={user.emailVerifiedAt ? 'soft-success' : 'soft-secondary'} className={user.emailVerifiedAt ? 'text-success' : 'text-secondary'}>Email {user.emailVerifiedAt ? '✓' : '—'}</Badge>
                            <Badge bg={user.phoneVerifiedAt ? 'soft-success' : 'soft-secondary'} className={user.phoneVerifiedAt ? 'text-success' : 'text-secondary'}>Phone {user.phoneVerifiedAt ? '✓' : '—'}</Badge>
                          </div>
                        </td>
                        <td className="text-secondary fs-13">{user.registrationSource || '—'}</td>
                        <td><Badge bg={user.riskScore && user.riskScore >= 80 ? 'danger' : user.riskScore && user.riskScore >= 50 ? 'warning' : 'success'}>{user.riskScore ?? 0}</Badge></td>
                        <td className="text-secondary fs-13">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                        <td className="text-secondary fs-13">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="text-end px-4">
                          <div className="d-flex justify-content-end gap-1 flex-wrap">
                            {hasPermission('end_users.view_detail') && (
                              <Button variant="link" size="sm" className="p-0 d-inline-flex align-items-center gap-1" onClick={() => openUser(user)}>
                                <IconifyIcon icon="solar:eye-bold-duotone" className="fs-14" />
                                View
                              </Button>
                            )}
                            {hasPermission('end_users.update_status') && (
                              <Button variant="link" size="sm" className="p-0 text-danger d-inline-flex align-items-center gap-1" onClick={() => changeStatus(user, 'SUSPENDED')} disabled={actionLoading}>
                                <IconifyIcon icon="solar:pause-circle-bold-duotone" className="fs-14" />
                                Suspend
                              </Button>
                            )}
                            {hasPermission('end_users.update_status') && (
                              <Button variant="link" size="sm" className="p-0 text-success d-inline-flex align-items-center gap-1" onClick={() => changeStatus(user, 'ACTIVE')} disabled={actionLoading}>
                                <IconifyIcon icon="solar:check-circle-bold-duotone" className="fs-14" />
                                Unsuspend
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top">
                  <div className="text-muted fs-13">Page {data.page} of {data.totalPages}</div>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" disabled={data.page <= 1} onClick={() => updateFilters({ page: String(data.page - 1) })}>Previous</Button>
                    <Button variant="outline-secondary" size="sm" disabled={data.page >= data.totalPages} onClick={() => updateFilters({ page: String(data.page + 1) })}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      <Offcanvas show={showAdvanced} onHide={() => setShowAdvanced(false)} placement="end" style={{ width: 540 }}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold">Advanced Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="d-grid gap-3">
            <section>
              <div className="fw-semibold mb-2">Identity</div>
              <Row className="g-2">
                {['userId', 'username', 'email', 'phone', 'externalRefId'].map((field) => (
                  <Col md={6} key={field}><Form.Control placeholder={field} value={filters[field] || ''} onChange={(e) => updateFilters({ [field]: e.target.value })} /></Col>
                ))}
              </Row>
            </section>
            <section>
              <div className="fw-semibold mb-2">Status and Contact</div>
              <Row className="g-2">
                <Col md={6}><Form.Select value={filters.hasEmail || ''} onChange={(e) => updateFilters({ hasEmail: e.target.value })}><option value="">Email presence</option><option value="true">Has email</option><option value="false">Missing email</option></Form.Select></Col>
                <Col md={6}><Form.Select value={filters.hasPhone || ''} onChange={(e) => updateFilters({ hasPhone: e.target.value })}><option value="">Phone presence</option><option value="true">Has phone</option><option value="false">Missing phone</option></Form.Select></Col>
                <Col md={6}><Form.Select value={filters.emailVerified || ''} onChange={(e) => updateFilters({ emailVerified: e.target.value })}><option value="">Email verification</option><option value="true">Verified</option><option value="false">Not verified</option></Form.Select></Col>
                <Col md={6}><Form.Select value={filters.phoneVerified || ''} onChange={(e) => updateFilters({ phoneVerified: e.target.value })}><option value="">Phone verification</option><option value="true">Verified</option><option value="false">Not verified</option></Form.Select></Col>
              </Row>
            </section>
            <section>
              <div className="fw-semibold mb-2">Location and Activity</div>
              <Row className="g-2">
                {['country', 'state', 'city', 'timezone', 'registrationSource'].map((field) => (
                  <Col md={6} key={field}><Form.Control placeholder={field} value={filters[field] || ''} onChange={(e) => updateFilters({ [field]: e.target.value })} /></Col>
                ))}
                <Col md={6}><Form.Select value={filters.loginActivity || ''} onChange={(e) => updateFilters({ loginActivity: e.target.value })}><option value="">Login activity</option><option value="never">Never logged in</option><option value="today">Logged in today</option><option value="7d">Last 7 days</option><option value="30d">Inactive for 30 days</option><option value="90d">Inactive for 90 days</option><option value="180d">Inactive for 180 days</option></Form.Select></Col>
                <Col md={6}><Form.Select value={filters.riskLevel || ''} onChange={(e) => updateFilters({ riskLevel: e.target.value })}><option value="">Risk level</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></Form.Select></Col>
              </Row>
            </section>
            <section>
              <div className="fw-semibold mb-2">Date Ranges</div>
              <Row className="g-2">
                {['createdFrom', 'createdTo', 'lastLoginFrom', 'lastLoginTo', 'lastPasswordChangedFrom', 'lastPasswordChangedTo'].map((field) => (
                  <Col md={6} key={field}><Form.Control type="date" value={filters[field] || ''} onChange={(e) => updateFilters({ [field]: e.target.value })} /></Col>
                ))}
              </Row>
            </section>
            <section>
              <div className="fw-semibold mb-2">Saved Segments</div>
              <Form.Select value={savedSegment} onChange={(e) => {
                setSavedSegment(e.target.value)
                if (e.target.value && SAVED_SEGMENTS[e.target.value]) {
                  updateFilters(SAVED_SEGMENTS[e.target.value])
                }
              }}>
                <option value="">Choose a saved segment</option>
                {Object.keys(SAVED_SEGMENTS).map((key) => <option key={key} value={key}>{key}</option>)}
              </Form.Select>
            </section>
            <div className="d-flex gap-2">
              <Button variant="outline-danger" onClick={clearFilters}>Clear all filters</Button>
              <Button variant="primary" onClick={() => setShowAdvanced(false)}>Done</Button>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={Boolean(selectedUser)} onHide={() => setSelectedUser(null)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : selectedUser ? (
            <Row className="g-4">
              <Col md={4}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body>
                    <div className="fw-semibold mb-2">Profile Summary</div>
                    <div className="small text-muted">{selectedUser.displayName || selectedUser.username || selectedUser.email}</div>
                    <div className="small">{selectedUser.email}</div>
                    <div className="small">{selectedUser.phone || 'No phone'}</div>
                    <div className="small">{selectedUser.status}</div>
                    <div className="small">Country: {selectedUser.country || '—'}</div>
                    <div className="small">Risk: {selectedUser.riskScore ?? 0}</div>
                    <div className="small">Login IP: {selectedUser.lastLoginIp || '—'}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={8}>
                <div className="d-grid gap-3">
                  <Card><Card.Body><div className="fw-semibold mb-2">Verification</div><div>Email: {selectedUser.emailVerifiedAt ? 'Verified' : 'Not verified'}</div><div>Phone: {selectedUser.phoneVerifiedAt ? 'Verified' : 'Not verified'}</div></Card.Body></Card>
                  <Card><Card.Body><div className="fw-semibold mb-2">Sessions / Activity</div><div>Recent sessions: {selectedUser.recentSessions?.length ?? 0}</div><div>Recent audit logs: {selectedUser.recentAuditLogs?.length ?? 0}</div><div>Recent security events: {selectedUser.recentSecurityEvents?.length ?? 0}</div></Card.Body></Card>
                  <Card><Card.Body><div className="fw-semibold mb-2">Sessions</div><div>Active sessions: {presence?.activeSessions.active ?? 0}</div><div>Apps online: {(presence?.appsOnline ?? []).map((a) => a.name).join(', ') || 'None'}</div></Card.Body></Card>
                </div>
              </Col>
            </Row>
          ) : null}
        </Modal.Body>
      </Modal>
    </div>
  )
}
