'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
import { emailApi } from './emailSettingsApi'

interface SendTestTabProps {
  clientId: string | null
  locale: 'en' | 'bn'
}

export default function SendTestTab({ clientId, locale }: SendTestTabProps) {
  const [recipient, setRecipient] = useState('')
  const [templateKey, setTemplateKey] = useState('welcome')
  const [senderInfo, setSenderInfo] = useState<{ senderName?: string; senderEmail?: string }>({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ kind: 'success' | 'warning' | 'danger'; text: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await emailApi.branding(clientId)
        const payload = response.data?.data ?? response.data ?? {}
        setSenderInfo({ senderName: payload.senderName, senderEmail: payload.senderEmail })
      } catch {
        setSenderInfo({})
      }
    }
    load()
  }, [clientId])

  const handleSend = async () => {
    if (!recipient) {
      setResult({ kind: 'danger', text: 'Please enter a recipient email.' })
      return
    }

    setSending(true)
    setResult(null)
    try {
      const response = await emailApi.sendTest({
        recipient,
        templateKey,
        clientId: clientId || 'global',
        locale,
      })
      setResult(response.available ? { kind: 'success', text: 'Test email request completed.' } : { kind: 'warning', text: 'Send test endpoint is unavailable.' })
    } catch (error: any) {
      setResult({ kind: 'danger', text: error?.message || 'Failed to send test email.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardBody className="p-4">
        <Row className="g-4">
          <Col lg={7}>
            <h4 className="mb-3">Send test email</h4>
            {result && <Alert variant={result.kind}>{result.text}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Recipient email</Form.Label>
              <Form.Control type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="recipient@example.com" />
            </Form.Group>
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
            <Button onClick={handleSend} disabled={sending}>
              {sending ? 'Sending...' : 'Send test email'}
            </Button>
          </Col>
          <Col lg={5}>
            <Card className="border-0 bg-light-subtle h-100">
              <CardBody>
                <h5 className="mb-3">Delivery summary</h5>
                <div className="small text-muted mb-2">Client: {clientId || 'Global default'}</div>
                <div className="small text-muted mb-2">Locale: {locale === 'bn' ? 'Bangla' : 'English'}</div>
                <div className="small text-muted mb-2">Sender name: {senderInfo.senderName || 'Unavailable'}</div>
                <div className="small text-muted mb-2">Sender email: {senderInfo.senderEmail || 'Unavailable'}</div>
                <div className="alert alert-soft-secondary mt-3 mb-0">
                  No raw tokens or secrets are shown. Delivery uses the existing backend send-test route when available.
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
