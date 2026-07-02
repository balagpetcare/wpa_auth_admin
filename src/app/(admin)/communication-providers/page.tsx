'use client'

// Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// admin UI for the communication provider backend (already fully built:
// CRUD, encrypted credentials, activate/deactivate, test-send, health).
// Secret fields are always write-only — the backend never returns
// encryptedSecrets or raw values, only maskedSecretsPreview.

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Button, Form, Modal, Spinner, Badge, Tabs, Tab } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { communicationApi, CreateProviderInput, CreateCredentialInput } from '@/features/communication/api'
import { CommProvider } from '@/features/communication/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatusBadge, EmptyState } from '@/components/dashboard/DashboardComponents'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'

const PURPOSES = ['OTP', 'AUTH', 'PASSWORD_RESET', 'TRANSACTIONAL', 'ALERT']

const emptyProviderForm: CreateProviderInput = {
  name: '',
  code: '',
  type: 'EMAIL',
  status: 'INACTIVE',
  environment: 'SANDBOX',
  isGlobal: false,
  countryCode: null,
  priority: 100,
  supportedPurposes: ['OTP'],
  dailyLimit: null,
  monthlyLimit: null,
  rateLimitPerMinute: null,
}

export default function CommunicationProvidersPage() {
  const [providers, setProviders] = useState<CommProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SMS' | 'EMAIL'>('ALL')

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<CommProvider | null>(null)
  const [form, setForm] = useState<CreateProviderInput>(emptyProviderForm)
  const [saving, setSaving] = useState(false)

  const [detailProvider, setDetailProvider] = useState<CommProvider | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [credentialForm, setCredentialForm] = useState<CreateCredentialInput>({ secrets: {} })
  const [secretsText, setSecretsText] = useState('')
  const [savingCredential, setSavingCredential] = useState(false)
  const [testRecipient, setTestRecipient] = useState('')
  const [testing, setTesting] = useState(false)

  const loadProviders = async () => {
    setLoading(true)
    setPageError(null)
    try {
      const response = await communicationApi.listProviders(typeFilter !== 'ALL' ? { type: typeFilter } : undefined)
      if (response.success) setProviders(response.data.items)
    } catch (error: any) {
      console.error('Failed to load providers:', error)
      if (error instanceof ApiError) {
        setPageError({ message: error.status === 403 ? 'You do not have permission to view communication providers.' : error.message, status: error.status })
      } else {
        setPageError({ message: 'Unable to load communication providers.' })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProviders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter])

  const openCreate = () => {
    setEditingProvider(null)
    setForm(emptyProviderForm)
    setShowFormModal(true)
  }

  const openEdit = (provider: CommProvider) => {
    setEditingProvider(provider)
    setForm({
      name: provider.name,
      code: provider.code,
      type: provider.type,
      status: provider.status,
      environment: provider.environment,
      isGlobal: provider.isGlobal,
      countryCode: provider.countryCode ?? null,
      priority: provider.priority,
      supportedPurposes: provider.supportedPurposes,
      dailyLimit: provider.dailyLimit ?? null,
      monthlyLimit: provider.monthlyLimit ?? null,
      rateLimitPerMinute: provider.rateLimitPerMinute ?? null,
    })
    setShowFormModal(true)
  }

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.supportedPurposes.length === 0) {
      toast.warning('Select at least one supported purpose.')
      return
    }
    setSaving(true)
    try {
      if (editingProvider) {
        await communicationApi.updateProvider(editingProvider.id, form)
        toast.success('Provider updated successfully.')
      } else {
        await communicationApi.createProvider(form)
        toast.success('Provider created successfully.')
      }
      setShowFormModal(false)
      loadProviders()
    } catch (error: any) {
      console.error('Failed to save provider:', error)
      toast.error(error?.message || 'Failed to save provider.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (provider: CommProvider) => {
    try {
      if (provider.status === 'ACTIVE') {
        await communicationApi.deactivateProvider(provider.id)
        toast.success(`${provider.name} deactivated.`)
      } else {
        await communicationApi.activateProvider(provider.id)
        toast.success(`${provider.name} activated.`)
      }
      loadProviders()
    } catch (error: any) {
      console.error('Failed to toggle provider status:', error)
      toast.error(error?.message || 'Provider requires an active credential before activation.')
    }
  }

  const handleDelete = async (provider: CommProvider) => {
    if (!window.confirm(`Delete provider "${provider.name}"? This cannot be undone.`)) return
    try {
      await communicationApi.deleteProvider(provider.id)
      toast.success('Provider deleted.')
      loadProviders()
    } catch (error: any) {
      console.error('Failed to delete provider:', error)
      toast.error(error?.message || 'Failed to delete provider.')
    }
  }

  const openDetail = async (provider: CommProvider) => {
    setShowDetail(true)
    setDetailProvider(provider)
    setCredentialForm({ secrets: {} })
    setSecretsText('')
    setTestRecipient('')
    try {
      const response = await communicationApi.getProvider(provider.id)
      if (response.success) setDetailProvider(response.data)
    } catch (error) {
      console.error('Failed to load provider detail:', error)
    }
  }

  const activeCredential = detailProvider?.credentials?.find((c) => c.isActive) || detailProvider?.credentials?.[0]

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detailProvider) return
    let secrets: Record<string, string> = {}
    try {
      secrets = secretsText.trim() ? JSON.parse(secretsText) : {}
    } catch {
      toast.error('Secrets must be valid JSON, e.g. {"apiKey":"...","username":"...","password":"..."}')
      return
    }
    if (!activeCredential && Object.keys(secrets).length === 0) {
      toast.warning('Provide at least one secret to create a credential.')
      return
    }
    setSavingCredential(true)
    try {
      const payload = { ...credentialForm, ...(Object.keys(secrets).length ? { secrets } : { secrets: {} }) }
      if (activeCredential) {
        await communicationApi.updateCredential(detailProvider.id, activeCredential.id, payload)
        toast.success('Credential updated successfully.')
      } else {
        await communicationApi.createCredential(detailProvider.id, { ...payload, secrets })
        toast.success('Credential created successfully.')
      }
      setSecretsText('')
      const response = await communicationApi.getProvider(detailProvider.id)
      if (response.success) setDetailProvider(response.data)
      loadProviders()
    } catch (error: any) {
      console.error('Failed to save credential:', error)
      toast.error(error?.message || 'Failed to save credential.')
    } finally {
      setSavingCredential(false)
    }
  }

  const handleTestSend = async () => {
    if (!detailProvider || !testRecipient) {
      toast.warning('Enter a recipient to test.')
      return
    }
    setTesting(true)
    try {
      const response =
        detailProvider.type === 'SMS'
          ? await communicationApi.testSmsProvider(detailProvider.id, testRecipient, 'WPA Central Auth test message.')
          : await communicationApi.testEmailProvider(detailProvider.id, testRecipient, 'WPA Central Auth test email', 'This is a test message.')
      if (response.success) toast.success('Test send succeeded.')
      else toast.error(response.message || 'Test send failed.')
      const refreshed = await communicationApi.getProvider(detailProvider.id)
      if (refreshed.success) setDetailProvider(refreshed.data)
    } catch (error: any) {
      console.error('Test send failed:', error)
      toast.error(error?.message || 'Test send failed.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Communication Providers</h4>
          <p className="text-muted mb-0 fs-13">Manage SMS/Email gateways, encrypted credentials, and test sends.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <IconifyIcon icon="solar:add-circle-bold-duotone" className="me-1 align-middle" />
          New Provider
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Form.Select style={{ maxWidth: 220 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
            <option value="ALL">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
          </Form.Select>
        </Card.Body>
      </Card>

      {pageError ? (
        <ApiErrorState message={pageError.message} status={pageError.status} onRetry={loadProviders} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : providers.length === 0 ? (
              <EmptyState message="No communication providers configured yet." icon="solar:server-square-bold-duotone" />
            ) : (
              <Table hover responsive className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4">Name</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Environment</th>
                    <th>Country / Global</th>
                    <th>Health</th>
                    <th>Priority</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider) => (
                    <tr key={provider.id}>
                      <td className="px-4">
                        <Button variant="link" className="p-0 fw-semibold text-dark" onClick={() => openDetail(provider)}>
                          {provider.name}
                        </Button>
                        <div className="text-muted fs-11">{provider.code}</div>
                      </td>
                      <td>
                        <Badge bg="soft-secondary" className="text-secondary">
                          {provider.type}
                        </Badge>
                      </td>
                      <td>
                        <StatusBadge status={provider.status} />
                      </td>
                      <td>
                        <Badge bg={provider.environment === 'LIVE' ? 'soft-success' : 'soft-warning'} className={provider.environment === 'LIVE' ? 'text-success' : 'text-warning'}>
                          {provider.environment}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-secondary fs-13">{provider.isGlobal ? 'Global' : provider.countryCode || '—'}</span>
                      </td>
                      <td>
                        <StatusBadge status={provider.healthStatus} />
                      </td>
                      <td>
                        <span className="text-secondary fs-13">{provider.priority}</span>
                      </td>
                      <td className="text-end px-4">
                        <div className="d-flex justify-content-end gap-1">
                          <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => openEdit(provider)}>
                            Edit
                          </Button>
                          <span className="text-muted">|</span>
                          <Button variant="link" size="sm" className={provider.status === 'ACTIVE' ? 'p-0 text-danger' : 'p-0 text-success'} onClick={() => handleToggleStatus(provider)}>
                            {provider.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <span className="text-muted">|</span>
                          <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDelete(provider)}>
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

      {/* CREATE/EDIT PROVIDER MODAL */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered size="lg">
        <Form onSubmit={handleSaveProvider}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-18">{editingProvider ? 'Edit Provider' : 'New Provider'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Name</Form.Label>
                <Form.Control required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Col>
              <Col md={6}>
                <Form.Label>Code (unique)</Form.Label>
                <Form.Control required disabled={!!editingProvider} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </Col>
              <Col md={4}>
                <Form.Label>Channel</Form.Label>
                <Form.Select disabled={!!editingProvider} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'SMS' | 'EMAIL' })}>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Environment</Form.Label>
                <Form.Select value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value as 'SANDBOX' | 'LIVE' })}>
                  <option value="SANDBOX">Sandbox</option>
                  <option value="LIVE">Live</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Priority</Form.Label>
                <Form.Control type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  label="Global (used as international fallback for any country)"
                  checked={!!form.isGlobal}
                  onChange={(e) => setForm({ ...form, isGlobal: e.target.checked })}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Country Code (SMS only, digits)</Form.Label>
                <Form.Control
                  placeholder="e.g. 880"
                  value={form.countryCode || ''}
                  onChange={(e) => setForm({ ...form, countryCode: e.target.value || null })}
                  disabled={form.isGlobal}
                />
              </Col>
              <Col md={12}>
                <Form.Label>Supported Purposes</Form.Label>
                <div className="d-flex flex-wrap gap-3">
                  {PURPOSES.map((purpose) => (
                    <Form.Check
                      key={purpose}
                      type="checkbox"
                      label={purpose}
                      checked={form.supportedPurposes.includes(purpose)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.supportedPurposes, purpose]
                          : form.supportedPurposes.filter((p) => p !== purpose)
                        setForm({ ...form, supportedPurposes: next })
                      }}
                    />
                  ))}
                </div>
              </Col>
              <Col md={4}>
                <Form.Label>Rate Limit / Minute</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Unlimited"
                  value={form.rateLimitPerMinute ?? ''}
                  onChange={(e) => setForm({ ...form, rateLimitPerMinute: e.target.value ? Number(e.target.value) : null })}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Daily Limit</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Unlimited"
                  value={form.dailyLimit ?? ''}
                  onChange={(e) => setForm({ ...form, dailyLimit: e.target.value ? Number(e.target.value) : null })}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Monthly Limit</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Unlimited"
                  value={form.monthlyLimit ?? ''}
                  onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value ? Number(e.target.value) : null })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowFormModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" className="me-1" /> : null}
              {editingProvider ? 'Save Changes' : 'Create Provider'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* PROVIDER DETAIL DRAWER (credentials + test send) */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-18">{detailProvider?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailProvider && (
            <Tabs defaultActiveKey="credentials" className="mb-3">
              <Tab eventKey="credentials" title="Credentials">
                {activeCredential && (
                  <div className="bg-light rounded p-3 mb-3 fs-13">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Masked preview</span>
                      <StatusBadge status={activeCredential.lastTestStatus} />
                    </div>
                    <pre className="mb-0 fs-12">{JSON.stringify(activeCredential.maskedSecretsPreview || {}, null, 2)}</pre>
                    {activeCredential.lastTestedAt && (
                      <div className="text-muted fs-11 mt-2">Last tested: {new Date(activeCredential.lastTestedAt).toLocaleString()}</div>
                    )}
                    {activeCredential.lastTestMessage && <div className="text-muted fs-11">{activeCredential.lastTestMessage}</div>}
                  </div>
                )}
                <Form onSubmit={handleSaveCredential}>
                  <p className="fs-12 text-muted mb-2">
                    Secret fields are write-only — existing secret values are never shown here, only the masked preview above.
                    Enter new secrets as JSON to {activeCredential ? 'rotate' : 'set'} the credential (e.g.{' '}
                    <code>{'{"username":"...","password":"..."}'}</code> for SMTP, or <code>{'{"apiKey":"..."}'}</code> for HTTP SMS).
                  </p>
                  <Form.Group className="mb-2">
                    <Form.Label className="fs-13">New Secrets (JSON)</Form.Label>
                    <Form.Control as="textarea" rows={3} value={secretsText} onChange={(e) => setSecretsText(e.target.value)} placeholder='{"apiKey":"..."}' />
                  </Form.Group>
                  <Row className="g-2">
                    {detailProvider.type === 'EMAIL' && (
                      <>
                        <Col md={6}>
                          <Form.Control placeholder="SMTP Host" value={credentialForm.smtpHost || ''} onChange={(e) => setCredentialForm({ ...credentialForm, smtpHost: e.target.value })} />
                        </Col>
                        <Col md={6}>
                          <Form.Control
                            placeholder="SMTP Port"
                            type="number"
                            value={credentialForm.smtpPort || ''}
                            onChange={(e) => setCredentialForm({ ...credentialForm, smtpPort: Number(e.target.value) })}
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Control placeholder="From Email" value={credentialForm.fromEmail || ''} onChange={(e) => setCredentialForm({ ...credentialForm, fromEmail: e.target.value })} />
                        </Col>
                        <Col md={6}>
                          <Form.Control placeholder="From Name" value={credentialForm.fromName || ''} onChange={(e) => setCredentialForm({ ...credentialForm, fromName: e.target.value })} />
                        </Col>
                      </>
                    )}
                  </Row>
                  <div className="d-grid mt-2">
                    <Button type="submit" variant="primary" size="sm" disabled={savingCredential}>
                      {savingCredential ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                      {activeCredential ? 'Rotate / Update Credential' : 'Create Credential'}
                    </Button>
                  </div>
                </Form>
              </Tab>
              <Tab eventKey="test" title="Test Send">
                <Form.Group className="mb-2">
                  <Form.Label className="fs-13">{detailProvider.type === 'SMS' ? 'Phone number' : 'Email address'}</Form.Label>
                  <Form.Control value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder={detailProvider.type === 'SMS' ? '+8801XXXXXXXXX' : 'you@example.com'} />
                </Form.Group>
                <Button variant="primary" size="sm" onClick={handleTestSend} disabled={testing}>
                  {testing ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                  Send Test
                </Button>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
