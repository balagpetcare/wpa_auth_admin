'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/apiClient'
import { Badge, Card, CardBody, Col, Row, Spinner } from 'react-bootstrap'

type StatItem = {
  label: string
  value: string
  helper: string
  icon: string
}

type HealthItem = {
  label: string
  value: string
  variant: 'success' | 'warning' | 'danger' | 'secondary'
  endpoint?: string
}

type ApiProbe = {
  label: string
  endpoint: string
  fallback?: string
}

async function tryEndpoints<T>(token: string | null, probes: ApiProbe[]) {
  const client = apiClient(token)
  for (const probe of probes) {
    try {
      const data = await client.get<T>(probe.endpoint)
      return { data, endpoint: probe.endpoint, fallback: false }
    } catch {
      continue
    }
  }
  return { data: null as T | null, endpoint: undefined, fallback: true }
}

function LoadingCard() {
  return (
    <Card className="border-0 shadow-sm h-100">
      <CardBody className="p-4">
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner animation="border" size="sm" />
          Loading dashboard data...
        </div>
      </CardBody>
    </Card>
  )
}

export default function DashboardStats() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatItem[]>([])
  const [health, setHealth] = useState<HealthItem[]>([])

  useEffect(() => {
    const load = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const [statsProbe, healthProbe] = await Promise.all([
        tryEndpoints<any>(token, [{ label: 'dashboard stats', endpoint: '/admin/dashboard/stats' }]),
        tryEndpoints<any>(token, [
          { label: 'system health', endpoint: '/admin/system/health' },
          { label: 'health', endpoint: '/health' },
          { label: 'admin health', endpoint: '/admin/health' },
        ]),
      ])

      const statPayload = statsProbe.data ?? {}
      setStats([
        { label: 'Total Admins', value: String(statPayload.totalAdmins ?? statPayload.totalUsers ?? 'Unavailable'), helper: statsProbe.fallback ? 'No stats endpoint available' : 'From API', icon: '👥' },
        { label: 'Active Sessions', value: String(statPayload.activeSessions ?? 'Unavailable'), helper: statsProbe.fallback ? 'No stats endpoint available' : 'From API', icon: '💻' },
        { label: 'OAuth Clients', value: String(statPayload.oauthClients ?? 'Unavailable'), helper: statsProbe.fallback ? 'No stats endpoint available' : 'From API', icon: '🔌' },
        { label: 'Security Events', value: String(statPayload.securityEvents ?? 'Unavailable'), helper: statsProbe.fallback ? 'No stats endpoint available' : 'From API', icon: '🛡️' },
      ])

      const healthPayload = healthProbe.data as any
      const healthItems: HealthItem[] = [
        {
          label: 'API status',
          value: healthPayload?.api?.status || healthPayload?.status || (healthProbe.fallback ? 'Unavailable' : 'Healthy'),
          variant: healthProbe.fallback ? 'secondary' : 'success',
          endpoint: healthProbe.endpoint,
        },
        {
          label: 'Redis status',
          value: healthPayload?.redis?.status || 'Unavailable',
          variant: healthPayload?.redis ? 'success' : 'secondary',
          endpoint: healthProbe.endpoint,
        },
        {
          label: 'Database status',
          value: healthPayload?.database?.status || 'Unavailable',
          variant: healthPayload?.database ? 'success' : 'secondary',
          endpoint: healthProbe.endpoint,
        },
        {
          label: 'Email queue status',
          value: healthPayload?.emailQueue?.status || healthPayload?.queue?.status || 'Unavailable',
          variant: healthPayload?.emailQueue || healthPayload?.queue ? 'success' : 'secondary',
          endpoint: healthProbe.endpoint,
        },
      ]
      setHealth(healthItems)
      setLoading(false)
    }

    load().catch(() => {
      setStats([])
      setHealth([])
      setLoading(false)
    })
  }, [])

  const statCards = useMemo(
    () =>
      stats.map((item) => (
        <Col key={item.label} xs={12} md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <p className="text-uppercase text-muted fw-medium fs-12 mb-2">{item.label}</p>
                  <h2 className="mb-1 fw-semibold text-dark">{item.value}</h2>
                  <div className="text-muted fs-13">{item.helper}</div>
                </div>
                <div className="avatar-md bg-primary-subtle text-primary rounded-3 flex-centered">
                  <span className="fs-3">{item.icon}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      )),
    [stats],
  )

  return (
    <>
      <Row className="g-4 mb-4">
        {loading && (
          <>
            <Col xs={12} md={6} xl={3}><LoadingCard /></Col>
            <Col xs={12} md={6} xl={3}><LoadingCard /></Col>
            <Col xs={12} md={6} xl={3}><LoadingCard /></Col>
            <Col xs={12} md={6} xl={3}><LoadingCard /></Col>
          </>
        )}
        {!loading && statCards}
      </Row>

      <Row className="g-4 mb-4">
        {health.map((item) => (
          <Col key={item.label} xs={12} md={6} xl={3}>
            <Card className="border-0 shadow-sm h-100">
              <CardBody className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fw-medium">{item.label}</span>
                  <Badge bg={item.variant} className="text-uppercase">
                    {item.value}
                  </Badge>
                </div>
                <div className="small text-muted mb-3">{item.endpoint ? `Source: ${item.endpoint}` : 'No endpoint available'}</div>
                <div className="progress progress-sm">
                  <div className={`progress-bar bg-${item.variant}`} style={{ width: item.variant === 'success' ? '100%' : '30%' }} />
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <CardBody className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h4 className="mb-1 text-dark">System health</h4>
              <p className="mb-0 text-muted">Status checks are based on available endpoints only.</p>
            </div>
            <Link href="/email-settings" className="btn btn-soft-primary btn-sm">
              Open email settings
            </Link>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {health.map((item) => (
              <Badge key={item.label} bg={item.variant} className="p-2">
                {item.label}: {item.value}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>
    </>
  )
}
