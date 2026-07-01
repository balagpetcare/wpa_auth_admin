'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/apiClient'
import { Badge, Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'

type SecurityLog = { id: string; type?: string; user?: string; severity?: string; timestamp?: string }

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<'ready' | 'empty' | 'unavailable'>('ready')

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await apiClient(token).get<any>('/security-logs')
        const list = Array.isArray(response?.items) ? response.items : Array.isArray(response?.logs) ? response.logs : []
        setLogs(list)
        setState(list.length ? 'ready' : 'empty')
      } catch {
        setState('unavailable')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      <div className="page-title-box">
        <div>
          <h1 className="mb-1">Security Logs</h1>
          <p className="text-muted mb-0">Authentication and access events from the admin perimeter.</p>
        </div>
        <Link href="/dashboard" className="btn btn-light">Back to dashboard</Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-transparent border-0 p-4 pb-0">
          <CardTitle as="h4" className="mb-0">Security activity</CardTitle>
        </CardHeader>
        <CardBody className="p-4">
          {loading && <div className="py-5 text-center text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading security logs...</div>}
          {!loading && state === 'unavailable' && <div className="alert alert-soft-warning mb-0">Security logs endpoint is unavailable.</div>}
          {!loading && state === 'empty' && <div className="alert alert-soft-secondary mb-0">No security logs were returned by the API.</div>}
          {!loading && state === 'ready' && (
            <div className="table-responsive">
              <table className="table table-centered table-hover mb-0">
                <thead className="bg-light bg-opacity-50">
                  <tr><th>Type</th><th>User</th><th>Severity</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="fw-semibold text-dark">{log.type || 'Unknown event'}</td>
                      <td className="text-muted">{log.user || 'System'}</td>
                      <td><Badge bg={log.severity === 'high' ? 'danger' : log.severity === 'medium' ? 'warning' : 'info'}>{log.severity || 'unknown'}</Badge></td>
                      <td className="text-muted">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unavailable'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  )
}
