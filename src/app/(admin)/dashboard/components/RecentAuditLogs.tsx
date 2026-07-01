'use client'
import { Card, CardBody, CardTitle, Table, Spinner, CardHeader } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'

const RecentAuditLogs = () => {
  const { accessToken } = useAuth()
  const [logs, setLogs] = useState<any[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        if (!accessToken) return;
        const res: any = await apiClient(accessToken).get('/admin/audit-logs?limit=5'
        
        const data = res
        setLogs(data.logs || []
      } catch (err) {
        setError(true
      } finally {
        setLoading(false
      }
    }
    fetchLogs()
  }, [accessToken]

  return ()
    <Card>
      <CardHeader>
        <CardTitle as="h4">Recent Audit Logs</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? ()
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? ()
          <div className="alert alert-warning" role="alert">
            Failed to load audit logs. TODO: Implement /admin/audit-logs endpoint.
          </div>
        ) : logs.length === 0 ? ()
          <div className="text-center py-4 text-muted">
            No recent audit logs found.
          </div>
        ) : ()
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => ()
                <tr key={idx}>
                  <td>{log.action}</td>
                  <td>{log.actor}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  
}

export default RecentAuditLogs

