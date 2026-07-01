'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { Card, CardBody, CardHeader, Table, Spinner, Form, Button, Row, Col, Badge, Collapse } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { UserActionsDrawer } from './UserActionsDrawer'

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay
    return () => clearTimeout(handler
  }, [value, delay]
  return debouncedValue
}

const UsersList = () => {
  const { accessToken, user: currentAdmin } = useAuth()
  const [users, setUsers] = useState<any[]>([]
  const [summary, setSummary] = useState<any>(null)
  
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false
  
  // Filters
  const [search, setSearch] = useState(''
  const debouncedSearch = useDebounce(search, 400
  const [statusFilter, setStatusFilter] = useState('ALL'
  const [showAdvanced, setShowAdvanced] = useState(false
  const [emailVerified, setEmailVerified] = useState('all'
  const [hasOAuth, setHasOAuth] = useState('all'

  // Pagination
  const [cursorStack, setCursorStack] = useState<string[]>([]
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false

  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<any>(null)

  const fetchSummary = useCallback(async () => {
    if (!accessToken) return
    try {
      const res: any = await apiClient(accessToken).get('/admin/users/summary'
      setSummary(res.summary
    } catch (err) {
      console.warn('Failed to fetch user summary', err
    }
  }, [accessToken]

  const fetchUsers = useCallback(async (cursor?: string) => {
    if (!accessToken) return
    try {
      setLoading(true
      const query = new URLSearchParams()
      if (debouncedSearch) query.set('q', debouncedSearch
      if (statusFilter !== 'ALL') query.set('status', statusFilter
      if (emailVerified !== 'all') query.set('emailVerified', emailVerified
      if (hasOAuth !== 'all') query.set('hasOAuth', hasOAuth
      if (cursor) query.set('cursor', cursor
      
      const res: any = await apiClient(accessToken).get(`/admin/users?${query.toString()}`
      setUsers(res.data?.items || []
      setNextCursor(res.data?.pagination?.nextCursor || null
      setHasNextPage(res.data?.pagination?.hasNextPage || false
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
  }, [accessToken, debouncedSearch, statusFilter, emailVerified, hasOAuth]

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary]

  useEffect(() => {
    setCursorStack([]
    setCurrentCursor(undefined
    fetchUsers(undefined
  }, [debouncedSearch, statusFilter, emailVerified, hasOAuth, fetchUsers]

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorStack([...cursorStack, currentCursor || '']
      setCurrentCursor(nextCursor
      fetchUsers(nextCursor
    }
  }

  const handlePrevPage = () => {
    if (cursorStack.length > 0) {
      const newStack = [...cursorStack]
      const prevCursor = newStack.pop()
      setCursorStack(newStack
      setCurrentCursor(prevCursor === '' ? undefined : prevCursor
      fetchUsers(prevCursor === '' ? undefined : prevCursor
    }
  }

  const handleOpenActions = (user: any) => {
    setSelectedUserForDrawer(user
    setShowDrawer(true
  }

  return ()
    <>
      {summary && ()
        <Row className="mb-4">
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <CardBody>
                <p className="text-muted mb-1 fs-13">Total Users (Est)</p>
                <h3 className="mb-0 fw-bold">{summary.totalUsersEstimate}</h3>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <CardBody>
                <p className="text-muted mb-1 fs-13">Active Users</p>
                <h3 className="mb-0 fw-bold text-success">{summary.activeUsers}</h3>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <CardBody>
                <p className="text-muted mb-1 fs-13">Suspended / Disabled</p>
                <h3 className="mb-0 fw-bold text-danger">{summary.suspendedUsers + summary.disabledUsers}</h3>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <CardBody>
                <p className="text-muted mb-1 fs-13">Joined (Last 7d)</p>
                <h3 className="mb-0 fw-bold text-primary">{summary.recentlyJoined7d}</h3>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      <Card className="shadow-sm border-0">
        <CardHeader className="bg-white border-bottom py-3">
          <Row className="align-items-center">
            <Col md={4} className="mb-2 mb-md-0">
              <Form.Control 
                type="text" 
                placeholder="Search by username, email, name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
            <Col md={3} className="mb-2 mb-md-0">
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DELETED">Disabled/Deleted</option>
                <option value="PENDING_VERIFICATION">Pending</option>
              </Form.Select>
            </Col>
            <Col md={5} className="text-md-end">
              <Button variant="light" className="me-2" onClick={() => setShowAdvanced(!showAdvanced)}>
                <IconifyIcon icon="bx:filter-alt" className="me-1 align-middle" />
                Advanced Filters
              </Button>
            </Col>
          </Row>
          
          <Collapse in={showAdvanced}>
            <div className="mt-3 pt-3 border-top">
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fs-13 text-muted">Email Verified</Form.Label>
                    <Form.Select value={emailVerified} onChange={(e) => setEmailVerified(e.target.value)} size="sm">
                      <option value="all">Any</option>
                      <option value="true">Verified</option>
                      <option value="false">Unverified</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fs-13 text-muted">OAuth Connected</Form.Label>
                    <Form.Select value={hasOAuth} onChange={(e) => setHasOAuth(e.target.value)} size="sm">
                      <option value="all">Any</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Collapse>
        </CardHeader>
        <CardBody className="p-0">
          {error ? ()
            <div className="p-5 text-center text-danger">Failed to load users. Please try again.</div>
          ) : loading && users.length === 0 ? ()
            <div className="p-5 text-center"><Spinner animation="border" /></div>
          ) : users.length === 0 ? ()
            <div className="p-5 text-center text-muted">No users found matching your filters.</div>
          ) : ()
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="border-bottom-0">User</th>
                    <th className="border-bottom-0">Status</th>
                    <th className="border-bottom-0">Roles</th>
                    <th className="border-bottom-0">Verifications</th>
                    <th className="border-bottom-0">Last Login</th>
                    <th className="border-bottom-0 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => ()
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm me-3">
                            {user.avatarUrl ? ()
                              <img src={user.avatarUrl} alt="avatar" className="img-fluid rounded-circle" />
                            ) : ()
                              <span className="avatar-title bg-primary-subtle text-primary rounded-circle fw-semibold">
                                {(user.displayName || user.username || user.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <h5 className="fs-14 mb-1">{user.displayName || user.username || '-'}</h5>
                            <p className="text-muted mb-0 fs-13">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'warning' : user.status === 'DELETED' ? 'danger' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td>
                        {user.roles?.length ? ()
                          user.roles.map((r: any) => <Badge bg="info" className="me-1" key={r.id}>{r.name}</Badge>
                        ) : ()
                          <span className="text-muted fs-12">-</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <span title={user.emailVerifiedAt ? 'Email Verified' : 'Email Unverified'}>
                            <IconifyIcon icon={user.emailVerifiedAt ? 'bx:check-shield' : 'bx:shield-x'} className={user.emailVerifiedAt ? 'text-success' : 'text-muted'} />
                          </span>
                          {user.oauthProviders?.length > 0 && ()
                            <span title={`OAuth: ${user.oauthProviders.join(', ')}`}>
                              <IconifyIcon icon="bx:link-alt" className="text-primary" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="fs-13">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="light"
                          size="sm"
                          className="d-inline-flex align-items-center gap-1"
                          onClick={() => handleOpenActions(user)}
                        >
                          <span>Actions</span>
                          <IconifyIcon icon="bx:chevron-down" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
        <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center py-3">
          <span className="text-muted fs-13">
            {loading ? 'Loading...' : `Showing page ${cursorStack.length + 1}`}
          </span>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={handlePrevPage} disabled={cursorStack.length === 0 || loading}>
              Previous
            </Button>
            <Button variant="outline-primary" size="sm" onClick={handleNextPage} disabled={!hasNextPage || loading}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Reusable Action Drawer */}
      <UserActionsDrawer 
        show={showDrawer}
        onHide={() => {
          setShowDrawer(false
          setSelectedUserForDrawer(null
        }}
        user={selectedUserForDrawer}
        currentAdmin={currentAdmin}
        onSuccess={() => {
          fetchUsers(currentCursor
          fetchSummary()
        }}
      />
    </>
  
}

export default UsersList
