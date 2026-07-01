'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Form, Pagination, Badge, Button } from 'react-bootstrap'
import { useSearchParams, useRouter } from 'next/navigation'

const SecurityEventsList = () => {
  const { accessToken } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlUserId = searchParams.get('userId'

  const [events, setEvents] = useState<any[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false
  
  const [page, setPage] = useState(1
  const [severityFilter, setSeverityFilter] = useState(''
  const [userIdFilter, setUserIdFilter] = useState(''
  const [totalPages, setTotalPages] = useState(1

  useEffect(() => {
    if (urlUserId) {
      setUserIdFilter(urlUserId
    }
  }, [urlUserId]

  const fetchEvents = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true
      const query = new URLSearchParams()
      query.set('page', page.toString()
      if (severityFilter) query.set('severity', severityFilter
      if (userIdFilter) query.set('userId', userIdFilter

      const res: any = await apiClient(accessToken).get(`/admin/security-events?${query.toString()}`
      
      setEvents(res.events || res.data || []
      setTotalPages(res.pagination?.totalPages || 1
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
  }, [accessToken, page, severityFilter, userIdFilter]

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents]

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'secondary'
    }
  }

  return ()
    <Card>
      <CardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <CardTitle as="h4" className="mb-0">Security Events</CardTitle>
          {urlUserId && ()
            <div className="mt-1">
              <Badge bg="info" className="me-2 px-2 py-1 fs-12">
                Filtered by user: {urlUserId}
              </Badge>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 text-decoration-none text-danger align-baseline fs-12"
                onClick={() => {
                  setUserIdFilter('');
                  router.push('/security-events');
                }}
              >
                Clear Filter
              </Button>
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <Form.Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All Severities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
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
        ) : events.length === 0 ? ()
          <div className="text-center py-4 text-muted">
            No security events found.
          </div>
        ) : ()
          <>
            <Table responsive hover className="mb-3">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt, idx) => ()
                  <tr key={evt.id || idx}>
                    <td>{new Date(evt.createdAt).toLocaleString()}</td>
                    <td>{evt.type}</td>
                    <td>
                      <span className={`badge bg-${getSeverityBadge(evt.severity)}`}>
                        {evt.severity}
                      </span>
                    </td>
                    <td>{evt.user ? evt.user.email || evt.user.username : '-'}</td>
                    <td>{evt.ipAddress || '-'}</td>
                    <td>
                      <span className={`badge bg-${evt.resolved ? 'success' : 'danger'}-subtle text-${evt.resolved ? 'success' : 'danger'}`}>
                        {evt.resolved ? 'Resolved' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            <div className="d-flex justify-content-end">
              <Pagination>
                <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                <Pagination.Item active>{page}</Pagination.Item>
                <Pagination.Next onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} />
              </Pagination>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  
}

export default SecurityEventsList
