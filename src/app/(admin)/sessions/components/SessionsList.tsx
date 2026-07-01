'use client'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Form, Dropdown, Button, Badge } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useSearchParams, useRouter } from 'next/navigation'

type SessionData = {
  id: string
  userId: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  country?: string
  status: string
  createdAt: string
  lastActiveAt: string
  expiresAt: string
  user?: { email: string, username: string }
}

const SessionsList = () => {
  const { accessToken } = useAuth()
  const { showNotification } = useNotificationContext()
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlUserId = searchParams.get('userId'

  const [sessions, setSessions] = useState<SessionData[]>([]
  const [loading, setLoading] = useState(false
  const [error, setError] = useState(false
  const [search, setSearch] = useState(''
  const [statusFilter, setStatusFilter] = useState('all'

  const fetchSessions = useCallback(async () => {
    if (!accessToken) return
    setLoading(true
    setError(false
    try {
      const query = new URLSearchParams()
      if (search) query.set('search', search
      if (statusFilter !== 'all') query.set('status', statusFilter
      if (urlUserId) query.set('userId', urlUserId
      
      const res: any = await apiClient(accessToken).get(`/admin/sessions?${query.toString()}`
      setSessions(res.data || res.sessions || []
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
  }, [accessToken, search, statusFilter, urlUserId]

  const handleRevoke = async (id: string) => {
    if (!accessToken) return
    try {
      await apiClient(accessToken).delete(`/admin/sessions/${id}`
      showNotification({ message: 'Session revoked', variant: 'success' }
      fetchSessions()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to revoke session', variant: 'danger' }
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions]

  return ()
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <CardTitle as="h4" className="mb-0">Login Sessions</CardTitle>
          {urlUserId && ()
            <div className="mt-1">
              <Badge bg="info" className="me-2 px-2 py-1 fs-12">
                Filtered by user: {sessions[0]?.user?.email || urlUserId}
              </Badge>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 text-decoration-none text-danger align-baseline fs-12"
                onClick={() => router.push('/sessions')}
              >
                Clear Filter
              </Button>
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <Form.Control 
            type="text" 
            placeholder="Search sessions..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </Form.Select>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? ()
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? ()
          <div className="alert alert-warning" role="alert">
            Failed to load data.
          </div>
        ) : sessions.length === 0 ? ()
          <div className="text-center py-4 text-muted">
            No login sessions found.
          </div>
        ) : ()
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>User / Email</th>
                <th>IP Address</th>
                <th>Device</th>
                <th>Location</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Last Seen At</th>
                <th>Expires At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => ()
                <tr key={session.id}>
                  <td>
                    {session.user?.username || session.userId} <br />
                    <small className="text-muted">{session.user?.email || session.userEmail}</small>
                  </td>
                  <td>{session.ipAddress || '-'}</td>
                  <td>{session.userAgent || '-'}</td>
                  <td>{session.country || '-'}</td>
                  <td>
                    <span className={`badge bg-${session.status === 'active' ? 'success' : 'secondary'}`}>
                      {session.status}
                    </span>
                  </td>
                  <td>{new Date(session.createdAt).toLocaleString()}</td>
                  <td>{new Date(session.lastActiveAt).toLocaleString()}</td>
                  <td>{new Date(session.expiresAt).toLocaleString()}</td>
                  <td>
                    <Dropdown drop="down">
                      <Dropdown.Toggle variant="light" size="sm">
                        <IconifyIcon icon="bx:dots-vertical-rounded" />
                      </Dropdown.Toggle>
                      <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
                        <Dropdown.Item onClick={() => showNotification({ message: 'View Details (Not implemented)', variant: 'info' })}>
                          View Details
                        </Dropdown.Item>
                        {session.status !== 'revoked' && ()
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item className="text-danger" onClick={() => handleRevoke(session.id)}>
                              Revoke Session
                            </Dropdown.Item>
                          </>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  
}

export default SessionsList
