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
  Spinner
} from 'react-bootstrap'
import { communicationApi } from '@/features/communication/api'
import { CommProvider, EmailTemplate, EmailBranding } from '@/features/communication/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatusBadge, ErrorState, EmptyState } from '@/components/dashboard/DashboardComponents'
import adminToast from '@/lib/adminToast'
import { getAdminErrorMessage } from '@/lib/adminErrorMessage'

export default function EmailSettingsPage() {
  const [providers, setProviders] = useState<CommProvider[]>([])
  const [branding, setBranding] = useState<EmailBranding | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Forms
  const [brandName, setBrandName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Test modal
  const [showTestModal, setShowTestModal] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testTemplateId, setTestTemplateId] = useState<string | null>(null)
  const [testTemplateKey, setTestTemplateKey] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const providersRes = await communicationApi.listProviders({ type: 'EMAIL' })
      if (providersRes.success && providersRes.data) {
        setProviders(providersRes.data.items)
      }

      const brandingRes = await communicationApi.getEmailBranding()
      if (brandingRes.success && brandingRes.data) {
        setBranding(brandingRes.data)
        setBrandName(brandingRes.data.brandName || '')
        setSupportEmail(brandingRes.data.supportEmail || '')
        setWebsiteUrl(brandingRes.data.websiteUrl || '')
        setPrimaryColor(brandingRes.data.primaryColor || '#ff6c2f')
        setLogoUrl(brandingRes.data.logoUrl || '')
      }

      const templatesRes = await communicationApi.listEmailTemplates()
      if (templatesRes.success && templatesRes.data) {
        setTemplates(templatesRes.data.items)
      }
    } catch (err: any) {
      console.error('Failed to load communication config:', err)
      setError(err?.message || 'Access Denied: Missing permissions to query communication properties.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await communicationApi.updateEmailBranding({
        brandName,
        supportEmail,
        websiteUrl,
        primaryColor,
        logoUrl,
      })
      if (res.success && res.data) {
        adminToast.success('Email branding settings successfully updated.', 'The email branding configuration was saved successfully.')
        setBranding(res.data)
      }
    } catch (err: any) {
      console.error('Branding update failed:', err)
      adminToast.error('Failed to update email branding.', getAdminErrorMessage(err, 'Please review the settings and try again.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenTestModal = (templateId: string, templateKey: string) => {
    setTestTemplateId(templateId)
    setTestTemplateKey(templateKey)
    setTestEmail(currentAdminEmail || '')
    setShowTestModal(true)
  }

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testTemplateId) return
    setActionLoading(true)
    try {
      const res = await communicationApi.testEmailTemplate(testTemplateId, testEmail, {
        username: 'TestOperator',
        activationLink: 'https://wpa.local/verify',
        resetLink: 'https://wpa.local/reset',
        otpCode: '123456',
        ipAddress: '127.0.0.1',
      })
      if (res.success) {
        adminToast.success('Test email sent successfully.', res.message || `Test email dispatched to ${testEmail}`)
        setShowTestModal(false)
      }
    } catch (err: any) {
      console.error('Test send failed:', err)
      adminToast.error('Failed to send test email.', getAdminErrorMessage(err, 'Please try again.'))
    } finally {
      setActionLoading(false)
    }
  }

  const currentAdminEmail = branding?.supportEmail || ''

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
          <h4 className="fw-bold text-dark mb-1">Email System Configs</h4>
          <p className="text-muted mb-0 fs-13">Configure system mailers, customise branding variables, and preview email templates.</p>
        </div>
      </div>

      <Row>
        {/* PROVIDERS CARD */}
        <Col lg={7} className="mb-4">
          <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Mail SMTP Providers</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4 mt-2">
              {providers.length === 0 ? (
                <EmptyState message="No email gateway providers registered in backend." icon="solar:server-bold-duotone" />
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
                      <StatusBadge status={prov.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* TEMPLATES LIST */}
          <Card className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold text-dark mb-0">System Email Templates</h5>
              <span className="text-muted fs-12">Granular notifications dispatched for identity events.</span>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {templates.length === 0 ? (
                <EmptyState message="No email templates found in auth schema." icon="solar:letter-bold-duotone" />
              ) : (
                <div className="table-responsive">
                  <Table className="align-middle mb-0" hover>
                    <thead className="table-light">
                      <tr>
                        <th>Template Key</th>
                        <th>Subject Heading</th>
                        <th className="text-end px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates.map((tpl) => (
                        <tr key={tpl.id}>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold text-dark fs-14">{tpl.name}</span>
                              <span className="text-muted fs-11 font-monospace">Key: {tpl.key}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-secondary fs-13 text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                              {tpl.subject}
                            </span>
                          </td>
                          <td className="text-end px-4">
                            <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => handleOpenTestModal(tpl.id, tpl.key)}>
                              Test Dispatch
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* BRANDING CONFIG FORM */}
        <Col lg={5} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold text-dark mb-0">Email Branding Layout</h5>
              <span className="text-muted fs-12">HTML email layout designs configurations.</span>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <Form onSubmit={handleUpdateBranding}>
                <Form.Group className="mb-3">
                  <Form.Label>Sender Brand Name</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Support Email</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Website URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Primary Color Hex</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="color"
                      className="form-control-color"
                      style={{ width: '48px', height: '38px', padding: '2px' }}
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                    <Form.Control
                      type="text"
                      maxLength={7}
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Logo Image URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://company.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100" disabled={actionLoading}>
                  {actionLoading ? 'Saving Configurations...' : 'Save Branding Changes'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* DISPATCH TEST EMAIL MODAL */}
      <Modal show={showTestModal} onHide={() => setShowTestModal(false)} centered>
        <Form onSubmit={handleSendTestEmail}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Send Test Template</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="fs-13 text-secondary mb-3">
              Trigger a test rendering and transmission for the email template <strong>{testTemplateKey}</strong>.
            </p>
            <Form.Group className="mb-3">
              <Form.Label>Recipient Email Address</Form.Label>
              <Form.Control
                type="email"
                required
                placeholder="recipient@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowTestModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Dispatching...' : 'Send Test'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
