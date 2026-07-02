'use client'

import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Spinner,
  Alert
} from 'react-bootstrap'
import { toast } from 'react-toastify'
import { sessionsApi } from '@/features/sessions/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatusBadge, ErrorState } from '@/components/dashboard/DashboardComponents'

interface SecuritySettingsData {
  platformName?: string
  publicAuthDomain?: string
  adminPanelUrl?: string
  supportEmail?: string
  environment?: string
  apiBaseUrl?: string
  issuerUrl?: string
  accessTokenTtl?: number
  refreshTokenTtl?: number
  authorizationCodeTtl?: number
  serviceTokenTtl?: number
  trustProxy?: boolean
  jwksMode?: string
  databaseStatus?: string
  redisStatus?: string
  smtpStatus?: string
}

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<SecuritySettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await sessionsApi.getSecuritySettings()
      if (response.success && response.settings) {
        setSettings(response.settings)
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err)
      setError(err?.message || 'Access Denied: Missing permissions to query settings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const isDev = settings?.environment?.toLowerCase() === 'development'

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">System Security & Policies</h4>
          <p className="text-muted mb-0 fs-13">Inspect cryptographic configurations, token lifetimes, database settings, and environmental warnings.</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={loadSettings} disabled={loading} className="d-flex align-items-center gap-1 px-3 py-2 shadow-sm">
          <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16' : 'fs-16'} />
          Re-evaluate Policies
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={loadSettings} />}

      {/* WARNING BANNER FOR DEV MODE */}
      {settings && isDev && (
        <Alert variant="warning" className="d-flex align-items-start gap-3 mb-4 shadow-sm" style={{ borderLeftWidth: '5px' }}>
          <div className="bg-soft-warning p-2 rounded">
            <IconifyIcon icon="solar:danger-triangle-bold" className="text-warning fs-28" />
          </div>
          <div>
            <h5 className="alert-heading fw-bold fs-16 mb-1 text-warning-emphasis">Development Environment Active</h5>
            <p className="fs-13 text-warning-emphasis mb-0">
              The control gateway is currently executing in <strong>development</strong> mode. Session lifetimes, trusted origins, and token endpoints are running under local debug parameters. 
              Do not use these parameters in production clusters.
            </p>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : settings ? (
        <Row>
          {/* TOKEN POLICIES CARD */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
              <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <IconifyIcon icon="solar:ticket-bold-duotone" className="text-primary fs-20" />
                  <h5 className="fw-bold text-dark mb-0">Token Expiration Lifetimes</h5>
                </div>
                <span className="text-muted fs-12">Cryptographic session durations loaded from backend variables.</span>
              </Card.Header>
              <Card.Body className="px-4 pb-4 mt-3">
                <div className="d-flex flex-column gap-3">
                  <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="text-dark fs-14 d-block">Access Token TTL</strong>
                      <span className="text-muted fs-11">Lifetimes of stateless JWT auth tokens.</span>
                    </div>
                    <Badge bg="soft-primary" className="text-primary px-3 py-2 fs-13 font-monospace">
                      {settings.accessTokenTtl || 15} minutes
                    </Badge>
                  </div>

                  <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="text-dark fs-14 d-block">Refresh Token TTL</strong>
                      <span className="text-muted fs-11">Lifetimes of persistent offline session tokens.</span>
                    </div>
                    <Badge bg="soft-primary" className="text-primary px-3 py-2 fs-13 font-monospace">
                      {settings.refreshTokenTtl || 30} days
                    </Badge>
                  </div>

                  <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="text-dark fs-14 d-block">Authorization Code TTL</strong>
                      <span className="text-muted fs-11">Lifetimes of temporary OAuth authorization codes.</span>
                    </div>
                    <Badge bg="soft-secondary" className="text-secondary px-3 py-2 fs-13 font-monospace">
                      {settings.authorizationCodeTtl ? settings.authorizationCodeTtl / 60 : 10} minutes
                    </Badge>
                  </div>

                  <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="text-dark fs-14 d-block">Service Access Token TTL</strong>
                      <span className="text-muted fs-11">Lifetimes of machine-to-machine integration credentials.</span>
                    </div>
                    <Badge bg="soft-secondary" className="text-secondary px-3 py-2 fs-13 font-monospace">
                      {settings.serviceTokenTtl ? settings.serviceTokenTtl / 60 : 60} minutes
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* CLUSTER ENVIRONMENT CONFIGS */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
              <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <IconifyIcon icon="solar:global-bold-duotone" className="text-primary fs-20" />
                  <h5 className="fw-bold text-dark mb-0">Control Gateway Environment</h5>
                </div>
                <span className="text-muted fs-12">Read-only connection properties mapped from system process environment.</span>
              </Card.Header>
              <Card.Body className="px-4 pb-4 mt-3">
                <div className="d-flex flex-column gap-2 font-monospace">
                  <div className="d-flex justify-content-between border-bottom py-2 fs-13">
                    <span className="text-muted font-sans">Platform Name:</span>
                    <strong className="text-dark">{settings.platformName || 'WPA Central Auth'}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2 fs-13">
                    <span className="text-muted font-sans">Authentication Domain:</span>
                    <strong className="text-dark">{settings.publicAuthDomain || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2 fs-13">
                    <span className="text-muted font-sans">Admin Console URL:</span>
                    <strong className="text-dark">{settings.adminPanelUrl || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2 fs-13">
                    <span className="text-muted font-sans">OAuth Issuer URL:</span>
                    <strong className="text-dark">{settings.issuerUrl || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2 fs-13">
                    <span className="text-muted font-sans">Proxy Trust Option:</span>
                    <strong className="text-dark">{settings.trustProxy ? 'Enabled' : 'Disabled'}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-2 fs-13">
                    <span className="text-muted font-sans">JWKS Provider Mode:</span>
                    <strong className="text-dark">{settings.jwksMode || 'N/A'}</strong>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : null}
    </div>
  )
}
