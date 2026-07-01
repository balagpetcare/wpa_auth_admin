'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/apiClient'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Form, Row, Spinner } from 'react-bootstrap'

type AdminUser = {
  id: string
  displayName?: string
  username?: string
  email?: string
  role?: string
  status?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [state, setState] = useState<'ready' | 'empty' | 'unavailable'>('ready')

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await apiClient(token).get<any>('/admin-users')
        const list = Array.isArray(response?.items) ? response.items : Array.isArray(response?.users) ? response.users : []
        setUsers(list)
        setState(list.length ? 'ready' : 'empty')
      } catch {
        setState('unavailable')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = users.filter((user) =>
    [user.displayName, user.username, user.email, user.role].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <>
      <div className="page-title-box">
        <div>
          <h1 className="mb-1">Admin Users</h1>
          <p className="text-muted mb-0">Manage administrators and their access profile.</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/dashboard" className="btn btn-light">
            Back to dashboard
          </Link>
          <Button variant="primary" disabled title="Invite action depends on backend support">
            Invite admin
          </Button>
        </div>
      </div>

      <Row className="g-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-transparent border-0 p-4 pb-0">
              <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <CardTitle as="h4" className="mb-0">Admin directory</CardTitle>
                <Form.Control value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search admins, email, role" style={{ maxWidth: 320 }} />
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {loading && (
                <div className="py-5 text-center text-muted">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading admin users...
                </div>
              )}
              {!loading && state === 'unavailable' && <div className="alert alert-soft-warning mb-0">Admin users endpoint is unavailable. No live list can be shown.</div>}
              {!loading && state === 'empty' && <div className="alert alert-soft-secondary mb-0">No admin users were returned by the API.</div>}
              {!loading && state === 'ready' && (
                <div className="table-responsive">
                  <table className="table table-centered table-hover mb-0">
                    <thead className="bg-light bg-opacity-50">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((user) => (
                        <tr key={user.id}>
                          <td className="fw-semibold text-dark">{user.displayName || user.username || 'Unnamed admin'}</td>
                          <td className="text-muted">{user.email || 'Unavailable'}</td>
                          <td><Badge bg="secondary">{user.role || 'Unassigned'}</Badge></td>
                          <td><Badge bg={user.status === 'active' ? 'success' : 'warning'}>{user.status || 'unknown'}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
