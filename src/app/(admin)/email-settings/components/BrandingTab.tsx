'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
import { emailApi } from './emailSettingsApi'

interface BrandingTabProps {
  clientId: string | null
  locale: 'en' | 'bn'
}

type BrandingForm = {
  brandName: string
  logoUrl: string
  senderName: string
  senderEmail: string
  primaryColor: string
  headerColor: string
  footerColor: string
  websiteUrl: string
  supportEmail: string
  supportPhone: string
  privacyUrl: string
  termsUrl: string
  helpUrl: string
  contactUrl: string
  facebookUrl: string
  xUrl: string
  linkedinUrl: string
  footerText: string
  address: string
  legalDisclaimer: string
}

const DEFAULT_FORM: BrandingForm = {
  brandName: 'WPA Central Auth',
  logoUrl: '',
  senderName: 'WPA Central Auth',
  senderEmail: 'no-reply@example.com',
  primaryColor: '#0f172a',
  headerColor: '#ffffff',
  footerColor: '#f8fafc',
  websiteUrl: 'https://wpa.example.com',
  supportEmail: 'support@example.com',
  supportPhone: '+880 1XXX-XXXXXX',
  privacyUrl: '#',
  termsUrl: '#',
  helpUrl: '#',
  contactUrl: '#',
  facebookUrl: '#',
  xUrl: '#',
  linkedinUrl: '#',
  footerText: 'Powered by WPA Central Auth',
  address: 'Dhaka, Bangladesh',
  legalDisclaimer: 'Do not share this message. Sensitive account notices may be included.',
}

export default function BrandingTab({ clientId, locale }: BrandingTabProps) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'danger' | 'warning'; text: string } | null>(null)
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await emailApi.branding(clientId)
        const payload = response.data?.data ?? response.data ?? {}
        setAvailable(response.available)
        setForm((current) => ({
          ...current,
          brandName: payload.brandName || current.brandName,
          logoUrl: payload.logoUrl || current.logoUrl,
          senderName: payload.senderName || current.senderName,
          senderEmail: payload.senderEmail || current.senderEmail,
          primaryColor: payload.primaryColor || current.primaryColor,
          headerColor: payload.headerColor || current.headerColor,
          footerColor: payload.footerColor || current.footerColor,
          websiteUrl: payload.websiteUrl || current.websiteUrl,
          supportEmail: payload.supportEmail || current.supportEmail,
          supportPhone: payload.supportPhone || current.supportPhone,
          privacyUrl: payload.privacyUrl || current.privacyUrl,
          termsUrl: payload.termsUrl || current.termsUrl,
          helpUrl: payload.helpUrl || current.helpUrl,
          contactUrl: payload.contactUrl || current.contactUrl,
          facebookUrl: payload.facebookUrl || current.facebookUrl,
          xUrl: payload.xUrl || current.xUrl,
          linkedinUrl: payload.linkedinUrl || current.linkedinUrl,
          footerText: payload.footerText || current.footerText,
          address: payload.address || current.address,
          legalDisclaimer: payload.legalDisclaimer || current.legalDisclaimer,
        }))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId, locale])

  const logoPreview = useMemo(
    () =>
      form.logoUrl ? (
        <img src={form.logoUrl} alt="Logo preview" style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} />
      ) : (
        <div className="text-muted">No logo URL configured</div>
      ),
    [form.logoUrl],
  )

  const handleSave = async () => {
    setSaving(true)
    setNotice(null)
    try {
      const result = await emailApi.saveBranding(clientId, { ...form, locale })
      if (result.available) {
        setNotice({ kind: 'success', text: 'Branding saved successfully.' })
      } else {
        setNotice({ kind: 'warning', text: 'Branding endpoint is unavailable. Changes were not saved.' })
      }
    } catch (error: any) {
      setNotice({ kind: 'danger', text: error?.message || 'Failed to save branding.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardBody className="p-0">
        <Row className="g-4">
          <Col xl={7}>
            {loading ? (
              <div className="p-4 text-muted d-flex align-items-center gap-2"><Spinner animation="border" size="sm" />Loading branding...</div>
            ) : (
              <div className="p-4">
                {notice && <Alert variant={notice.kind} className="mb-4">{notice.text}</Alert>}
                {!available && <Alert variant="warning" className="mb-4">Branding API not available yet. You can still review the intended settings layout.</Alert>}
                <Row className="g-3">
                  {[
                    ['brandName', 'Brand name'],
                    ['logoUrl', 'Logo URL'],
                    ['senderName', 'Sender name'],
                    ['senderEmail', 'Sender email'],
                    ['primaryColor', 'Primary color'],
                    ['headerColor', 'Header color'],
                    ['footerColor', 'Footer color'],
                    ['websiteUrl', 'Website URL'],
                    ['supportEmail', 'Support email'],
                    ['supportPhone', 'Support phone'],
                    ['privacyUrl', 'Privacy link'],
                    ['termsUrl', 'Terms link'],
                    ['helpUrl', 'Help link'],
                    ['contactUrl', 'Contact link'],
                    ['facebookUrl', 'Facebook link'],
                    ['xUrl', 'X link'],
                    ['linkedinUrl', 'LinkedIn link'],
                  ].map(([key, label]) => (
                    <Col md={key.includes('Url') || key.includes('Phone') || key.includes('Email') ? 6 : 6} key={key}>
                      <Form.Label className="fw-semibold">{label}</Form.Label>
                      <Form.Control
                        value={(form as any)[key]}
                        onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                        type={key.includes('Email') ? 'email' : 'text'}
                      />
                    </Col>
                  ))}
                  <Col xs={12}>
                    <Form.Label className="fw-semibold">Footer text</Form.Label>
                    <Form.Control value={form.footerText} onChange={(e) => setForm((current) => ({ ...current, footerText: e.target.value }))} />
                  </Col>
                  <Col xs={12}>
                    <Form.Label className="fw-semibold">Address</Form.Label>
                    <Form.Control value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} />
                  </Col>
                  <Col xs={12}>
                    <Form.Label className="fw-semibold">Legal disclaimer</Form.Label>
                    <Form.Control as="textarea" rows={3} value={form.legalDisclaimer} onChange={(e) => setForm((current) => ({ ...current, legalDisclaimer: e.target.value }))} />
                  </Col>
                </Row>
                <div className="d-flex align-items-center justify-content-between mt-4">
                  <div className="small text-muted">Locale-aware branding for {locale === 'bn' ? 'Bangla' : 'English'} emails.</div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save branding'}
                  </Button>
                </div>
              </div>
            )}
          </Col>
          <Col xl={5} className="border-start">
            <div className="p-4">
              <h5 className="mb-3">Logo preview</h5>
              <div className="border rounded-3 p-4 bg-light-subtle mb-4 text-center">{logoPreview}</div>
              <Card className="border-0 bg-light-subtle">
                <CardBody>
                  <div className="fw-semibold mb-1">Current summary</div>
                  <div className="small text-muted">Client: {clientId || 'Global default'}</div>
                  <div className="small text-muted">Sender: {form.senderName} &lt;{form.senderEmail}&gt;</div>
                  <div className="small text-muted">Website: {form.websiteUrl}</div>
                </CardBody>
              </Card>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
