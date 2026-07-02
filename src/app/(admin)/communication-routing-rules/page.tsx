'use client'

// Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// admin UI for app-aware communication routing rules.

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Button, Form, Modal, Spinner, Badge, Alert } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { communicationApi, CreateRoutingRuleInput } from '@/features/communication/api'
import { RoutingRule, CommProvider } from '@/features/communication/types'
import { applicationsApi } from '@/features/applications/api'
import { ClientApplication } from '@/features/applications/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'

const PURPOSES = ['OTP', 'AUTH', 'PASSWORD_RESET', 'TRANSACTIONAL', 'ALERT']

const emptyForm: CreateRoutingRuleInput = {
  appId: null,
  channel: 'EMAIL',
  countryCode: null,
  purpose: 'OTP',
  providerId: null,
  fallbackProviderIds: [],
  priority: 100,
  enabled: true,
  fallbackEnabled: true,
  environment: null,
  isActive: true,
}

export default function CommunicationRoutingRulesPage() {
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [providers, setProviders] = useState<CommProvider[]>([])
  const [apps, setApps] = useState<ClientApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null)
  const [form, setForm] = useState<CreateRoutingRuleInput>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setPageError(null)
    try {
      const [rulesRes, providersRes, appsRes] = await Promise.all([
        communicationApi.listRoutingRules(),
        communicationApi.listProviders(),
        applicationsApi.listClients({ limit: 100 }),
      ])
      if (rulesRes.success) setRules(rulesRes.data.items)
      if (providersRes.success) setProviders(providersRes.data.items)
      if (appsRes.success) setApps(appsRes.items)
    } catch (error: any) {
      console.error('Failed to load routing rules:', error)
      if (error instanceof ApiError) {
        setPageError({ message: error.status === 403 ? 'You do not have permission to view routing rules.' : error.message, status: error.status })
      } else {
        setPageError({ message: 'Unable to load routing rules.' })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingRule(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (rule: RoutingRule) => {
    setEditingRule(rule)
    setForm({
      appId: rule.appId ?? null,
      channel: rule.channel,
      countryCode: rule.countryCode ?? null,
      purpose: rule.purpose,
      providerId: rule.providerId ?? null,
      fallbackProviderIds: rule.fallbackProviderIds ?? [],
      priority: rule.priority,
      enabled: rule.enabled,
      fallbackEnabled: rule.fallbackEnabled,
      environment: rule.environment ?? null,
      isActive: rule.isActive,
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingRule) {
        await communicationApi.updateRoutingRule(editingRule.id, form)
        toast.success('Routing rule updated.')
      } else {
        await communicationApi.createRoutingRule(form)
        toast.success('Routing rule created.')
      }
      setShowModal(false)
      load()
    } catch (error: any) {
      console.error('Failed to save routing rule:', error)
      toast.error(error?.message || 'Failed to save routing rule.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rule: RoutingRule) => {
    if (!window.confirm('Delete this routing rule?')) return
    try {
      await communicationApi.deleteRoutingRule(rule.id)
      toast.success('Routing rule deleted.')
      load()
    } catch (error: any) {
      console.error('Failed to delete routing rule:', error)
      toast.error(error?.message || 'Failed to delete routing rule.')
    }
  }

  const channelProviders = providers.filter((p) => p.type === form.channel)

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Routing Rules</h4>
          <p className="text-muted mb-0 fs-13">App + country + channel + purpose based provider selection, with fallback chains.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <IconifyIcon icon="solar:add-circle-bold-duotone" className="me-1 align-middle" />
          New Rule
        </Button>
      </div>

      {pageError ? (
        <ApiErrorState message={pageError.message} status={pageError.status} onRetry={load} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : rules.length === 0 ? (
              <EmptyState message="No routing rules configured yet — all sends use the general eligible-provider pool." icon="solar:routing-2-bold-duotone" />
            ) : (
              <Table hover responsive className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4">App</th>
                    <th>Country</th>
                    <th>Channel</th>
                    <th>Purpose</th>
                    <th>Environment</th>
                    <th>Primary Provider</th>
                    <th>Fallback</th>
                    <th>Priority</th>
                    <th>Enabled</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className={!rule.enabled ? 'table-light-danger' : ''}>
                      <td className="px-4">
                        <span className="fw-semibold fs-13">{rule.app?.name || 'All Apps (Default)'}</span>
                      </td>
                      <td>
                        <span className="text-secondary fs-13">{rule.countryCode || 'Any'}</span>
                      </td>
                      <td>
                        <Badge bg="soft-secondary" className="text-secondary">
                          {rule.channel}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-secondary fs-13">{rule.purpose}</span>
                      </td>
                      <td>
                        <span className="text-secondary fs-13">{rule.environment || 'Any'}</span>
                      </td>
                      <td>
                        <span className="text-secondary fs-13">{rule.provider?.name || '—'}</span>
                      </td>
                      <td>
                        <span className="text-secondary fs-12">
                          {rule.fallbackEnabled ? `${(rule.fallbackProviderIds || []).length} + international` : 'Explicit only'}
                        </span>
                      </td>
                      <td>{rule.priority}</td>
                      <td>
                        {rule.enabled ? (
                          <Badge bg="soft-success" className="text-success">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge bg="soft-danger" className="text-danger">
                            Disabled
                          </Badge>
                        )}
                      </td>
                      <td className="text-end px-4">
                        <div className="d-flex justify-content-end gap-1">
                          <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => openEdit(rule)}>
                            Edit
                          </Button>
                          <span className="text-muted">|</span>
                          <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDelete(rule)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-18">{editingRule ? 'Edit Routing Rule' : 'New Routing Rule'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Application (leave blank for system-wide default)</Form.Label>
                <Form.Select value={form.appId || ''} onChange={(e) => setForm({ ...form, appId: e.target.value || null })}>
                  <option value="">All Apps (system default)</option>
                  {apps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Country Code (leave blank for any)</Form.Label>
                <Form.Control placeholder="e.g. 880" value={form.countryCode || ''} onChange={(e) => setForm({ ...form, countryCode: e.target.value || null })} />
              </Col>
              <Col md={4}>
                <Form.Label>Channel</Form.Label>
                <Form.Select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as 'SMS' | 'EMAIL', providerId: null })}>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Purpose</Form.Label>
                <Form.Select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Environment</Form.Label>
                <Form.Select value={form.environment || ''} onChange={(e) => setForm({ ...form, environment: (e.target.value || null) as any })}>
                  <option value="">Any</option>
                  <option value="SANDBOX">Sandbox</option>
                  <option value="LIVE">Live</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Primary Provider</Form.Label>
                <Form.Select value={form.providerId || ''} onChange={(e) => setForm({ ...form, providerId: e.target.value || null })}>
                  <option value="">None (use general pool)</option>
                  {channelProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isGlobal ? '(Global)' : p.countryCode ? `(${p.countryCode})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Fallback Providers (in order)</Form.Label>
                <Form.Select
                  multiple
                  value={form.fallbackProviderIds || []}
                  onChange={(e) => setForm({ ...form, fallbackProviderIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}
                >
                  {channelProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
                <div className="fs-11 text-muted mt-1">Ctrl/Cmd-click to select multiple, in priority order.</div>
              </Col>
              <Col md={4}>
                <Form.Label>Priority</Form.Label>
                <Form.Control type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
              </Col>
              <Col md={4} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  id="rule-enabled"
                  label="Enabled"
                  checked={!!form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                />
              </Col>
              <Col md={4} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  id="rule-fallback-enabled"
                  label="Allow international fallback"
                  checked={!!form.fallbackEnabled}
                  onChange={(e) => setForm({ ...form, fallbackEnabled: e.target.checked })}
                />
              </Col>
              {!form.enabled && (
                <Col md={12}>
                  <Alert variant="danger" className="fs-13 mb-0">
                    <IconifyIcon icon="solar:danger-triangle-bold-duotone" className="me-1 align-middle" />
                    <strong>Disabling this rule blocks the {form.channel} channel entirely</strong> for{' '}
                    {form.appId ? apps.find((a) => a.id === form.appId)?.name || 'this app' : 'all apps'} /{' '}
                    {form.countryCode || 'all countries'} / {form.purpose}. No fallback provider will be tried — requests will fail
                    immediately with a <code>CHANNEL_DISABLED</code> error.
                  </Alert>
                </Col>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant={form.enabled ? 'primary' : 'danger'} type="submit" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" className="me-1" /> : null}
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
