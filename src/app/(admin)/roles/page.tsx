'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/apiClient'
import { Badge, Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner } from 'react-bootstrap'

type Role = { id: string; name?: string; description?: string; permissions?: string[]; status?: string }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<'ready' | 'empty' | 'unavailable'>('ready')

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await apiClient(token).get<any>('/roles')
        const list = Array.isArray(response?.items) ? response.items : Array.isArray(response?.roles) ? response.roles : []
        setRoles(list)
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
          <h1 className="mb-1">Roles & Permissions</h1>
          <p className="text-muted mb-0">Overview of access roles and associated permissions.</p>
        </div>
        <Link href="/dashboard" className="btn btn-light">Back to dashboard</Link>
      </div>

      <Row className="g-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-transparent border-0 p-4 pb-0">
              <CardTitle as="h4" className="mb-0">Roles overview</CardTitle>
            </CardHeader>
            <CardBody className="p-4">
              {loading && <div className="py-5 text-center text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading roles...</div>}
              {!loading && state === 'unavailable' && <div className="alert alert-soft-warning mb-0">Roles endpoint is unavailable. Showing empty state only.</div>}
              {!loading && state === 'empty' && <div className="alert alert-soft-secondary mb-0">No roles were returned by the API.</div>}
              {!loading && state === 'ready' && (
                <div className="table-responsive">
                  <table className="table table-centered table-hover mb-0">
                    <thead className="bg-light bg-opacity-50">
                      <tr><th>Role</th><th>Description</th><th>Permissions</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {roles.map((role) => (
                        <tr key={role.id}>
                          <td className="fw-semibold text-dark">{role.name || 'Unnamed role'}</td>
                          <td className="text-muted">{role.description || 'Unavailable'}</td>
                          <td className="text-muted">{role.permissions?.length ? `${role.permissions.length} permissions` : 'Unavailable'}</td>
                          <td><Badge bg={role.status === 'active' ? 'success' : 'secondary'}>{role.status || 'unknown'}</Badge></td>
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
