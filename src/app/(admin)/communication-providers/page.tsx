'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge, Button, Card, Col, Row, Spinner, Table, Form } from 'react-bootstrap'
import { toast } from 'react-toastify'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ApiErrorState from '@/components/common/ApiErrorState'
import { EmptyState, StatusBadge } from '@/components/dashboard/DashboardComponents'
import { ApiError } from '@/lib/apiClient'
import { communicationApi } from '@/features/communication/api'
import { CommProvider } from '@/features/communication/types'

export default function CommunicationProvidersOverviewPage() {
  const [providers, setProviders] = useState<CommProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EMAIL' | 'SMS'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'TESTING' | 'DISABLED'>('ALL')
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'DOWN'>('ALL')
  const [environmentFilter, setEnvironmentFilter] = useState<'ALL' | 'SANDBOX' | 'LIVE'>('ALL')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await communicationApi.listProviders({
        ...(typeFilter !== 'ALL' ? { type: typeFilter } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(healthFilter !== 'ALL' ? { healthStatus: healthFilter } : {}),
        ...(environmentFilter !== 'ALL' ? { environment: environmentFilter } : {}),
      })
      if (res.success) setProviders(res.data.items)
    } catch (e: any) {
      if (e instanceof ApiError) setError({ message: e.message, status: e.status })
      else setError({ message: 'Unable to load communication providers.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [typeFilter, statusFilter, healthFilter, environmentFilter])

  const stats = useMemo(() => ({
    total: providers.length,
    active: providers.filter((p) => p.status === 'ACTIVE').length,
    healthy: providers.filter((p) => p.healthStatus === 'HEALTHY').length,
    down: providers.filter((p) => p.healthStatus === 'DOWN').length,
  }), [providers])

  if (error) return <ApiErrorState message={error.message} status={error.status} onRetry={load} />

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Communication Providers</h4>
          <p className="text-muted mb-0 fs-13">Compact overview of all configured communication gateways.</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/email-gateway" className="btn btn-primary">
            <IconifyIcon icon="solar:letter-bold-duotone" className="me-1" />Email Gateway
          </Link>
          <Link href="/sms-gateway" className="btn btn-outline-primary">
            <IconifyIcon icon="solar:chat-square-bold-duotone" className="me-1" />SMS / OTP Gateway
          </Link>
        </div>
      </div>

      <Row className="g-3 mb-3">
        <Col md={3}><Card className="shadow-sm border-0"><Card.Body><div className="text-muted fs-12">Total Providers</div><div className="fw-bold fs-3">{stats.total}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="shadow-sm border-0"><Card.Body><div className="text-muted fs-12">Active Providers</div><div className="fw-bold fs-3">{stats.active}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="shadow-sm border-0"><Card.Body><div className="text-muted fs-12">Healthy Providers</div><div className="fw-bold fs-3">{stats.healthy}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="shadow-sm border-0"><Card.Body><div className="text-muted fs-12">Failed / Down</div><div className="fw-bold fs-3">{stats.down}</div></Card.Body></Card></Col>
      </Row>

      <Card className="shadow-sm border-0 mb-3">
        <Card.Body className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select style={{ maxWidth: 180 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
            <option value="ALL">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
          </Form.Select>
          <Form.Select style={{ maxWidth: 180 }} value={environmentFilter} onChange={(e) => setEnvironmentFilter(e.target.value as any)}>
            <option value="ALL">All Environments</option>
            <option value="SANDBOX">SANDBOX</option>
            <option value="LIVE">LIVE</option>
          </Form.Select>
          <Form.Select style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="TESTING">TESTING</option>
            <option value="DISABLED">DISABLED</option>
          </Form.Select>
          <Form.Select style={{ maxWidth: 180 }} value={healthFilter} onChange={(e) => setHealthFilter(e.target.value as any)}>
            <option value="ALL">All Health</option>
            <option value="UNKNOWN">UNKNOWN</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="DOWN">DOWN</option>
          </Form.Select>
          <Button variant="light" onClick={load} className="ms-auto">
            <IconifyIcon icon="solar:refresh-bold-duotone" className="me-1" />Refresh
          </Button>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : providers.length === 0 ? (
            <EmptyState message="No providers found." icon="solar:server-square-bold-duotone" />
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="px-4">Provider</th>
                  <th>Channel</th>
                  <th>Environment</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Priority</th>
                  <th className="text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id}>
                    <td className="px-4">
                      <div className="fw-semibold text-dark">{provider.name}</div>
                      <div className="text-muted fs-11 font-monospace">{provider.code}</div>
                    </td>
                    <td><Badge bg="soft-secondary" className="text-secondary">{provider.type}</Badge></td>
                    <td><Badge bg={provider.environment === 'LIVE' ? 'soft-success' : 'soft-warning'} className={provider.environment === 'LIVE' ? 'text-success' : 'text-warning'}>{provider.environment}</Badge></td>
                    <td className="text-secondary">{provider.isGlobal ? 'Global' : provider.countryCode || '—'}</td>
                    <td><StatusBadge status={provider.status} /></td>
                    <td><StatusBadge status={provider.healthStatus} /></td>
                    <td className="text-secondary">{provider.priority}</td>
                    <td className="px-4">
                      <div className="d-flex justify-content-end flex-wrap gap-2">
                        <Link href={provider.type === 'EMAIL' ? `/email-gateway/${provider.id}` : `/sms-gateway/${provider.id}`} className="btn btn-link p-0">
                          <IconifyIcon icon="solar:eye-bold-duotone" className="me-1" />View
                        </Link>
                        <Link href={provider.type === 'EMAIL' ? `/email-gateway/${provider.id}/edit` : `/sms-gateway/${provider.id}/edit`} className="btn btn-link p-0 text-primary">
                          <IconifyIcon icon="solar:pen-bold-duotone" className="me-1" />Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
