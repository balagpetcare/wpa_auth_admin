'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/apiClient'
import { Badge, Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'

type Session = { id: string; user?: string; ip?: string; lastSeen?: string; status?: string }

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<'ready' | 'empty' | 'unavailable'>('ready')

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await apiClient(token).get<any>('/sessions')
        const list = Array.isArray(response?.items) ? response.items : Array.isArray(response?.sessions) ? response.sessions : []
        setSessions(list)
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
          <h1 className="mb-1">Sessions</h1>
          <p className="text-muted mb-0">Active user sessions and last activity.</p>
        </div>
        <Link href="/dashboard" className="btn btn-light">Back to dashboard</Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-transparent border-0 p-4 pb-0">
          <CardTitle as="h4" className="mb-0">Session monitor</CardTitle>
        </CardHeader>
        <CardBody className="p-4">
          {loading && <div className="py-5 text-center text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading sessions...</div>}
          {!loading && state === 'unavailable' && <div className="alert alert-soft-warning mb-0">Sessions endpoint is unavailable.</div>}
          {!loading && state === 'empty' && <div className="alert alert-soft-secondary mb-0">No active sessions were returned by the API.</div>}
          {!loading && state === 'ready' && (
            <div className="table-responsive">
              <table className="table table-centered table-hover mb-0">
                <thead className="bg-light bg-opacity-50">
                  <tr><th>User</th><th>IP</th><th>Last seen</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="fw-semibold text-dark">{session.user || 'Unknown user'}</td>
                      <td className="text-muted">{session.ip || 'Unavailable'}</td>
                      <td className="text-muted">{session.lastSeen ? new Date(session.lastSeen).toLocaleString() : 'Unavailable'}</td>
                      <td><Badge bg={session.status === 'active' ? 'success' : 'secondary'}>{session.status || 'unknown'}</Badge></td>
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
