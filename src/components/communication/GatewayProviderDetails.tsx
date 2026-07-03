'use client'

import React from 'react'
import { Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { CommProviderDetail } from '@/features/communication/types'

export default function GatewayProviderDetails({
  provider,
  providerType,
  onTest,
  onHealthCheck,
  onToggleActive,
  toggling,
  testing,
  healthing,
}: {
  provider: CommProviderDetail
  providerType: 'EMAIL' | 'SMS'
  onTest: () => void
  onHealthCheck: () => void
  onToggleActive: () => void
  toggling?: boolean
  testing?: boolean
  healthing?: boolean
}) {
  const activeCred = provider.credentials?.find((item) => item.isActive) ?? provider.credentials?.[0]
  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link href={providerType === 'EMAIL' ? '/email-gateway' : '/sms-gateway'} className="btn btn-light">
            <IconifyIcon icon="solar:arrow-left-bold-duotone" className="me-1" />
            Back
          </Link>
          <div>
            <h4 className="fw-bold text-dark mb-1">{provider.name}</h4>
            <p className="text-muted mb-0 fs-13 font-monospace">{provider.code}</p>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link href={providerType === 'EMAIL' ? `/email-gateway/${provider.id}/edit` : `/sms-gateway/${provider.id}/edit`} className="btn btn-primary">
            <IconifyIcon icon="solar:pen-bold-duotone" className="me-1" />
            Edit
          </Link>
          <Button variant="outline-primary" onClick={onTest} disabled={testing}>
            {testing ? <Spinner size="sm" animation="border" className="me-1" /> : <IconifyIcon icon="solar:chat-round-check-bold-duotone" className="me-1" />}
            Test
          </Button>
          <Button variant="outline-secondary" onClick={onHealthCheck} disabled={healthing}>
            {healthing ? <Spinner size="sm" animation="border" className="me-1" /> : <IconifyIcon icon="solar:heart-pulse-2-bold-duotone" className="me-1" />}
            Health Check
          </Button>
          <Button variant={provider.status === 'ACTIVE' ? 'outline-danger' : 'outline-success'} onClick={onToggleActive} disabled={toggling}>
            <IconifyIcon icon={provider.status === 'ACTIVE' ? 'solar:pause-bold-duotone' : 'solar:play-bold-duotone'} className="me-1" />
            {provider.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-3">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Overview</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <Row className="g-3">
                <Col md={4}><div className="text-muted fs-12">Environment</div><Badge bg={provider.environment === 'LIVE' ? 'success' : 'warning'}>{provider.environment}</Badge></Col>
                <Col md={4}><div className="text-muted fs-12">Scope</div><div className="fw-semibold">{provider.isGlobal ? 'Global' : provider.countryCode || '-'}</div></Col>
                <Col md={4}><div className="text-muted fs-12">Status</div><div className="fw-semibold">{provider.status}</div></Col>
                <Col md={4}><div className="text-muted fs-12">Health</div><div className="fw-semibold">{provider.healthStatus}</div></Col>
                <Col md={4}><div className="text-muted fs-12">Priority</div><div className="fw-semibold">{provider.priority}</div></Col>
                <Col md={4}><div className="text-muted fs-12">Purposes</div><div className="d-flex flex-wrap gap-1">{provider.supportedPurposes.map((p) => <Badge key={p} bg="soft-secondary" className="text-secondary">{p}</Badge>)}</div></Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 mb-3">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Credential / Config Preview</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {!activeCred ? <div className="text-muted">No credentials configured.</div> : (
                <Row className="g-3">
                  {providerType === 'EMAIL' ? (
                    <>
                      <Col md={6}><div className="text-muted fs-12">SMTP Host</div><div className="fw-semibold">{activeCred.smtpHost || '—'}</div></Col>
                      <Col md={3}><div className="text-muted fs-12">SMTP Port</div><div className="fw-semibold">{activeCred.smtpPort || '—'}</div></Col>
                      <Col md={3}><div className="text-muted fs-12">Security</div><div className="fw-semibold">{activeCred.smtpSecure ? 'SSL_TLS' : 'STARTTLS/NONE'}</div></Col>
                      <Col md={6}><div className="text-muted fs-12">Username</div><div className="fw-semibold">{activeCred.usernamePreview || '••••••'}</div></Col>
                      <Col md={6}><div className="text-muted fs-12">From Email</div><div className="fw-semibold">{activeCred.fromEmail || '—'}</div></Col>
                    </>
                  ) : (
                    <>
                      <Col md={6}><div className="text-muted fs-12">Base URL</div><div className="fw-semibold">{activeCred.apiBaseUrl || '—'}</div></Col>
                      <Col md={6}><div className="text-muted fs-12">Sender ID</div><div className="fw-semibold">{activeCred.senderId || '—'}</div></Col>
                      <Col md={6}><div className="text-muted fs-12">Masked Secrets</div><div className="fw-semibold font-monospace">{Object.keys(activeCred.maskedSecretsPreview || {}).join(', ') || '—'}</div></Col>
                    </>
                  )}
                </Row>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Recent Test Result</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="text-muted fs-13">Recent provider test state is reflected in the active credential metadata.</div>
              <div className="fw-semibold mt-2">{activeCred?.lastTestStatus || 'NOT_TESTED'}</div>
            </Card.Body>
          </Card>
          <Card className="shadow-sm border-0 mt-3">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Recent Delivery Logs</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="text-muted fs-13">Open Delivery Logs to inspect the attempt chain and fallback history for this provider.</div>
            </Card.Body>
          </Card>
          <Card className="shadow-sm border-0 mt-3">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Recent Audit Logs</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="text-muted fs-13">Open Provider Audit Logs to review configuration and operational changes.</div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-3">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0"><h5 className="fw-bold text-dark mb-0">Health</h5></Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="mb-2 text-muted fs-12">Current Health</div>
              <div className="fw-bold fs-4">{provider.healthStatus}</div>
              <div className="text-muted fs-13 mt-2">Success: {provider.successCount} | Failed: {provider.failureCount}</div>
            </Card.Body>
          </Card>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0"><h5 className="fw-bold text-dark mb-0">Audit & Safety</h5></Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="text-muted fs-12">Last Success</div>
              <div className="fw-semibold mb-2">{provider.lastSuccessAt ? new Date(provider.lastSuccessAt).toLocaleString() : '—'}</div>
              <div className="text-muted fs-12">Last Failure</div>
              <div className="fw-semibold">{provider.lastFailureAt ? new Date(provider.lastFailureAt).toLocaleString() : '—'}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
