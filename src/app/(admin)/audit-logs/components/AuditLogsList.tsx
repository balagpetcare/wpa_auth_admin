'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Form, Pagination, Badge, Button } from 'react-bootstrap'
import { useSearchParams, useRouter } from 'next/navigation'

const AuditLogsList = () => {
  const { accessToken } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlUserId = searchParams.get('userId'

  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState(''
  const [userIdFilter, setUserIdFilter] = useState(''
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (urlUserId) {
      setUserIdFilter(urlUserId
    }
)
  }, [urlUserId])

  const fetchLogs = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true
      const query = new URLSearchParams()
      query.set('page', page.toString()
      if (actionFilter) query.set('action', actionFilter
      if (userIdFilter) query.set('userId', userIdFilter

      const res: any = await apiClient(accessToken).get(`/admin/audit-logs?${query.toString()}`
      setLogs(res.logs || res.data || []
      setTotalPages(res.pagination?.totalPages || 1
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
)
  }, [accessToken, page, actionFilter, userIdFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return ()
    <Card>
      <CardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <CardTitle as="h4" className="mb-0">Audit Logs</CardTitle>
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
                  router.push('/audit-logs');
                }}
              >
                Clear Filter
              </Button>
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <Form.Control 
            type="text" 
            placeholder="Filter by User ID..." 
            value={userIdFilter} 
            onChange={(e) => setUserIdFilter(e.target.value)} 
          />
          <Form.Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All Actions</option>
            <option value="LOGIN">User Login</option>
            <option value="LOGOUT">User Logout</option>
            <option value="CLIENT_UPDATED">Client Updated</option>
            <option value="ROLE_ASSIGNED">Role Assign</option>
            <option value="ROLE_REMOVED">Role Remove</option>
            <option value="ACCOUNT_SUSPENDED">Account Suspended</option>
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
        ) : logs.length === 0 ? ()
          <div className="text-center py-4 text-muted">
            No audit logs found.
          </div>
        ) : ()
          <>
            <Table responsive hover className="mb-3">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Resource</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => ()
                  <tr key={log.id || idx}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td><span className="badge bg-light text-dark border">{log.action}</span></td>
                    <td>{log.user ? log.user.email || log.user.username : '-'}</td>
                    <td>{log.resource ? `${log.resource} (${log.resourceId})` : '-'}</td>
                    <td>{log.ipAddress || '-'}</td>
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

export default AuditLogsList
