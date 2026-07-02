'use client'

import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
  Alert
} from 'react-bootstrap'
import { systemApi } from '@/features/system/api'
import { HealthStatus, SystemSettings } from '@/features/system/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

export default function ApiHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<string>('')

  const loadHealthData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch both health status and system config parameters
      const healthRes = await systemApi.getHealth()
      setHealth(healthRes)

      const settingsRes = await systemApi.getSettings()
      if (settingsRes.success && settingsRes.settings) {
        setSettings(settingsRes.settings)
      }
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

  // Uptime formatting helper
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${d}d ${h}h ${m}m ${s}s`
  }

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">System Health Monitor</h4>
          <p className="text-muted mb-0 fs-13">Inspect microservice connectivity, database pools, cache layers, and host metrics.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {lastChecked && <span className="text-muted fs-12">Last checked: {lastChecked}</span>}
          <Button variant="primary" size="sm" onClick={loadHealthData} disabled={loading} className="d-flex align-items-center gap-1 shadow-sm px-3 py-2">
            <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16' : 'fs-16'} />
            Query Health
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
        <Row>
          {/* GENERAL GATEWAY HEALTH */}
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
              <Card.Body className="p-4 d-flex flex-column justify-content-between">
                <div>
                  <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-3">API Server Uptime</h6>
                  <div className="d-flex align-items-baseline gap-2 mb-2">
                    <h2 className="fw-bold text-dark mb-0">{formatUptime(health.uptime)}</h2>
                  </div>
                  <p className="text-muted fs-12 mb-0">Stateless node engine host process uptime.</p>
                </div>
                <div className="border-top pt-3 mt-4 d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-13">Gateway Endpoint Status:</span>
                  <Badge bg="soft-success" className="text-success fs-12 px-3 py-1.5 fw-semibold">
                    ONLINE
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* DATABASE STATUS */}
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
              <Card.Body className="p-4 d-flex flex-column justify-content-between">
                <div>
                  <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-3">Database Connection</h6>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <IconifyIcon icon="solar:database-bold-duotone" className="text-primary fs-28" />
                    <h4 className="fw-bold text-dark mb-0">{settings?.databaseStatus || 'Connected'}</h4>
                  </div>
                  <p className="text-muted fs-12 mb-0">Prisma client connection pool health to PostgreSQL instance.</p>
                </div>
                <div className="border-top pt-3 mt-4 d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-13">Relational DB Pool:</span>
                  <Badge bg={settings?.databaseStatus === 'Connected' ? 'soft-success' : 'soft-danger'} className={`${settings?.databaseStatus === 'Connected' ? 'text-success' : 'text-danger'} fs-12 px-3 py-1.5 fw-semibold`}>
                    {settings?.databaseStatus?.toUpperCase() || 'CONNECTED'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* REDIS STATUS */}
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
              <Card.Body className="p-4 d-flex flex-column justify-content-between">
                <div>
                  <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-3">Redis Cache Connection</h6>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <IconifyIcon icon="solar:server-square-bold-duotone" className="text-primary fs-28" />
                    <h4 className="fw-bold text-dark mb-0">{settings?.redisStatus || 'Connected'}</h4>
                  </div>
                  <p className="text-muted fs-12 mb-0">Distributed session storage cache health status.</p>
                </div>
                <div className="border-top pt-3 mt-4 d-flex justify-content-between align-items-center">
                  <span className="text-muted fs-13">Redis Cluster Status:</span>
                  <Badge bg={settings?.redisStatus === 'Connected' ? 'soft-success' : 'soft-danger'} className={`${settings?.redisStatus === 'Connected' ? 'text-success' : 'text-danger'} fs-12 px-3 py-1.5 fw-semibold`}>
                    {settings?.redisStatus?.toUpperCase() || 'CONNECTED'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : null}
    </div>
  )
}
