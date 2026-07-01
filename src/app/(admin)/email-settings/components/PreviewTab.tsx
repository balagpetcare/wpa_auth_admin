'use client'

import { useEffect, useState } from 'react'
import { Alert, Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
import { emailApi, type EmailTemplate } from './emailSettingsApi'

interface PreviewTabProps {
  clientId: string | null
  locale: 'en' | 'bn'
}

const SAMPLE_TEMPLATE = 'welcome'

export default function PreviewTab({ clientId, locale }: PreviewTabProps) {
  const [templateKey, setTemplateKey] = useState(SAMPLE_TEMPLATE)
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await emailApi.preview(clientId, locale, templateKey)
        const payload = response.data?.data ?? response.data ?? null
        setTemplate(payload?.template || payload || null)
        setAvailable(response.available)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId, locale, templateKey])

  return (
    <Card className="border-0 shadow-sm">
      <CardBody className="p-4">
        <Row className="g-4">
          <Col lg={4}>
            <h4 className="mb-3">Preview controls</h4>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Template key</Form.Label>
              <Form.Select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
                <option value="welcome">welcome</option>
                <option value="verify">verify</option>
                <option value="reset">reset</option>
                <option value="invite">invite</option>
                <option value="mfa">mfa</option>
                <option value="alert">alert</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Sample variables</Form.Label>
              <div className="border rounded-3 p-3 bg-light-subtle small text-muted">
                <div><strong>first_name:</strong> Jane</div>
                <div><strong>company_name:</strong> WPA</div>
                <div><strong>action_url:</strong> https://example.com/action</div>
                <div><strong>support_email:</strong> support@example.com</div>
              </div>
            </Form.Group>

            <div className="btn-group w-100">
              <button className={`btn btn-${mode === 'desktop' ? 'primary' : 'light'}`} onClick={() => setMode('desktop')} type="button">Desktop</button>
              <button className={`btn btn-${mode === 'mobile' ? 'primary' : 'light'}`} onClick={() => setMode('mobile')} type="button">Mobile</button>
            </div>
          </Col>

          <Col lg={8}>
            <h4 className="mb-3">Rendered preview</h4>
            {loading ? (
              <div className="py-5 text-center text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading preview...</div>
            ) : !available ? (
              <Alert variant="warning">Preview endpoint is unavailable. Showing preview shell only.</Alert>
            ) : (
              <div className={`border rounded-3 p-${mode === 'desktop' ? 4 : 3}`} style={{ maxWidth: mode === 'mobile' ? 420 : '100%', margin: '0 auto' }}>
                <div className="rounded-3 p-4" style={{ background: template?.headerColor || '#fff' }}>
                  <div className="fw-semibold">{template?.name || 'Template preview'}</div>
                  <div className="text-muted small">{template?.subject || 'Subject unavailable'}</div>
                </div>
                <div className="p-4 bg-body">
                  <div className="mb-3 text-muted small">
                    Client: {clientId || 'Global default'} | Locale: {locale === 'bn' ? 'Bangla' : 'English'}
                  </div>
                  <div className="border rounded-3 p-3 bg-light-subtle" dangerouslySetInnerHTML={{ __html: template?.htmlBody || '<p>Email preview is unavailable.</p>' }} />
                </div>
              </div>
            )}
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
