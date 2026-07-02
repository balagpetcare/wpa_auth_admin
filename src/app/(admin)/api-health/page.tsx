'use client'

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Button, Spinner, Badge, Alert, Table } from 'react-bootstrap'
import { systemApi } from '@/features/system/api'
import { HealthStatus, OperationalSnapshot, ReadinessStatus, SystemSettings } from '@/features/system/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ApiErrorState from '@/components/common/ApiErrorState'

export default function ApiHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [readiness, setReadiness] = useState<ReadinessStatus | null>(null)
  const [metrics, setMetrics] = useState<OperationalSnapshot | null>(null)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<string>('')

  const loadHealthData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [healthRes, readinessRes, metricsRes, settingsRes] = await Promise.all([
        systemApi.getHealth(),
        systemApi.getReadiness().catch(() => null),
        systemApi.getOperationalSnapshot().catch(() => null),
        systemApi.getSettings().catch(() => null),
      ])

      setHealth(healthRes)
      if (readinessRes) setReadiness(readinessRes)
      if (metricsRes?.success && metricsRes.data) setMetrics(metricsRes.data)
      if (settingsRes?.success && settingsRes.settings) setSettings(settingsRes.settings)
      setLastChecked(new Date().toLocaleTimeString())
    } catch (err: any) {
      console.error('Failed to load system health:', err)
      setError('Connection Failed: The WPA Central Auth REST API appears offline or unreachable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHealthData()
  }, [])

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${d}d ${h}h ${m}m ${s}s`
  }

  const renderHealthBadge = (value?: string) => (
    <Badge bg={value === 'UP' || value === 'READY' ? 'soft-success' : value === 'DOWN' || value === 'NOT_READY' ? 'soft-danger' : 'soft-secondary'} className={`${value === 'UP' || value === 'READY' ? 'text-success' : value === 'DOWN' || value === 'NOT_READY' ? 'text-danger' : 'text-secondary'} fs-12 px-3 py-1.5 fw-semibold`}>
      {value || 'UNKNOWN'}
    </Badge>
  )

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">System Health Monitor</h4>
          <p className="text-muted mb-0 fs-13">Inspect API liveness, readiness, queue depth, worker heartbeats, and runtime health.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {lastChecked && <span className="text-muted fs-12">Last checked: {lastChecked}</span>}
          <Button variant="primary" size="sm" onClick={loadHealthData} disabled={loading} className="d-flex align-items-center gap-1 shadow-sm px-3 py-2">
            <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16' : 'fs-16'} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex align-items-start gap-3 mb-4 shadow-sm" style={{ borderLeftWidth: '5px' }}>
          <div className="bg-soft-danger p-2 rounded">
            <IconifyIcon icon="solar:shield-warning-bold" className="text-danger fs-28" />
          </div>
          <div>
            <h5 className="alert-heading fw-bold fs-16 mb-1 text-danger-emphasis">Gateway Connection Unreachable</h5>
            <p className="fs-13 text-danger-emphasis mb-2">{error}</p>
            <Button variant="outline-danger" size="sm" onClick={loadHealthData}>
              Retry Connection
            </Button>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : health ? (
        <>
          <Row>
            <Col lg={3} md={6} className="mb-4">
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-3">API Server Uptime</h6>
                    <h2 className="fw-bold text-dark mb-2">{formatUptime(health.uptime)}</h2>
                    <p className="text-muted fs-12 mb-0">Node process uptime for the API gateway.</p>
                  </div>
                  <div className="border-top pt-3 mt-4 d-flex justify-content-between align-items-center">
                    <span className="text-muted fs-13">Liveness</span>
                    <Badge bg="soft-success" className="text-success fs-12 px-3 py-1.5 fw-semibold">UP</Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-4">
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-3">Readiness</h6>
                    <h4 className="fw-bold text-dark mb-2">{readiness?.status || 'UNKNOWN'}</h4>
                    <p className="text-muted fs-12 mb-0">Database and Redis readiness check.</p>
                  </div>
                  <div className="border-top pt-3 mt-4 d-flex justify-content-between align-items-center">
                    <span className="text-muted fs-13">Ready State</span>
                    {renderHealthBadge(readiness?.status)}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-4">
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-3">Database</h6>
                    <h4 className="fw-bold text-dark mb-2">{metrics?.health.database || settings?.databaseStatus || 'UNKNOWN'}</h4>
                    <p className="text-muted fs-12 mb-0">PostgreSQL connectivity and query health.</p>
                  </div>
                  <div className="border-top pt-3 mt-4 d-flex justify-content-between align-items-center">
                    <span className="text-muted fs-13">DB</span>
                    {renderHealthBadge(metrics?.health.database || settings?.databaseStatus)}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={3} md={6} className="mb-4">
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
                <Card.Body className="p-4 d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-3">Redis / Queue</h6>
                    <h4 className="fw-bold text-dark mb-2">{metrics?.health.redis || settings?.redisStatus || 'UNKNOWN'}</h4>
                    <p className="text-muted fs-12 mb-0">Redis cache, queue depth, and worker heartbeat.</p>
                  </div>
                  <div className="border-top pt-3 mt-4 d-flex justify-content-between align-items-center">
                    <span className="text-muted fs-13">Queue</span>
                    <Badge bg="soft-primary" className="text-primary fs-12 px-3 py-1.5 fw-semibold">
                      {metrics?.queue.depth ?? 0} queued
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={6} className="mb-4">
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
                <Card.Header className="bg-transparent border-0 pt-4 px-4">
                  <h5 className="fw-bold text-dark mb-0">Worker Heartbeats</h5>
                  <span className="text-muted fs-12">Redis TTL-based status for background workers.</span>
                </Card.Header>
                <Card.Body className="px-4 pb-4">
                  {metrics?.workers?.length ? (
                    <Table responsive className="mb-0 align-middle">
                      <thead className="bg-light">
                        <tr>
                          <th>Worker</th>
                          <th>Status</th>
                          <th>TTL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.workers.map((worker) => (
                          <tr key={worker.name}>
                            <td className="fw-semibold text-capitalize">{worker.name}</td>
                            <td>{worker.online ? <Badge bg="soft-success" className="text-success">Online</Badge> : <Badge bg="soft-danger" className="text-danger">Offline</Badge>}</td>
                            <td className="text-secondary fs-13">{worker.ttl > 0 ? `${worker.ttl}s` : 'expired'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-muted fs-13">No worker heartbeat data available yet.</div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
                <Card.Header className="bg-transparent border-0 pt-4 px-4">
                  <h5 className="fw-bold text-dark mb-0">Runtime Counters</h5>
                  <span className="text-muted fs-12">Queue, login, rate-limit, and delivery activity.</span>
                </Card.Header>
                <Card.Body className="px-4 pb-4">
                  <div className="d-flex flex-column gap-2 fs-13">
                    <div className="d-flex justify-content-between"><span>Login success</span><strong>{metrics?.metrics.counters.login_success_total ?? 0}</strong></div>
                    <div className="d-flex justify-content-between"><span>Login failure</span><strong>{metrics?.metrics.counters.login_failure_total ?? 0}</strong></div>
                    <div className="d-flex justify-content-between"><span>Refresh reuse detections</span><strong>{metrics?.metrics.counters.refresh_token_reuse_total ?? 0}</strong></div>
                    <div className="d-flex justify-content-between"><span>Rate-limit blocks</span><strong>{metrics?.metrics.counters.rate_limit_block_total ?? 0}</strong></div>
                    <div className="d-flex justify-content-between"><span>Queue enqueue failures</span><strong>{metrics?.metrics.counters.queue_failure_total ?? 0}</strong></div>
                    <div className="d-flex justify-content-between"><span>Worker DLQ</span><strong>{metrics?.metrics.counters.worker_dlq_total ?? 0}</strong></div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  )
}
