'use client'

// Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// per-app email template overrides. Backend already supports client-aware
// EmailTemplate CRUD (unique on key+locale+clientId) with versioning
// (EmailTemplateVersion) — this UI is intentionally a plain textarea editor
// per the task's own instruction not to overbuild a rich editor.

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Form, Button, Spinner, Badge, Table } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { communicationApi } from '@/features/communication/api'
import { EmailTemplate } from '@/features/communication/types'
import { applicationsApi } from '@/features/applications/api'
import { ClientApplication } from '@/features/applications/types'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'

export default function TemplateOverridesPage() {
  const [apps, setApps] = useState<ClientApplication[]>([])
  const [scope, setScope] = useState('global') // 'global' or an app id
  const [globalTemplates, setGlobalTemplates] = useState<EmailTemplate[]>([])
  const [appTemplates, setAppTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)
  const [formBody, setFormBody] = useState({ name: '', subject: '', htmlBody: '', textBody: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    applicationsApi
      .listClients({ limit: 100 })
      .then((r) => r.success && setApps(r.items))
      .catch((e) => console.error('Failed to load apps:', e))
  }, [])

  const load = async () => {
    setLoading(true)
    setPageError(null)
    try {
      const [globalRes, scopedRes] = await Promise.all([
        communicationApi.listEmailTemplates('global'),
        scope !== 'global' ? communicationApi.listEmailTemplates(scope) : Promise.resolve({ success: true, data: { items: [] } }),
      ])
      if (globalRes.success) setGlobalTemplates(globalRes.data.items)
      if (scopedRes.success) setAppTemplates(scopedRes.data.items)
    } catch (error: any) {
      console.error('Failed to load templates:', error)
      if (error instanceof ApiError) {
        setPageError({ message: error.status === 403 ? 'You do not have permission to view templates.' : error.message, status: error.status })
      } else {
        setPageError({ message: 'Unable to load templates.' })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  const openEditor = async (key: string) => {
    setEditingKey(key)
    const override = appTemplates.find((t) => t.key === key)
    const globalTpl = globalTemplates.find((t) => t.key === key)
    try {
      const source = override || globalTpl
      if (!source) return
      const detail = await communicationApi.getEmailTemplate(source.id)
      if (detail.success) {
        setEditingTemplate(detail.data)
        setFormBody({
          name: detail.data.name,
          subject: detail.data.subject,
          htmlBody: detail.data.htmlBody,
          textBody: detail.data.textBody || '',
        })
      }
    } catch (error) {
      console.error('Failed to load template detail:', error)
      toast.error('Failed to load template content.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingKey) return
    setSaving(true)
    try {
      if (scope === 'global') {
        // Editing the global default row directly — it always already exists.
        const globalTpl = globalTemplates.find((t) => t.key === editingKey)
        if (globalTpl) {
          await communicationApi.updateEmailTemplate(globalTpl.id, formBody)
          toast.success('Global template updated.')
        }
      } else {
        const existingOverride = appTemplates.find((t) => t.key === editingKey)
        if (existingOverride) {
          await communicationApi.updateEmailTemplate(existingOverride.id, formBody)
          toast.success('Template override updated.')
        } else {
          await communicationApi.createEmailTemplateOverride({
            key: editingKey,
            clientId: scope,
            locale: 'en',
            ...formBody,
          })
          toast.success('Template override created.')
        }
      }
      setEditingKey(null)
      setEditingTemplate(null)
      load()
    } catch (error: any) {
      console.error('Failed to save template override:', error)
      toast.error(error?.message || 'Failed to save template override.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Template Overrides</h4>
        <p className="text-muted mb-0 fs-13">Per-app email content, falling back to the global default template when no override exists.</p>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Form.Label className="fs-13">Scope</Form.Label>
          <Form.Select style={{ maxWidth: 360 }} value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="global">Global Default</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name} (override)
              </option>
            ))}
          </Form.Select>
        </Card.Body>
      </Card>

      {pageError ? (
        <ApiErrorState message={pageError.message} status={pageError.status} onRetry={load} />
      ) : loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : globalTemplates.length === 0 ? (
        <EmptyState message="No templates found." icon="solar:document-add-bold-duotone" />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4">Key</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th className="text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {globalTemplates.map((tpl) => {
                  const override = scope !== 'global' && appTemplates.find((t) => t.key === tpl.key)
                  return (
                    <tr key={tpl.key}>
                      <td className="px-4 fs-13 fw-semibold">{tpl.key}</td>
                      <td className="fs-13">{(override || tpl).subject}</td>
                      <td>
                        {scope === 'global' ? (
                          <Badge bg="soft-secondary" className="text-secondary">
                            Global Default
                          </Badge>
                        ) : override ? (
                          <Badge bg="soft-success" className="text-success">
                            Custom Override
                          </Badge>
                        ) : (
                          <Badge bg="soft-secondary" className="text-secondary">
                            Inherits Global
                          </Badge>
                        )}
                      </td>
                      <td className="text-end px-4">
                        <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => openEditor(tpl.key)}>
                          {scope === 'global' ? 'View / Edit' : override ? 'Edit Override' : 'Create Override'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {editingKey && (
        <Card className="border-0 shadow-sm mt-3">
          <Card.Body>
            <h6 className="fw-bold mb-3">
              Editing: {editingKey} {scope !== 'global' && `(${apps.find((a) => a.id === scope)?.name || scope})`}
            </h6>
            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="fs-13">Name</Form.Label>
                  <Form.Control required value={formBody.name} onChange={(e) => setFormBody({ ...formBody, name: e.target.value })} />
                </Col>
                <Col md={6}>
                  <Form.Label className="fs-13">Subject</Form.Label>
                  <Form.Control required value={formBody.subject} onChange={(e) => setFormBody({ ...formBody, subject: e.target.value })} />
                </Col>
                <Col md={12}>
                  <Form.Label className="fs-13">HTML Body</Form.Label>
                  <Form.Control as="textarea" rows={10} className="font-monospace fs-12" required value={formBody.htmlBody} onChange={(e) => setFormBody({ ...formBody, htmlBody: e.target.value })} />
                </Col>
                <Col md={12}>
                  <Form.Label className="fs-13">Text Body (optional)</Form.Label>
                  <Form.Control as="textarea" rows={5} className="font-monospace fs-12" value={formBody.textBody} onChange={(e) => setFormBody({ ...formBody, textBody: e.target.value })} />
                </Col>
              </Row>
              <div className="d-flex gap-2 mt-3">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                  Save
                </Button>
                <Button
                  variant="light"
                  onClick={() => {
                    setEditingKey(null)
                    setEditingTemplate(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
