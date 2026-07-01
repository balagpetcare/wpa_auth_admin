'use client'
import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Form, Badge, Spinner } from 'react-bootstrap'
import PageTitle from '@/components/PageTItle'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { useNotificationContext } from '@/context/useNotificationContext'

const SettingsPage = () => {
  const { accessToken } = useAuth()
  const { showNotification } = useNotificationContext()
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false

  useEffect(() => {
    const fetchSettings = async () => {
      if (!accessToken) return
      try {
        const res: any = await apiClient(accessToken).get('/admin/settings'
        setSettings(res.settings
      } catch (err) {
        setError(true
        showNotification({ message: 'Failed to load settings', variant: 'danger' }
      } finally {
        setLoading(false
      }
    }
    fetchSettings()
  }, [accessToken, showNotification]

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  }

  if (error || !settings) {
    return <div className="alert alert-warning">Failed to load platform settings.</div>
  }

  return ()
    <>
      <PageTitle title="System Settings" />
      <Row>
        <Col xl={6}>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle as="h5">General</CardTitle>
            </CardHeader>
            <CardBody>
              <Form>
                <div className="mb-3">
                  <Form.Label>Platform Name</Form.Label>
                  <Form.Control type="text" value={settings.platformName || ''} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Public Auth Domain</Form.Label>
                  <Form.Control type="text" value={settings.publicAuthDomain || ''} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Admin Panel URL</Form.Label>
                  <Form.Control type="text" value={settings.adminPanelUrl || ''} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Support Email</Form.Label>
                  <Form.Control type="email" value={settings.supportEmail || ''} readOnly />
                </div>
              </Form>
            </CardBody>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle as="h5">OAuth / OIDC</CardTitle>
            </CardHeader>
            <CardBody>
              <Form>
                <div className="mb-3">
                  <Form.Label>Issuer URL</Form.Label>
                  <Form.Control type="text" value={settings.issuerUrl || ''} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Authorization Code TTL (seconds)</Form.Label>
                  <Form.Control type="number" value={settings.authorizationCodeTtl || ''} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Service Token TTL (seconds)</Form.Label>
                  <Form.Control type="number" value={settings.serviceTokenTtl || ''} readOnly />
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span>JWKS Mode</span>
                  <Badge bg="success">{settings.jwksMode || 'Unknown'}</Badge>
                </div>
              </Form>
            </CardBody>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle as="h5">Email / Notification</CardTitle>
            </CardHeader>
            <CardBody>
              <Form>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span>SMTP Status</span>
                  <Badge bg="secondary">{settings.smtpStatus || 'Unknown'}</Badge>
                </div>
                <div className="mb-3">
                  <Form.Label>Admin Alert Email</Form.Label>
                  <Form.Control type="email" placeholder="admin@wpa.local (Not Configured)" readOnly />
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle as="h5">Security</CardTitle>
            </CardHeader>
            <CardBody>
              <Form>
                <div className="mb-3">
                  <Form.Label>Access Token TTL (minutes)</Form.Label>
                  <Form.Control type="number" value={settings.accessTokenTtl || ''} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Refresh Token TTL (days)</Form.Label>
                  <Form.Control type="number" value={settings.refreshTokenTtl || ''} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Password Policy</Form.Label>
                  <Form.Control as="textarea" rows={2} value="Min 8 chars, 1 uppercase, 1 lowercase, 1 number" readOnly />
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span>Require MFA for Admins</span>
                  <Form.Check type="switch" id="mfa-switch" disabled />
                </div>
              </Form>
            </CardBody>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle as="h5">Session & Login</CardTitle>
            </CardHeader>
            <CardBody>
              <Form>
                <div className="mb-3">
                  <Form.Label>Global Session Lifetime (days)</Form.Label>
                  <Form.Control type="number" value={30} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Max Login Attempts</Form.Label>
                  <Form.Control type="number" value={5} readOnly />
                </div>
                <div className="mb-3">
                  <Form.Label>Lockout Duration (minutes)</Form.Label>
                  <Form.Control type="number" value={15} readOnly />
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span>Trust Proxy Header</span>
                  <Badge bg={settings.trustProxy ? 'success' : 'secondary'}>{settings.trustProxy ? 'Enabled' : 'Disabled'}</Badge>
                </div>
              </Form>
            </CardBody>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle as="h5">System</CardTitle>
            </CardHeader>
            <CardBody>
              <Form>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span>Environment</span>
                  <Badge bg="primary">{settings.environment || 'Unknown'}</Badge>
                </div>
                <div className="mb-3">
                  <Form.Label>API Base URL</Form.Label>
                  <Form.Control type="text" value={settings.apiBaseUrl || ''} readOnly />
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span>Database Connection</span>
                  <Badge bg="success">{settings.databaseStatus || 'Unknown'}</Badge>
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span>Redis Status</span>
                  <Badge bg="success">{settings.redisStatus || 'Unknown'}</Badge>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  
}

export default SettingsPage
