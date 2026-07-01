'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { Badge, Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'

type AuditLog = {
  id: string
  action?: string
  actor?: string
  resource?: string
  timestamp?: string
  status?: 'success' | 'failure'
}

export default function RecentAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'ready' | 'empty' | 'unavailable'>('ready')

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      try {
        const response = await apiClient(token).get<any>('/admin/audit-logs')
        const list = Array.isArray(response?.logs) ? response.logs.slice(0, 5) : []
        setLogs(list)
        setStatus(list.length ? 'ready' : 'empty')
      } catch {
        setStatus('unavailable')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const statusVariant = (value?: string) => (value === 'failure' ? 'danger' : 'success')

  return (
    <Card className="border-0 shadow-sm h-100">
      <CardHeader className="bg-transparent border-0 d-flex align-items-center justify-content-between p-4 pb-0">
        <div>
          <CardTitle as="h4" className="mb-1">
            Recent audit logs
          </CardTitle>
          <p className="text-muted mb-0">Administrative actions captured by the auth system.</p>
        </div>
        <span className="fs-3 text-primary">📋</span>
      </CardHeader>
      <CardBody className="p-4">
        {loading && (
          <div className="py-5 text-center text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading audit logs...
          </div>
        )}
        {!loading && status === 'unavailable' && (
          <div className="alert alert-soft-warning mb-0">
            Audit logs endpoint is unavailable. Showing no live data.
          </div>
        )}
        {!loading && status === 'empty' && (
          <div className="alert alert-soft-secondary mb-0">No recent audit logs were returned by the API.</div>
        )}
        {!loading && status === 'ready' && (
          <div className="table-responsive">
            <table className="table table-centered table-hover mb-0">
              <thead className="bg-light bg-opacity-50">
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Status</th>
                  <th className="text-end">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="fw-semibold text-dark">{log.action || 'Unknown action'}</div>
                      <div className="text-muted small">{log.resource || 'No resource specified'}</div>
                    </td>
                    <td className="text-muted">{log.actor || 'System'}</td>
                    <td>
                      <Badge bg={statusVariant(log.status)} className="text-uppercase">
                        {log.status || 'unknown'}
                      </Badge>
                    </td>
                    <td className="text-end text-muted small">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unavailable'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
