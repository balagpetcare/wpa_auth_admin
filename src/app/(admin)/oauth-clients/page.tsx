'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/apiClient'
import { Badge, Card, CardBody, CardHeader, CardTitle, Spinner } from 'react-bootstrap'

type Client = { id: string; name?: string; clientId?: string; status?: string; redirectUris?: string[] }

export default function OAuthClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<'ready' | 'empty' | 'unavailable'>('ready')

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await apiClient(token).get<any>('/oauth-clients')
        const list = Array.isArray(response?.items) ? response.items : Array.isArray(response?.clients) ? response.clients : []
        setClients(list)
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
          <h1 className="mb-1">OAuth Clients</h1>
          <p className="text-muted mb-0">Connected applications and client status.</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/dashboard" className="btn btn-light">Back to dashboard</Link>
          <button className="btn btn-primary" disabled title="Create client depends on backend support">Create client</button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-transparent border-0 p-4 pb-0">
          <CardTitle as="h4" className="mb-0">Client applications</CardTitle>
        </CardHeader>
        <CardBody className="p-4">
          {loading && <div className="py-5 text-center text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading OAuth clients...</div>}
          {!loading && state === 'unavailable' && <div className="alert alert-soft-warning mb-0">OAuth clients endpoint is unavailable.</div>}
          {!loading && state === 'empty' && <div className="alert alert-soft-secondary mb-0">No OAuth clients were returned by the API.</div>}
          {!loading && state === 'ready' && (
            <div className="table-responsive">
              <table className="table table-centered table-hover mb-0">
                <thead className="bg-light bg-opacity-50">
                  <tr><th>Name</th><th>Client ID</th><th>Redirect URIs</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="fw-semibold text-dark">{client.name || 'Unnamed client'}</td>
                      <td className="text-muted">{client.clientId || 'Unavailable'}</td>
                      <td className="text-muted">{client.redirectUris?.length ? `${client.redirectUris.length} URI(s)` : 'Unavailable'}</td>
                      <td><Badge bg={client.status === 'active' ? 'success' : 'secondary'}>{client.status || 'unknown'}</Badge></td>
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
