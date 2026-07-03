'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { toast } from 'react-toastify'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ApiErrorState from '@/components/common/ApiErrorState'
import { EmptyState, StatCard, StatusBadge } from '@/components/dashboard/DashboardComponents'
import { useAuth } from '@/context/useAuthContext'
import { ApiError } from '@/lib/apiClient'
import { socialProvidersApi, type SocialProviderPayload } from '@/features/social-providers/api'
import { SocialProvider } from '@/features/social-providers/types'

const providerIcons: Record<string, string> = {
  GOOGLE: 'logos:google-icon',
  FACEBOOK: 'logos:facebook',
  APPLE: 'ic:baseline-apple',
  MICROSOFT: 'logos:microsoft-icon',
  LINKEDIN: 'logos:linkedin-icon',
  TIKTOK: 'logos:tiktok-icon',
  X: 'prime:twitter',
  GITHUB: 'logos:github-icon',
  INSTAGRAM: 'skill-icons:instagram',
}

const providerOrder = ['GOOGLE', 'FACEBOOK', 'APPLE', 'MICROSOFT', 'LINKEDIN', 'TIKTOK', 'X', 'GITHUB', 'INSTAGRAM']

const readinessMap: Record<string, { label: string; tone: string; description: string }> = {
  GITHUB: { label: 'Direct login supported', tone: 'success', description: 'Reliable email via user:email' },
  LINKEDIN: { label: 'Direct login supported', tone: 'success', description: 'Works when OIDC/email scopes are approved' },
  TIKTOK: { label: 'May require completion', tone: 'warning', description: 'Email depends on approved scopes/product' },
  X: { label: 'Email completion required', tone: 'danger', description: 'Email is often unavailable' },
  INSTAGRAM: { label: 'Email completion required', tone: 'danger', description: 'Basic Display does not return email' },
}

const emptyForm: Partial<SocialProviderPayload> = {
  displayName: '',
  clientId: '',
  clientSecret: '',
  authorizationUrl: '',
  tokenUrl: '',
  userInfoUrl: '',
  scopes: [],
  redirectUri: '',
  status: 'INACTIVE',
  environment: 'LIVE',
  placement: 'MAIN',
  sortOrder: 0,
  showOnLogin: true,
}

function splitScopes(value: string) {
  return value.split(/[\s,]+/).map((v) => v.trim()).filter(Boolean)
}

function joinScopes(scopes?: string[] | null) {
  return (scopes ?? []).join(' ')
}

export default function SocialLoginProvidersPage() {
  const { admin } = useAuth()
  const [providers, setProviders] = useState<SocialProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SocialProvider | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<SocialProviderPayload>>(emptyForm)

  const hasManagePermission = useMemo(() => {
    const perms = admin?.permissions ?? []
    return perms.includes('auth.social_providers.manage') || (admin?.roles ?? []).some((r) => ['admin', 'super_admin'].includes(r.toLowerCase()))
  }, [admin])

  const loadProviders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await socialProvidersApi.listAdminProviders()
      if (res.success) setProviders(res.providers)
    } catch (err: any) {
      const apiError = err instanceof ApiError ? err : null
      setError(apiError?.message || err?.message || 'Unable to load social login providers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasManagePermission) void loadProviders()
  }, [hasManagePermission])

  const openCreate = () => {
    setSelected(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (provider: SocialProvider) => {
    setSelected(provider)
    setForm({
      displayName: provider.displayName,
      clientId: provider.clientId ?? '',
      clientSecret: '',
      authorizationUrl: provider.authorizationUrl,
      tokenUrl: provider.tokenUrl,
      userInfoUrl: provider.userInfoUrl ?? '',
      scopes: provider.scopes,
      redirectUri: provider.redirectUri,
      status: provider.status,
      environment: provider.environment,
      placement: provider.placement,
      sortOrder: provider.sortOrder,
      showOnLogin: provider.showOnLogin,
      provider: provider.provider,
    })
    setShowModal(true)
  }

  const saveProvider = async () => {
    if (!form.provider && !selected?.provider) return
    setSaving(true)
    try {
      const payload: SocialProviderPayload = {
        displayName: form.displayName?.trim(),
        clientId: form.clientId?.trim() || undefined,
        authorizationUrl: form.authorizationUrl?.trim(),
        tokenUrl: form.tokenUrl?.trim(),
        userInfoUrl: form.userInfoUrl?.trim() || undefined,
        scopes: Array.isArray(form.scopes) ? form.scopes : splitScopes(String(form.scopes ?? '')),
        redirectUri: form.redirectUri?.trim(),
        status: form.status as any,
        environment: form.environment as any,
        placement: form.placement as any,
        sortOrder: Number(form.sortOrder ?? 0),
        showOnLogin: Boolean(form.showOnLogin),
      }
      if (form.clientSecret?.trim()) payload.clientSecret = form.clientSecret.trim()
      if (!selected) {
        payload.provider = form.provider as SocialProvider['provider']
        const res = await socialProvidersApi.createProvider(payload)
        if (res.success) toast.success('Social provider created.')
      } else {
        const res = await socialProvidersApi.updateProvider(selected.id, payload)
        if (res.success) toast.success('Social provider updated.')
      }
      setShowModal(false)
      await loadProviders()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save provider.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (provider: SocialProvider) => {
    setTestingId(provider.id)
    try {
      const res = await socialProvidersApi.updateStatus(provider.id, provider.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
      if (res.success) {
        toast.success(`Provider ${provider.status === 'ACTIVE' ? 'disabled' : 'enabled'}.`)
        await loadProviders()
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status.')
    } finally {
      setTestingId(null)
    }
  }

  const testProvider = async (provider: SocialProvider) => {
    setTestingId(provider.id)
    try {
      const res = await socialProvidersApi.testProvider(provider.id)
      if (res.success) {
        toast.success(res.data.configured ? 'Test recorded. Provider is configured.' : 'Test recorded. Provider is missing credentials.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Test failed.')
    } finally {
      setTestingId(null)
    }
  }

  const removeProvider = async (provider: SocialProvider) => {
    if (!confirm(`Delete ${provider.displayName}?`)) return
    try {
      await socialProvidersApi.deleteProvider(provider.id)
      toast.success('Provider deleted.')
      await loadProviders()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete provider.')
    }
  }

  const stats = useMemo(() => ({
    total: providers.length,
    active: providers.filter((p) => p.status === 'ACTIVE').length,
    configured: providers.filter((p) => p.clientId && p.clientSecretEncrypted).length,
    loginVisible: providers.filter((p) => p.showOnLogin).length,
  }), [providers])

  if (!hasManagePermission) return <ApiErrorState message="You do not have permission to manage social login providers." status={403} />
  if (error) return <ApiErrorState message={error} onRetry={loadProviders} />

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Social Login Providers</h4>
          <p className="text-muted mb-0 fs-13">Manage third-party login credentials and visibility.</p>
          <div className="alert alert-warning border-0 mt-3 mb-0 py-2 px-3">
            Secrets are encrypted and never displayed again.
          </div>
          <div className="mt-3 d-flex flex-wrap gap-2">
            <Badge bg="success">Direct login supported</Badge>
            <Badge bg="warning" text="dark">Email may be missing</Badge>
            <Badge bg="danger">Requires account linking/email completion</Badge>
            <Badge bg="info">Developer console approval required</Badge>
          </div>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <IconifyIcon icon="solar:plus-bold-duotone" className="me-1" />Add Provider
        </Button>
      </div>

      <Row className="g-3 mb-3">
        <Col md={3}><StatCard title="Total" value={stats.total} icon="solar:users-group-rounded-bold-duotone" /></Col>
        <Col md={3}><StatCard title="Active" value={stats.active} icon="solar:check-circle-bold-duotone" variant="success" /></Col>
        <Col md={3}><StatCard title="Configured" value={stats.configured} icon="solar:lock-keyhole-minimalistic-bold-duotone" variant="info" /></Col>
        <Col md={3}><StatCard title="Login Visible" value={stats.loginVisible} icon="solar:eye-bold-duotone" variant="warning" /></Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : providers.length === 0 ? (
            <EmptyState message="No social providers have been configured yet." icon="solar:users-group-rounded-bold-duotone" />
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Placement</th>
                    <th>Environment</th>
                    <th>Client ID</th>
                    <th>Secret</th>
                    <th>Readiness</th>
                    <th>Redirect URI</th>
                    <th>Sort</th>
                    <th>Updated</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.sort((a, b) => providerOrder.indexOf(a.provider) - providerOrder.indexOf(b.provider)).map((provider) => (
                    <tr key={provider.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="avatar-sm rounded bg-light d-inline-flex align-items-center justify-content-center">
                            <IconifyIcon icon={providerIcons[provider.provider] || 'solar:global-bold-duotone'} className="fs-20 text-primary" />
                          </span>
                          <div>
                            <div className="fw-semibold text-dark">{provider.displayName}</div>
                            <div className="text-muted fs-11 font-monospace">{provider.provider}</div>
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={provider.status} /></td>
                      <td><Badge bg="light" text="dark">{provider.placement}</Badge></td>
                      <td><Badge bg={provider.environment === 'LIVE' ? 'success' : 'warning'}>{provider.environment}</Badge></td>
                      <td>{provider.clientId ? 'Yes' : 'No'}</td>
                      <td>{provider.clientSecretEncrypted ? 'Secret configured' : 'No'}</td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Badge bg={readinessMap[provider.provider]?.tone || 'secondary'}>
                            {readinessMap[provider.provider]?.label || 'Direct login supported'}
                          </Badge>
                          <span className="text-muted fs-11">{readinessMap[provider.provider]?.description || 'Ready when credentials are configured'}</span>
                        </div>
                      </td>
                      <td className="text-muted fs-12 font-monospace">{provider.redirectUri}</td>
                      <td>{provider.sortOrder}</td>
                      <td className="text-muted fs-12">{new Date(provider.updatedAt).toLocaleString()}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2 flex-wrap">
                          <Button variant="link" className="p-0" onClick={() => openEdit(provider)}>Edit</Button>
                          <Button variant="link" className={`p-0 ${provider.status === 'ACTIVE' ? 'text-danger' : 'text-success'}`} onClick={() => toggleStatus(provider)} disabled={testingId === provider.id}>
                            {provider.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="link" className="p-0 text-primary" onClick={() => testProvider(provider)} disabled={testingId === provider.id}>
                            Test
                          </Button>
                          <Button variant="link" className="p-0 text-danger" onClick={() => removeProvider(provider)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{selected ? 'Edit Provider' : 'Create Provider'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            {!selected ? (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Provider</Form.Label>
                  <Form.Select value={String(form.provider ?? '')} onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value as SocialProvider['provider'] }))}>
                    <option value="">Select provider</option>
                    {providerOrder.map((provider) => <option key={provider} value={provider}>{provider}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            ) : null}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Display Name</Form.Label>
                <Form.Control value={form.displayName ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Client ID</Form.Label>
                <Form.Control value={form.clientId ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Replace Secret</Form.Label>
                <Form.Control type="password" placeholder="Leave blank to keep existing secret" value={form.clientSecret ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, clientSecret: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Authorization URL</Form.Label>
                <Form.Control value={form.authorizationUrl ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, authorizationUrl: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Token URL</Form.Label>
                <Form.Control value={form.tokenUrl ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, tokenUrl: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>User Info URL</Form.Label>
                <Form.Control value={form.userInfoUrl ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, userInfoUrl: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Scopes</Form.Label>
                <Form.Control value={joinScopes(form.scopes)} onChange={(e) => setForm((prev) => ({ ...prev, scopes: splitScopes(e.target.value) }))} placeholder="openid email profile" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Redirect URI</Form.Label>
                <Form.Control value={form.redirectUri ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, redirectUri: e.target.value }))} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Environment</Form.Label>
                <Form.Select value={form.environment ?? 'LIVE'} onChange={(e) => setForm((prev) => ({ ...prev, environment: e.target.value as any }))}>
                  <option value="SANDBOX">SANDBOX</option>
                  <option value="LIVE">LIVE</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Placement</Form.Label>
                <Form.Select value={form.placement ?? 'MAIN'} onChange={(e) => setForm((prev) => ({ ...prev, placement: e.target.value as any }))}>
                  <option value="MAIN">MAIN</option>
                  <option value="MORE">MORE</option>
                  <option value="HIDDEN">HIDDEN</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select value={form.status ?? 'INACTIVE'} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Sort Order</Form.Label>
                <Form.Control type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Check
                type="switch"
                id="show-on-login"
                label="Show on login screen"
                checked={Boolean(form.showOnLogin)}
                onChange={(e) => setForm((prev) => ({ ...prev, showOnLogin: e.target.checked }))}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveProvider} disabled={saving}>
            {saving ? 'Saving...' : 'Save Provider'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
