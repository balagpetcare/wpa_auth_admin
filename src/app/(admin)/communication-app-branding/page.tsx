'use client'

// Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// per-app email branding UI, backed by the already-existing
// GET/PATCH /admin/clients/:clientId/branding routes.

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Form, Button, Spinner, Alert, Badge } from 'react-bootstrap'
import { communicationApi } from '@/features/communication/api'
import { ClientBranding } from '@/features/communication/types'
import { applicationsApi } from '@/features/applications/api'
import { ClientApplication } from '@/features/applications/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'
import adminToast from '@/lib/adminToast'
import { getAdminErrorMessage } from '@/lib/adminErrorMessage'

const emptyForm: Partial<ClientBranding> = {
  logoUrl: '',
  logoAltText: '',
  brandColor: '',
  accentColor: '',
  senderName: '',
  senderEmail: '',
  replyTo: '',
  supportEmail: '',
  supportPhone: '',
  websiteUrl: '',
  privacyUrl: '',
  termsUrl: '',
  unsubscribeUrl: '',
  footerText: '',
  isActive: true,
}

export default function AppEmailBrandingPage() {
  const [apps, setApps] = useState<ClientApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [selectedAppId, setSelectedAppId] = useState('')
  const [form, setForm] = useState<Partial<ClientBranding>>(emptyForm)
  const [isCustom, setIsCustom] = useState(false)
  const [loadingBranding, setLoadingBranding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)

  useEffect(() => {
    const loadApps = async () => {
      setLoadingApps(true)
      try {
        const response = await applicationsApi.listClients({ limit: 100 })
        if (response.success) {
          setApps(response.items)
          if (response.items.length > 0) setSelectedAppId(response.items[0].id)
        }
      } catch (error: any) {
        console.error('Failed to load apps:', error)
        setPageError({ message: 'Unable to load connected apps.' })
      } finally {
        setLoadingApps(false)
      }
    }
    loadApps()
  }, [])

  useEffect(() => {
    if (!selectedAppId) return
    const loadBranding = async () => {
      setLoadingBranding(true)
      setPageError(null)
      try {
        const response = await communicationApi.getClientBranding(selectedAppId)
        if (response.success) {
          const data = response.data as any
          // Backend returns the ClientBranding row if customized, otherwise
          // the global EmailBrandingSetting row (or null) — a row with a
          // `clientId` field is the app-specific one.
          const custom = !!data?.clientId
          setIsCustom(custom)
          setForm(custom ? data : emptyForm)
        }
      } catch (error: any) {
        console.error('Failed to load app branding:', error)
        if (error instanceof ApiError) {
          setPageError({ message: error.status === 403 ? 'You do not have permission to view app branding.' : error.message, status: error.status })
        } else {
          setPageError({ message: 'Unable to load app branding.' })
        }
      } finally {
        setLoadingBranding(false)
      }
    }
    loadBranding()
  }, [selectedAppId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { id, clientId, ...payload } = form as any
      const response = await communicationApi.updateClientBranding(selectedAppId, payload)
      if (response.success) {
        adminToast.success('App branding saved successfully.', 'The branding profile was updated successfully.')
        setIsCustom(true)
        setForm(response.data)
      }
    } catch (error: any) {
      console.error('Failed to save app branding:', error)
      adminToast.error('Failed to save app branding.', getAdminErrorMessage(error, 'Please review the branding settings and try again.'))
    } finally {
      setSaving(false)
    }
  }

  const selectedApp = apps.find((a) => a.id === selectedAppId)

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">App Email Branding</h4>
        <p className="text-muted mb-0 fs-13">Per-app sender identity, colors, and footer — falls back to the global default when not customized.</p>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Form.Label className="fs-13">Application</Form.Label>
          {loadingApps ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <Form.Select style={{ maxWidth: 360 }} value={selectedAppId} onChange={(e) => setSelectedAppId(e.target.value)}>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </Form.Select>
          )}
        </Card.Body>
      </Card>

      {pageError ? (
        <ApiErrorState message={pageError.message} status={pageError.status} />
      ) : loadingBranding ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="mb-3">
              {isCustom ? (
                <Badge bg="soft-success" className="text-success">
                  <IconifyIcon icon="solar:check-circle-bold-duotone" className="me-1 align-middle" />
                  Using custom branding for {selectedApp?.name}
                </Badge>
              ) : (
                <Alert variant="info" className="fs-13 mb-0">
                  <IconifyIcon icon="solar:info-circle-bold-duotone" className="me-1 align-middle" />
                  {selectedApp?.name} is currently inheriting the global default branding. Saving below will create a custom
                  override for this app.
                </Alert>
              )}
            </div>

            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="fs-13">Sender Name</Form.Label>
                  <Form.Control value={form.senderName || ''} onChange={(e) => setForm({ ...form, senderName: e.target.value })} placeholder="Inherits global default" />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Sender Email</Form.Label>
                  <Form.Control type="email" value={form.senderEmail || ''} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} placeholder="Inherits global default" />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Reply-To</Form.Label>
                  <Form.Control type="email" value={form.replyTo || ''} onChange={(e) => setForm({ ...form, replyTo: e.target.value })} placeholder="Optional" />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Support Email</Form.Label>
                  <Form.Control type="email" value={form.supportEmail || ''} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Support Phone</Form.Label>
                  <Form.Control value={form.supportPhone || ''} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Logo URL</Form.Label>
                  <Form.Control value={form.logoUrl || ''} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Logo Alt Text</Form.Label>
                  <Form.Control value={form.logoAltText || ''} onChange={(e) => setForm({ ...form, logoAltText: e.target.value })} />
                </Col>
                <Col md={3}>
                  <Form.Label className="fs-13">Brand Color</Form.Label>
                  <Form.Control type="color" value={form.brandColor || '#0f3a7d'} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} />
                </Col>
                <Col md={3}>
                  <Form.Label className="fs-13">Accent Color</Form.Label>
                  <Form.Control type="color" value={form.accentColor || '#ff6c2f'} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Website URL</Form.Label>
                  <Form.Control value={form.websiteUrl || ''} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Privacy Policy URL</Form.Label>
                  <Form.Control value={form.privacyUrl || ''} onChange={(e) => setForm({ ...form, privacyUrl: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Terms URL</Form.Label>
                  <Form.Control value={form.termsUrl || ''} onChange={(e) => setForm({ ...form, termsUrl: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Unsubscribe URL</Form.Label>
                  <Form.Control value={form.unsubscribeUrl || ''} onChange={(e) => setForm({ ...form, unsubscribeUrl: e.target.value })} />
                </Col>
                <Col md={12}>
                  <Form.Label className="fs-13">Footer Text</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.footerText || ''} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
                </Col>
                <Col md={12}>
                  <Form.Check
                    type="switch"
                    id="branding-active"
                    label="Active (use this branding for outgoing email)"
                    checked={form.isActive !== false}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                </Col>
              </Row>
              <div className="mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                  Save Branding
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
