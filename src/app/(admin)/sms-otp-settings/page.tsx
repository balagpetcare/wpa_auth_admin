'use client'

import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Badge,
  Spinner,
  Alert
} from 'react-bootstrap'
import { toast } from 'react-toastify'
import { communicationApi } from '@/features/communication/api'
import { sessionsApi } from '@/features/sessions/api'
import { CommProvider } from '@/features/communication/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatusBadge, ErrorState, EmptyState } from '@/components/dashboard/DashboardComponents'

export default function SmsOtpSettingsPage() {
  const [providers, setProviders] = useState<CommProvider[]>([])
  const [settings, setSettings] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Test Modal State
  const [showTestModal, setShowTestModal] = useState(false)
  const [testMobile, setTestMobile] = useState('')
  const [testMessage, setTestMessage] = useState('WPA Central Auth SMS Gateway Test Message.')
  const [testProviderId, setTestProviderId] = useState<string | null>(null)
  const [testProviderName, setTestProviderName] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const providersRes = await communicationApi.listProviders({ type: 'SMS' })
      if (providersRes.success && providersRes.data) {
        setProviders(providersRes.data.items)
      }

      const settingsRes = await sessionsApi.getSecuritySettings()
      if (settingsRes.success && settingsRes.settings) {
        setSettings(settingsRes.settings)
      }
    } catch (err: any) {
      console.error('Failed to load SMS settings:', err)
      setError(err?.message || 'Access Denied: Missing permissions to query SMS gateway parameters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenTestModal = (id: string, name: string) => {
    setTestProviderId(id)
    setTestProviderName(name)
    setTestMobile('')
    setShowTestModal(true)
  }

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testProviderId) return
    setActionLoading(true)
    try {
      const res = await communicationApi.testSmsProvider(testProviderId, testMobile, testMessage)
      if (res.success) {
        toast.success(res.message || `Test SMS dispatched successfully to ${testMobile}`)
        setShowTestModal(false)
      } else {
        toast.error(res.message || 'SMS transmission failed.')
      }
    } catch (err: any) {
      console.error('Test SMS send failed:', err)
      toast.error(err?.message || 'Failed to trigger SMS gateway transmission.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />
  }

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">SMS & OTP Gateway Configs</h4>
          <p className="text-muted mb-0 fs-13">Manage SMS provider channels, trigger gateway test messages, and monitor OTP policies.</p>
        </div>
      </div>

      {/* POLICY ENVIRONMENT WARNING */}
      <Alert variant="warning" className="d-flex align-items-start gap-3 mb-4 shadow-sm" style={{ borderLeftWidth: '5px' }}>
        <div className="bg-soft-warning p-2 rounded">
          <IconifyIcon icon="solar:lock-bold-duotone" className="text-warning fs-28" />
        </div>
        <div>
          <h5 className="alert-heading fw-bold fs-15 mb-1 text-warning-emphasis">Gateway Thresholds Managed via Environments</h5>
          <p className="fs-13 text-warning-emphasis mb-0">
            For operational stability, SMS provider connections, security thresholds, and SMTP verification protocols are configured via environment configuration variables (`.env`). 
            TTL lifetimes are read-only in this interface.
          </p>
        </div>
      </Alert>

      <Row>
        {/* PROVIDERS CARD */}
        <Col lg={7} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Active SMS Gateway Providers</h5>
              <span className="text-muted fs-12">Carrier channels utilized to dispatch authorization pin codes.</span>
            </Card.Header>
            <Card.Body className="px-4 pb-4 mt-3">
              {providers.length === 0 ? (
                <EmptyState message="No SMS provider gateways configured." icon="solar:chat-square-bold-duotone" />
              ) : (
                <div className="d-flex flex-column gap-3">
                  {providers.map((prov) => (
                    <div key={prov.id} className="p-3 bg-light rounded d-flex align-items-center justify-content-between">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong className="text-dark fs-14">{prov.name}</strong>
                          <Badge bg={prov.environment === 'LIVE' ? 'success' : 'warning'} className="fs-10">
                            {prov.environment}
                          </Badge>
                        </div>
                        <span className="text-muted fs-12 font-monospace">Code: {prov.code} | Priority: {prov.priority}</span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <StatusBadge status={prov.status} />
                        {prov.status === 'ACTIVE' && (
                          <Button variant="outline-primary" size="sm" onClick={() => handleOpenTestModal(prov.id, prov.name)}>
                            Test SMS
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* OTP POLICIES */}
        <Col lg={5} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">OTP Security Thresholds</h5>
              <span className="text-muted fs-12">One-Time Password lifecycle limits.</span>
            </Card.Header>
            <Card.Body className="px-4 pb-4 mt-3">
              <div className="d-flex flex-column gap-3">
                <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <strong className="text-dark fs-14 d-block">OTP Lifetime (TTL)</strong>
                    <span className="text-muted fs-11">Expiration window for verified PINs.</span>
                  </div>
                  <Badge bg="soft-secondary" className="text-secondary px-3 py-2 fs-13 font-monospace">
                    5 minutes
                  </Badge>
                </div>

                <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <strong className="text-dark fs-14 d-block">Maximum Retry Attempts</strong>
                    <span className="text-muted fs-11">Retries allowed before code lock.</span>
                  </div>
                  <Badge bg="soft-secondary" className="text-secondary px-3 py-2 fs-13 font-monospace">
                    3 attempts
                  </Badge>
                </div>

                <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                  <div>
                    <strong className="text-dark fs-14 d-block">Request Rate Limits</strong>
                    <span className="text-muted fs-11">Min duration between SMS dispatches.</span>
                  </div>
                  <Badge bg="soft-secondary" className="text-secondary px-3 py-2 fs-13 font-monospace">
                    60 seconds
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SEND TEST SMS MODAL */}
      <Modal show={showTestModal} onHide={() => setShowTestModal(false)} centered>
        <Form onSubmit={handleSendTestSms}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Test SMS Gateway: {testProviderName}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Recipient Mobile Number (with country code)</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="+15550199"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message Body</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowTestModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Sending...' : 'Trigger SMS Send'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
