'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, Col, Form, Modal, Row, Spinner } from 'react-bootstrap'
import { emailApi, type EmailTemplate } from './emailSettingsApi'

interface TemplatesTabProps {
  clientId: string | null
  locale: 'en' | 'bn'
}

const EMPTY_TEMPLATE: EmailTemplate = {
  id: '',
  key: '',
  name: '',
  subject: '',
  preheader: '',
  locale: 'en',
  active: true,
  htmlBody: '',
  textBody: '',
  variables: [],
}

export default function TemplatesTab({ clientId, locale }: TemplatesTabProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [busyAction, setBusyAction] = useState<'save' | 'validate' | 'reset' | 'rollback' | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await emailApi.templates(clientId, locale)
        const list = response.data?.templates || response.data?.items || []
        setTemplates(list)
        setAvailable(response.available)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId, locale])

  const openEditor = (template: EmailTemplate) => {
    setSelected(template)
    setShowModal(true)
  }

  const activeTemplate = useMemo(() => selected || EMPTY_TEMPLATE, [selected])

  const runAction = async (kind: 'save' | 'validate' | 'reset' | 'rollback') => {
    if (!selected) return
    setBusyAction(kind)
    setNotice(null)
    try {
      let result: any
      if (kind === 'save') result = await emailApi.saveTemplate({ ...selected, clientId: clientId || 'global', locale })
      if (kind === 'validate') result = await emailApi.validateTemplate({ templateId: selected.id, clientId: clientId || 'global', locale })
      if (kind === 'reset') result = await emailApi.resetTemplate({ templateId: selected.id, clientId: clientId || 'global', locale })
      if (kind === 'rollback') result = await emailApi.rollbackTemplate({ templateId: selected.id, clientId: clientId || 'global', locale })

      setNotice(result.available ? `${kind[0].toUpperCase()}${kind.slice(1)} completed successfully.` : `Template ${kind} endpoint is unavailable.`)
    } catch (error: any) {
      setNotice(error?.message || `Template ${kind} failed.`)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardBody className="p-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <h4 className="mb-1">Templates</h4>
            <p className="text-muted mb-0">Client-aware templates for {locale === 'bn' ? 'Bangla' : 'English'} emails.</p>
          </div>
          <Button onClick={() => openEditor(EMPTY_TEMPLATE)}>New template</Button>
        </div>

        {notice && <Alert variant="info">{notice}</Alert>}
        {!loading && !available && <Alert variant="warning">Template endpoints are unavailable. Listing the editor shell only.</Alert>}
        {loading ? (
          <div className="py-5 text-center text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="alert alert-soft-secondary mb-0">No templates were returned by the API.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-centered table-hover mb-0">
              <thead className="bg-light bg-opacity-50">
                <tr>
                  <th>Key</th>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Locale</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="fw-semibold text-dark">{template.key}</td>
                    <td>{template.name}</td>
                    <td className="text-muted">{template.subject || 'Unavailable'}</td>
                    <td><Badge bg="secondary">{template.locale || locale}</Badge></td>
                    <td className="text-muted">{template.clientName || (clientId || 'Global default')}</td>
                    <td><Badge bg={template.active ? 'success' : 'secondary'}>{template.active ? 'active' : 'inactive'}</Badge></td>
                    <td className="text-muted">{template.updatedAt ? new Date(template.updatedAt).toLocaleString() : 'Unavailable'}</td>
                    <td className="text-end">
                      <Button size="sm" variant="light" onClick={() => openEditor(template)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
          <Modal.Header closeButton>
            <Modal.Title>Edit template</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}><Form.Label className="fw-semibold">Key</Form.Label><Form.Control value={activeTemplate.key} onChange={(e) => setSelected((current) => ({ ...activeTemplate, key: e.target.value }))} /></Col>
              <Col md={6}><Form.Label className="fw-semibold">Name</Form.Label><Form.Control value={activeTemplate.name} onChange={(e) => setSelected((current) => ({ ...activeTemplate, name: e.target.value }))} /></Col>
              <Col md={12}><Form.Label className="fw-semibold">Subject</Form.Label><Form.Control value={activeTemplate.subject || ''} onChange={(e) => setSelected((current) => ({ ...activeTemplate, subject: e.target.value }))} /></Col>
              <Col md={12}><Form.Label className="fw-semibold">Preheader</Form.Label><Form.Control value={activeTemplate.preheader || ''} onChange={(e) => setSelected((current) => ({ ...activeTemplate, preheader: e.target.value }))} /></Col>
              <Col md={12}><Form.Label className="fw-semibold">HTML body</Form.Label><Form.Control as="textarea" rows={8} value={activeTemplate.htmlBody || ''} onChange={(e) => setSelected((current) => ({ ...activeTemplate, htmlBody: e.target.value }))} /></Col>
              <Col md={12}><Form.Label className="fw-semibold">Text body</Form.Label><Form.Control as="textarea" rows={5} value={activeTemplate.textBody || ''} onChange={(e) => setSelected((current) => ({ ...activeTemplate, textBody: e.target.value }))} /></Col>
              <Col md={12}>
                <div className="d-flex flex-wrap gap-2">
                  {(activeTemplate.variables || ['first_name', 'company_name', 'action_url']).map((variable) => (
                    <Badge key={variable} bg="primary-subtle" text="primary">{`{{${variable}}}`}</Badge>
                  ))}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <div className="d-flex gap-2 flex-wrap">
              <Button variant="light" onClick={() => runAction('validate')} disabled={busyAction !== null}>{busyAction === 'validate' ? 'Validating...' : 'Validate'}</Button>
              <Button variant="light" onClick={() => runAction('reset')} disabled={busyAction !== null}>{busyAction === 'reset' ? 'Resetting...' : 'Reset to default'}</Button>
              <Button variant="light" onClick={() => runAction('rollback')} disabled={busyAction !== null}>{busyAction === 'rollback' ? 'Rolling back...' : 'Rollback version'}</Button>
            </div>
            <Button onClick={() => runAction('save')} disabled={busyAction !== null}>{busyAction === 'save' ? 'Saving...' : 'Save template'}</Button>
          </Modal.Footer>
        </Modal>
      </CardBody>
    </Card>
  )
}
