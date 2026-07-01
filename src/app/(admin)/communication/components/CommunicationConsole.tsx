'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationContext } from '@/context/useNotificationContext'

type Section =
  | 'sms-providers'
  | 'email-providers'
  | 'routing-rules'
  | 'otp-templates'
  | 'delivery-logs'
  | 'provider-health'
  | 'audit-logs'

type ProviderRecord = {
  id: string
  name: string
  code: string
  type: 'SMS' | 'EMAIL'
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING' | 'DISABLED'
  environment: 'SANDBOX' | 'LIVE'
  isGlobal: boolean
  countryCode: string | null
  priority: number
  supportedPurposes: string[]
  healthStatus: string
  failureCount: number
  successCount: number
  lastFailureMessage: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  credentials: Array<{
    id: string
    apiBaseUrl?: string | null
    senderId?: string | null
    fromName?: string | null
    fromEmail?: string | null
    smtpHost?: string | null
    smtpPort?: number | null
    smtpSecure?: boolean | null
    usernamePreview?: string | null
    maskedSecretsPreview?: Record<string, string> | null
    lastTestStatus?: string | null
    lastTestedAt?: string | null
    lastTestMessage?: string | null
    isActive: boolean
  }>
}

const communicationPurposeOptions = ['OTP', 'AUTH', 'PASSWORD_RESET', 'TRANSACTIONAL', 'ALERT'] as const
const templatePurposeOptions = ['LOGIN', 'REGISTER', 'PASSWORD_RESET', 'PAYMENT_VERIFY', 'ADMIN_INVITE', 'GENERAL'] as const
const languageOptions = ['EN', 'BN'] as const

const sectionMeta: Record<Section, { title: string; subtitle: string }> = {
  'sms-providers': {
    title: 'SMS Providers',
    subtitle: 'Manage country-specific and global SMS OTP gateways with encrypted credentials and fallback readiness.',
  },
  'email-providers': {
    title: 'Email Providers',
    subtitle: 'Manage SMTP providers for email OTP delivery, fallback ordering, and provider testing.',
  },
  'routing-rules': {
    title: 'Routing Rules',
    subtitle: 'Control country-wise SMS routing and provider fallback order by channel and purpose.',
  },
  'otp-templates': {
    title: 'OTP Templates',
    subtitle: 'Maintain localized SMS and email OTP templates with default bodies and variable validation.',
  },
  'delivery-logs': {
    title: 'Delivery Logs',
    subtitle: 'Review every delivery attempt, provider response, and failover outcome without exposing secrets.',
  },
  'provider-health': {
    title: 'Provider Health',
    subtitle: 'Monitor provider reliability, last test status, and failure signals across all communication channels.',
  },
  'audit-logs': {
    title: 'Communication Audit Logs',
    subtitle: 'Track all admin actions taken on communication providers, credentials, templates, and routing rules.',
  },
}

const defaultProviderForm = {
  id: '',
  name: '',
  code: '',
  type: 'SMS',
  environment: 'SANDBOX',
  isGlobal: false,
  countryCode: '',
  priority: 10,
  supportedPurposes: ['OTP', 'AUTH'],
  status: 'INACTIVE',
  senderId: '',
  fromName: '',
  fromEmail: '',
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  apiBaseUrl: '',
  secrets: {
    endpoint: '',
    method: 'POST',
    apiKey: '',
    token: '',
    authHeaderName: '',
    authHeaderValue: '',
    username: '',
    password: '',
  },
}

const defaultRuleForm = {
  id: '',
  channel: 'SMS',
  countryCode: '',
  purpose: 'OTP',
  language: '',
  providerId: '',
  fallbackProviderIds: '',
  priority: 10,
  isActive: true,
}

const defaultTemplateForm = {
  id: '',
  channel: 'SMS',
  purpose: 'LOGIN',
  language: 'EN',
  subject: '',
  body: '',
  variables: 'otp,minutes,appName,purpose,supportEmail',
  isDefault: false,
  isActive: true,
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function badgeVariant(status?: string) {
  switch (status) {
    case 'ACTIVE':
    case 'HEALTHY':
    case 'PASSED':
    case 'SENT':
      return 'success'
    case 'TESTING':
    case 'DEGRADED':
    case 'RETRIED':
      return 'warning'
    case 'FAILED':
    case 'DOWN':
    case 'DISABLED':
    case 'ERROR':
      return 'danger'
    default:
      return 'secondary'
  }
}

const CommunicationConsole = ({ section }: { section: Section }) => {
  const { accessToken } = useAuth()
  const { showNotification } = useNotificationContext()
  const meta = sectionMeta[section]
  const [loading, setLoading] = useState(true
  const [submitting, setSubmitting] = useState(false
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([]
  const [providers, setProviders] = useState<ProviderRecord[]>([]
  const [showProviderModal, setShowProviderModal] = useState(false
  const [providerForm, setProviderForm] = useState(defaultProviderForm
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null)
  const [showRuleModal, setShowRuleModal] = useState(false
  const [ruleForm, setRuleForm] = useState(defaultRuleForm
  const [showTemplateModal, setShowTemplateModal] = useState(false
  const [templateForm, setTemplateForm] = useState(defaultTemplateForm
  const [testTarget, setTestTarget] = useState<{ providerId: string; type: 'SMS' | 'EMAIL' } | null>(null)
  const [testValue, setTestValue] = useState(''
  const [deliveryFilters, setDeliveryFilters] = useState({
    channel: '',
    status: '',
    recipient: '',
    countryCode: '',
  }

  const client = useMemo(() => (accessToken ? apiClient(accessToken) : null), [accessToken]

  const loadProviders = async () => {
    if (!client) return
    const type = section === 'sms-providers' ? 'SMS' : section === 'email-providers' ? 'EMAIL' : ''
    const res: any = await client.get(`/admin/communication/providers${type ? `?type=${type}` : ''}`
    const safeItems = res.data.items || []
    setProviders(safeItems
    if (section === 'sms-providers' || section === 'email-providers' || section === 'provider-health') {
      setItems(safeItems
    }
  }

  const loadSection = async () => {
    if (!client) return
    setLoading(true
    setError(null
    try {
      if (section === 'sms-providers' || section === 'email-providers' || section === 'provider-health') {
        await loadProviders()
        if (section === 'provider-health') {
          const res: any = await client.get('/admin/communication/provider-health'
          setItems(res.data.items || []
        }
      } else if (section === 'routing-rules') {
        await loadProviders()
        const res: any = await client.get('/admin/communication/routing-rules'
        setItems(res.data.items || []
      } else if (section === 'otp-templates') {
        const res: any = await client.get('/admin/communication/templates'
        setItems(res.data.items || []
      } else if (section === 'delivery-logs') {
        const params = new URLSearchParams()
        if (deliveryFilters.channel) params.set('channel', deliveryFilters.channel
        if (deliveryFilters.status) params.set('status', deliveryFilters.status
        if (deliveryFilters.recipient) params.set('recipient', deliveryFilters.recipient
        if (deliveryFilters.countryCode) params.set('countryCode', deliveryFilters.countryCode
        params.set('limit', '100'
        const res: any = await client.get(`/admin/communication/delivery-logs?${params.toString()}`
        setItems(res.data.items || []
      } else if (section === 'audit-logs') {
        const res: any = await client.get('/admin/communication/provider-audit-logs?limit=100'
        setItems(res.data.items || []
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load communication data.'
    } finally {
      setLoading(false
    }
  }

  useEffect(() => {
    void loadSection()
  }, [client, section]

  useEffect(() => {
    if (section === 'delivery-logs') {
      void loadSection()
    }
  }, [deliveryFilters.channel, deliveryFilters.status, deliveryFilters.recipient, deliveryFilters.countryCode]

  const resetProviderModal = () => {
    setProviderForm({ ...defaultProviderForm, type: section === 'email-providers' ? 'EMAIL' : 'SMS' }
    setEditingCredentialId(null
    setShowProviderModal(false
  }

  const openProviderEditor = (provider?: ProviderRecord) => {
    if (!provider) {
      setProviderForm({ ...defaultProviderForm, type: section === 'email-providers' ? 'EMAIL' : 'SMS' }
      setEditingCredentialId(null
      setShowProviderModal(true
      return
    }
    const credential = provider.credentials?.[0]
    const preview = credential?.maskedSecretsPreview || {}
    setProviderForm({
      id: provider.id,
      name: provider.name,
      code: provider.code,
      type: provider.type,
      environment: provider.environment,
      isGlobal: provider.isGlobal,
      countryCode: provider.countryCode || '',
      priority: provider.priority,
      supportedPurposes: provider.supportedPurposes,
      status: provider.status,
      senderId: credential?.senderId || '',
      fromName: credential?.fromName || '',
      fromEmail: credential?.fromEmail || '',
      smtpHost: credential?.smtpHost || '',
      smtpPort: credential?.smtpPort || 587,
      smtpSecure: Boolean(credential?.smtpSecure),
      apiBaseUrl: credential?.apiBaseUrl || '',
      secrets: {
        endpoint: preview.endpoint || '',
        method: preview.method || 'POST',
        apiKey: '',
        token: '',
        authHeaderName: preview.authHeaderName || '',
        authHeaderValue: '',
        username: '',
        password: '',
      },
    }
    setEditingCredentialId(credential?.id || null
    setShowProviderModal(true
  }

  const submitProvider = async () => {
    if (!client) return
    setSubmitting(true
    try {
      const providerPayload = {
        name: providerForm.name,
        code: providerForm.code,
        type: providerForm.type,
        environment: providerForm.environment,
        isGlobal: providerForm.type === 'EMAIL' ? true : providerForm.isGlobal,
        countryCode: providerForm.type === 'SMS' && providerForm.countryCode ? providerForm.countryCode : null,
        priority: Number(providerForm.priority),
        supportedPurposes: providerForm.supportedPurposes,
        status: providerForm.status,
      }
      let providerId = providerForm.id
      if (providerForm.id) {
        await client.patch(`/admin/communication/providers/${providerForm.id}`, providerPayload
      } else {
        const res: any = await client.post('/admin/communication/providers', providerPayload
        providerId = res.data.id
      }

      const secrets =
        providerForm.type === 'SMS'
          ? {
              endpoint: providerForm.secrets.endpoint,
              method: providerForm.secrets.method,
              apiKey: providerForm.secrets.apiKey,
              token: providerForm.secrets.token,
              authHeaderName: providerForm.secrets.authHeaderName,
              authHeaderValue: providerForm.secrets.authHeaderValue,
              senderId: providerForm.senderId,
            }
          : {
              username: providerForm.secrets.username,
              password: providerForm.secrets.password,
            }

      const secretValues = Object.values(secrets).filter(Boolean
      if (!providerForm.id || secretValues.length > 0) {
        const credentialPayload = {
          secrets,
          apiBaseUrl: providerForm.apiBaseUrl || null,
          senderId: providerForm.senderId || null,
          fromName: providerForm.fromName || null,
          fromEmail: providerForm.fromEmail || null,
          smtpHost: providerForm.smtpHost || null,
          smtpPort: providerForm.type === 'EMAIL' ? Number(providerForm.smtpPort) : null,
          smtpSecure: providerForm.type === 'EMAIL' ? providerForm.smtpSecure : null,
          isActive: true,
        }
        if (editingCredentialId) {
          await client.patch(`/admin/communication/providers/${providerId}/credentials/${editingCredentialId}`, credentialPayload
        } else {
          await client.post(`/admin/communication/providers/${providerId}/credentials`, credentialPayload
        }
      }
      showNotification({ message: 'Communication provider saved successfully.', variant: 'success' }
      resetProviderModal()
      await loadSection()
    } catch (err: any) {
      showNotification({ message: err?.message || 'Unable to save provider.', variant: 'danger' }
    } finally {
      setSubmitting(false
    }
  }

  const changeProviderStatus = async (provider: ProviderRecord, next: 'ACTIVE' | 'INACTIVE') => {
    if (!client) return
    try {
      await client.post(`/admin/communication/providers/${provider.id}/${next === 'ACTIVE' ? 'activate' : 'deactivate'}`
      showNotification({ message: `${provider.name} ${next === 'ACTIVE' ? 'activated' : 'deactivated'}.`, variant: 'success' }
      await loadSection()
    } catch (err: any) {
      showNotification({ message: err?.message || 'Unable to update provider status.', variant: 'danger' }
    }
  }

  const removeProvider = async (provider: ProviderRecord) => {
    if (!client) return
    try {
      await client.delete(`/admin/communication/providers/${provider.id}`
      showNotification({ message: `${provider.name} deleted successfully.`, variant: 'success' }
      await loadSection()
    } catch (err: any) {
      showNotification({ message: err?.message || 'Unable to delete provider.', variant: 'danger' }
    }
  }

  const submitRule = async () => {
    if (!client) return
    setSubmitting(true
    try {
      const payload = {
        channel: ruleForm.channel,
        countryCode: ruleForm.countryCode || null,
        purpose: ruleForm.purpose,
        language: ruleForm.language || null,
        providerId: ruleForm.providerId || null,
        fallbackProviderIds: ruleForm.fallbackProviderIds
          .split(','
          .map((item) => item.trim()
          .filter(Boolean),
        priority: Number(ruleForm.priority),
        isActive: ruleForm.isActive,
      }
      if (ruleForm.id) await client.patch(`/admin/communication/routing-rules/${ruleForm.id}`, payload
      else await client.post('/admin/communication/routing-rules', payload
      showNotification({ message: 'Routing rule saved successfully.', variant: 'success' }
      setShowRuleModal(false
      setRuleForm(defaultRuleForm
      await loadSection()
    } catch (err: any) {
      showNotification({ message: err?.message || 'Unable to save routing rule.', variant: 'danger' }
    } finally {
      setSubmitting(false
    }
  }

  const submitTemplate = async () => {
    if (!client) return
    setSubmitting(true
    try {
      const payload = {
        channel: templateForm.channel,
        purpose: templateForm.purpose,
        language: templateForm.language,
        subject: templateForm.subject || null,
        body: templateForm.body,
        variables: templateForm.variables.split(',').map((item) => item.trim()).filter(Boolean),
        isDefault: templateForm.isDefault,
        isActive: templateForm.isActive,
      }
      if (templateForm.id) await client.patch(`/admin/communication/templates/${templateForm.id}`, payload
      else await client.post('/admin/communication/templates', payload
      showNotification({ message: 'OTP template saved successfully.', variant: 'success' }
      setShowTemplateModal(false
      setTemplateForm(defaultTemplateForm
      await loadSection()
    } catch (err: any) {
      showNotification({ message: err?.message || 'Unable to save OTP template.', variant: 'danger' }
    } finally {
      setSubmitting(false
    }
  }

  const runProviderTest = async () => {
    if (!client || !testTarget || !testValue) return
    setSubmitting(true
    try {
      if (testTarget.type === 'SMS') {
        await client.post(`/admin/communication/providers/${testTarget.providerId}/test-sms`, { to: testValue }
      } else {
        await client.post(`/admin/communication/providers/${testTarget.providerId}/test-email`, {
          to: testValue,
          subject: 'WPA Central Auth provider test',
          message: 'This is a provider connectivity test from WPA Central Auth.',
        }
      }
      showNotification({ message: 'Provider test completed.', variant: 'success' }
      setTestTarget(null
      setTestValue(''
      await loadSection()
    } catch (err: any) {
      showNotification({ message: err?.message || 'Provider test failed.', variant: 'danger' }
    } finally {
      setSubmitting(false
    }
  }

  return ()
    <>
      <Row className="align-items-end g-3">
        <Col lg={8}>
          <div className="page-title-box">
            <h4 className="mb-0">{meta.title}</h4>
            <p className="text-muted mt-1 mb-0">{meta.subtitle}</p>
          </div>
        </Col>
        <Col lg={4}>
          <div className="d-flex justify-content-lg-end gap-2">
            <Button variant="outline-secondary" onClick={() => void loadSection()} disabled={loading}>
              Refresh
            </Button>
            {(section === 'sms-providers' || section === 'email-providers') && ()
              <Button variant="primary" onClick={() => openProviderEditor()}>
                Add provider
              </Button>
            )}
            {section === 'routing-rules' && <Button variant="primary" onClick={() => setShowRuleModal(true)}>Add rule</Button>}
            {section === 'otp-templates' && <Button variant="primary" onClick={() => setShowTemplateModal(true)}>Add template</Button>}
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      {(section === 'sms-providers' || section === 'email-providers') && ()
        <Card className="shadow-sm border-0 mt-4">
          <CardHeader className="bg-transparent border-bottom">
            <CardTitle as="h5" className="mb-0">Provider Inventory</CardTitle>
          </CardHeader>
          <CardBody>
            {loading ? ()
              <div className="py-5 text-center"><Spinner animation="border" /></div>
            ) : ()
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Scope</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Health</th>
                    <th>Last Test</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((provider: ProviderRecord) => ()
                    <tr key={provider.id}>
                      <td>
                        <div className="fw-semibold">{provider.name}</div>
                        <div className="text-muted small">
                          {provider.type === 'SMS' ? (provider.isGlobal ? 'Global fallback' : `Country +${provider.countryCode}`) : provider.credentials?.[0]?.fromEmail || 'SMTP provider'}
                        </div>
                      </td>
                      <td>{provider.code}</td>
                      <td>{provider.environment}</td>
                      <td>{provider.priority}</td>
                      <td><Badge bg={badgeVariant(provider.status)}>{provider.status}</Badge></td>
                      <td><Badge bg={badgeVariant(provider.healthStatus)}>{provider.healthStatus}</Badge></td>
                      <td>{provider.credentials?.[0]?.lastTestStatus ? <Badge bg={badgeVariant(provider.credentials[0].lastTestStatus || undefined)}>{provider.credentials[0].lastTestStatus}</Badge> : 'Not tested'}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2 flex-wrap">
                          <Button size="sm" variant="outline-secondary" onClick={() => openProviderEditor(provider)}>Edit</Button>
                          <Button size="sm" variant="outline-primary" onClick={() => setTestTarget({ providerId: provider.id, type: provider.type })}>Test</Button>
                          <Button size="sm" variant={provider.status === 'ACTIVE' ? 'outline-warning' : 'outline-success'} onClick={() => void changeProviderStatus(provider, provider.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>
                            {provider.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => void removeProvider(provider)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      {section === 'routing-rules' && ()
        <Card className="shadow-sm border-0 mt-4">
          <CardHeader className="bg-transparent border-bottom"><CardTitle as="h5" className="mb-0">Routing Rules</CardTitle></CardHeader>
          <CardBody>
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Purpose</th>
                  <th>Country</th>
                  <th>Primary</th>
                  <th>Fallback Providers</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((rule: any) => ()
                  <tr key={rule.id}>
                    <td>{rule.channel}</td>
                    <td>{rule.purpose}</td>
                    <td>{rule.countryCode ? `+${rule.countryCode}` : 'Global'}</td>
                    <td>{rule.provider?.name || 'Auto'}</td>
                    <td>{Array.isArray(rule.fallbackProviderIds) ? rule.fallbackProviderIds.join(', ') : '—'}</td>
                    <td>{rule.priority}</td>
                    <td><Badge bg={rule.isActive ? 'success' : 'secondary'}>{rule.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge></td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-secondary" onClick={() => {
                        setRuleForm({
                          id: rule.id,
                          channel: rule.channel,
                          countryCode: rule.countryCode || '',
                          purpose: rule.purpose,
                          language: rule.language || '',
                          providerId: rule.providerId || '',
                          fallbackProviderIds: Array.isArray(rule.fallbackProviderIds) ? rule.fallbackProviderIds.join(', ') : '',
                          priority: rule.priority,
                          isActive: rule.isActive,
                        }
                        setShowRuleModal(true
                      }}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {section === 'otp-templates' && ()
        <Card className="shadow-sm border-0 mt-4">
          <CardHeader className="bg-transparent border-bottom"><CardTitle as="h5" className="mb-0">OTP Templates</CardTitle></CardHeader>
          <CardBody>
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Purpose</th>
                  <th>Language</th>
                  <th>Subject</th>
                  <th>Default</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((template: any) => ()
                  <tr key={template.id}>
                    <td>{template.channel}</td>
                    <td>{template.purpose}</td>
                    <td>{template.language}</td>
                    <td>{template.subject || '—'}</td>
                    <td><Badge bg={template.isDefault ? 'primary' : 'secondary'}>{template.isDefault ? 'DEFAULT' : 'STANDARD'}</Badge></td>
                    <td><Badge bg={template.isActive ? 'success' : 'secondary'}>{template.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge></td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-secondary" onClick={() => {
                        setTemplateForm({
                          id: template.id,
                          channel: template.channel,
                          purpose: template.purpose,
                          language: template.language,
                          subject: template.subject || '',
                          body: template.body,
                          variables: Array.isArray(template.variables) ? template.variables.join(',') : '',
                          isDefault: template.isDefault,
                          isActive: template.isActive,
                        }
                        setShowTemplateModal(true
                      }}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {section === 'delivery-logs' && ()
        <>
          <Card className="shadow-sm border-0 mt-4">
            <CardBody>
              <Row className="g-3">
                <Col md={3}><Form.Select value={deliveryFilters.channel} onChange={(e) => setDeliveryFilters((current) => ({ ...current, channel: e.target.value }))}><option value="">All channels</option><option value="SMS">SMS</option><option value="EMAIL">Email</option></Form.Select></Col>
                <Col md={3}><Form.Select value={deliveryFilters.status} onChange={(e) => setDeliveryFilters((current) => ({ ...current, status: e.target.value }))}><option value="">All statuses</option><option value="SENT">Sent</option><option value="FAILED">Failed</option><option value="RETRIED">Retried</option></Form.Select></Col>
                <Col md={3}><Form.Control placeholder="Recipient" value={deliveryFilters.recipient} onChange={(e) => setDeliveryFilters((current) => ({ ...current, recipient: e.target.value }))} /></Col>
                <Col md={3}><Form.Control placeholder="Country code" value={deliveryFilters.countryCode} onChange={(e) => setDeliveryFilters((current) => ({ ...current, countryCode: e.target.value }))} /></Col>
              </Row>
            </CardBody>
          </Card>
          <Card className="shadow-sm border-0 mt-4">
            <CardHeader className="bg-transparent border-bottom"><CardTitle as="h5" className="mb-0">Delivery Attempt History</CardTitle></CardHeader>
            <CardBody>
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Purpose</th>
                    <th>Recipient</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Attempt</th>
                    <th>Created</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((log: any) => ()
                    <tr key={log.id}>
                      <td>{log.channel}</td>
                      <td>{log.purpose}</td>
                      <td>{log.recipient}</td>
                      <td>{log.provider?.name || '—'}</td>
                      <td><Badge bg={badgeVariant(log.status)}>{log.status}</Badge></td>
                      <td>{log.attemptNo}</td>
                      <td>{formatDate(log.createdAt)}</td>
                      <td className="text-muted small">{log.errorMessage || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}

      {section === 'provider-health' && ()
        <Card className="shadow-sm border-0 mt-4">
          <CardHeader className="bg-transparent border-bottom"><CardTitle as="h5" className="mb-0">Provider Health Overview</CardTitle></CardHeader>
          <CardBody>
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>Success</th>
                  <th>Failures</th>
                  <th>Last Success</th>
                  <th>Last Failure</th>
                  <th>Last Failure Message</th>
                </tr>
              </thead>
              <tbody>
                {items.map((provider: any) => ()
                  <tr key={provider.id}>
                    <td>{provider.name}</td>
                    <td>{provider.type}</td>
                    <td><Badge bg={badgeVariant(provider.status)}>{provider.status}</Badge></td>
                    <td><Badge bg={badgeVariant(provider.healthStatus)}>{provider.healthStatus}</Badge></td>
                    <td>{provider.successCount}</td>
                    <td>{provider.failureCount}</td>
                    <td>{formatDate(provider.lastSuccessAt)}</td>
                    <td>{formatDate(provider.lastFailureAt)}</td>
                    <td className="text-muted small">{provider.lastFailureMessage || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {section === 'audit-logs' && ()
        <Card className="shadow-sm border-0 mt-4">
          <CardHeader className="bg-transparent border-bottom"><CardTitle as="h5" className="mb-0">Provider Audit Trail</CardTitle></CardHeader>
          <CardBody>
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Provider</th>
                  <th>Actor</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log: any) => ()
                  <tr key={log.id}>
                    <td>{log.action}</td>
                    <td>{log.provider?.name || '—'}</td>
                    <td>{log.actorAdmin?.email || log.actorAdmin?.username || 'System'}</td>
                    <td>{log.ipAddress || '—'}</td>
                    <td>{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      <Modal show={showProviderModal} onHide={resetProviderModal} size="lg">
        <Modal.Header closeButton><Modal.Title>{providerForm.id ? 'Edit Communication Provider' : 'Add Communication Provider'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}><Form.Label>Name</Form.Label><Form.Control value={providerForm.name} onChange={(e) => setProviderForm((current) => ({ ...current, name: e.target.value }))} /></Col>
            <Col md={3}><Form.Label>Code</Form.Label><Form.Control value={providerForm.code} onChange={(e) => setProviderForm((current) => ({ ...current, code: e.target.value }))} /></Col>
            <Col md={3}><Form.Label>Environment</Form.Label><Form.Select value={providerForm.environment} onChange={(e) => setProviderForm((current) => ({ ...current, environment: e.target.value as any }))}><option value="SANDBOX">SANDBOX</option><option value="LIVE">LIVE</option></Form.Select></Col>
            <Col md={3}><Form.Label>Priority</Form.Label><Form.Control type="number" value={providerForm.priority} onChange={(e) => setProviderForm((current) => ({ ...current, priority: Number(e.target.value) }))} /></Col>
            <Col md={3}><Form.Label>Status</Form.Label><Form.Select value={providerForm.status} onChange={(e) => setProviderForm((current) => ({ ...current, status: e.target.value as any }))}><option value="INACTIVE">INACTIVE</option><option value="ACTIVE">ACTIVE</option><option value="TESTING">TESTING</option><option value="DISABLED">DISABLED</option></Form.Select></Col>
            {providerForm.type === 'SMS' && ()
              <>
                <Col md={3}><Form.Label>Country Code</Form.Label><Form.Control value={providerForm.countryCode} onChange={(e) => setProviderForm((current) => ({ ...current, countryCode: e.target.value }))} placeholder="880" /></Col>
                <Col md={3} className="d-flex align-items-end"><Form.Check checked={providerForm.isGlobal} label="Global fallback" onChange={(e) => setProviderForm((current) => ({ ...current, isGlobal: e.target.checked }))} /></Col>
              </>
            )}
            <Col xs={12}>
              <Form.Label>Supported Purposes</Form.Label>
              <div className="d-flex flex-wrap gap-3">
                {communicationPurposeOptions.map((purpose) => ()
                  <Form.Check
                    key={purpose}
                    type="checkbox"
                    label={purpose}
                    checked={providerForm.supportedPurposes.includes(purpose)}
                    onChange={(e) => setProviderForm((current) => ({
                      ...current,
                      supportedPurposes: e.target.checked
                        ? [...current.supportedPurposes, purpose]
                        : current.supportedPurposes.filter((item) => item !== purpose),
                    }))}
                  />
                ))}
              </div>
            </Col>
            {providerForm.type === 'SMS' ? ()
              <>
                <Col md={6}><Form.Label>API Base URL</Form.Label><Form.Control value={providerForm.apiBaseUrl} onChange={(e) => setProviderForm((current) => ({ ...current, apiBaseUrl: e.target.value }))} /></Col>
                <Col md={3}><Form.Label>Sender ID</Form.Label><Form.Control value={providerForm.senderId} onChange={(e) => setProviderForm((current) => ({ ...current, senderId: e.target.value }))} /></Col>
                <Col md={3}><Form.Label>Method</Form.Label><Form.Select value={providerForm.secrets.method} onChange={(e) => setProviderForm((current) => ({ ...current, secrets: { ...current.secrets, method: e.target.value } }))}><option value="POST">POST</option><option value="GET">GET</option></Form.Select></Col>
                <Col md={6}><Form.Label>Endpoint</Form.Label><Form.Control value={providerForm.secrets.endpoint} onChange={(e) => setProviderForm((current) => ({ ...current, secrets: { ...current.secrets, endpoint: e.target.value } }))} /></Col>
                <Col md={3}><Form.Label>API Key</Form.Label><Form.Control type="password" value={providerForm.secrets.apiKey} onChange={(e) => setProviderForm((current) => ({ ...current, secrets: { ...current.secrets, apiKey: e.target.value } }))} /></Col>
                <Col md={3}><Form.Label>Token</Form.Label><Form.Control type="password" value={providerForm.secrets.token} onChange={(e) => setProviderForm((current) => ({ ...current, secrets: { ...current.secrets, token: e.target.value } }))} /></Col>
                <Col md={6}><Form.Label>Auth Header Name</Form.Label><Form.Control value={providerForm.secrets.authHeaderName} onChange={(e) => setProviderForm((current) => ({ ...current, secrets: { ...current.secrets, authHeaderName: e.target.value } }))} /></Col>
                <Col md={6}><Form.Label>Auth Header Value</Form.Label><Form.Control type="password" value={providerForm.secrets.authHeaderValue} onChange={(e) => setProviderForm((current) => ({ ...current, secrets: { ...current.secrets, authHeaderValue: e.target.value } }))} /></Col>
              </>
            ) : ()
              <>
                <Col md={6}><Form.Label>From Name</Form.Label><Form.Control value={providerForm.fromName} onChange={(e) => setProviderForm((current) => ({ ...current, fromName: e.target.value }))} /></Col>
                <Col md={6}><Form.Label>From Email</Form.Label><Form.Control type="email" value={providerForm.fromEmail} onChange={(e) => setProviderForm((current) => ({ ...current, fromEmail: e.target.value }))} /></Col>
                <Col md={4}><Form.Label>SMTP Host</Form.Label><Form.Control value={providerForm.smtpHost} onChange={(e) => setProviderForm((current) => ({ ...current, smtpHost: e.target.value }))} /></Col>
                <Col md={2}><Form.Label>Port</Form.Label><Form.Control type="number" value={providerForm.smtpPort} onChange={(e) => setProviderForm((current) => ({ ...current, smtpPort: Number(e.target.value) }))} /></Col>
                <Col md={2} className="d-flex align-items-end"><Form.Check checked={providerForm.smtpSecure} label="Secure" onChange={(e) => setProviderForm((current) => ({ ...current, smtpSecure: e.target.checked }))} /></Col>
                <Col md={4}><Form.Label>Username</Form.Label><Form.Control value={providerForm.secrets.username} onChange={(e) => setProviderForm((current) => ({ ...current, secrets: { ...current.secrets, username: e.target.value } }))} /></Col>
                <Col md={6}><Form.Label>Password</Form.Label><Form.Control type="password" value={providerForm.secrets.password} onChange={(e) => setProviderForm((current) => ({ ...current, secrets: { ...current.secrets, password: e.target.value } }))} /></Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={resetProviderModal}>Cancel</Button>
          <Button variant="primary" onClick={() => void submitProvider()} disabled={submitting}>{submitting ? 'Saving...' : 'Save Provider'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRuleModal} onHide={() => setShowRuleModal(false)}>
        <Modal.Header closeButton><Modal.Title>{ruleForm.id ? 'Edit Routing Rule' : 'Add Routing Rule'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}><Form.Label>Channel</Form.Label><Form.Select value={ruleForm.channel} onChange={(e) => setRuleForm((current) => ({ ...current, channel: e.target.value }))}><option value="SMS">SMS</option><option value="EMAIL">EMAIL</option></Form.Select></Col>
            <Col md={6}><Form.Label>Purpose</Form.Label><Form.Select value={ruleForm.purpose} onChange={(e) => setRuleForm((current) => ({ ...current, purpose: e.target.value }))}>{communicationPurposeOptions.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}</Form.Select></Col>
            <Col md={6}><Form.Label>Country Code</Form.Label><Form.Control value={ruleForm.countryCode} onChange={(e) => setRuleForm((current) => ({ ...current, countryCode: e.target.value }))} placeholder="Leave blank for global" /></Col>
            <Col md={6}><Form.Label>Language</Form.Label><Form.Select value={ruleForm.language} onChange={(e) => setRuleForm((current) => ({ ...current, language: e.target.value }))}><option value="">Any</option>{languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}</Form.Select></Col>
            <Col md={6}><Form.Label>Primary Provider</Form.Label><Form.Select value={ruleForm.providerId} onChange={(e) => setRuleForm((current) => ({ ...current, providerId: e.target.value }))}><option value="">Auto</option>{providers.filter((provider) => provider.type === ruleForm.channel).map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</Form.Select></Col>
            <Col md={6}><Form.Label>Fallback Provider IDs</Form.Label><Form.Control value={ruleForm.fallbackProviderIds} onChange={(e) => setRuleForm((current) => ({ ...current, fallbackProviderIds: e.target.value }))} placeholder="Comma-separated provider IDs" /></Col>
            <Col md={6}><Form.Label>Priority</Form.Label><Form.Control type="number" value={ruleForm.priority} onChange={(e) => setRuleForm((current) => ({ ...current, priority: Number(e.target.value) }))} /></Col>
            <Col md={6} className="d-flex align-items-end"><Form.Check checked={ruleForm.isActive} label="Active routing rule" onChange={(e) => setRuleForm((current) => ({ ...current, isActive: e.target.checked }))} /></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowRuleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => void submitRule()} disabled={submitting}>{submitting ? 'Saving...' : 'Save Rule'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{templateForm.id ? 'Edit OTP Template' : 'Add OTP Template'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}><Form.Label>Channel</Form.Label><Form.Select value={templateForm.channel} onChange={(e) => setTemplateForm((current) => ({ ...current, channel: e.target.value }))}><option value="SMS">SMS</option><option value="EMAIL">EMAIL</option></Form.Select></Col>
            <Col md={4}><Form.Label>Purpose</Form.Label><Form.Select value={templateForm.purpose} onChange={(e) => setTemplateForm((current) => ({ ...current, purpose: e.target.value }))}>{templatePurposeOptions.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}</Form.Select></Col>
            <Col md={4}><Form.Label>Language</Form.Label><Form.Select value={templateForm.language} onChange={(e) => setTemplateForm((current) => ({ ...current, language: e.target.value }))}>{languageOptions.map((language) => <option key={language} value={language}>{language}</option>)}</Form.Select></Col>
            <Col xs={12}><Form.Label>Subject</Form.Label><Form.Control value={templateForm.subject} onChange={(e) => setTemplateForm((current) => ({ ...current, subject: e.target.value }))} /></Col>
            <Col xs={12}><Form.Label>Body</Form.Label><Form.Control as="textarea" rows={6} value={templateForm.body} onChange={(e) => setTemplateForm((current) => ({ ...current, body: e.target.value }))} /></Col>
            <Col xs={12}><Form.Label>Variables</Form.Label><Form.Control value={templateForm.variables} onChange={(e) => setTemplateForm((current) => ({ ...current, variables: e.target.value }))} /></Col>
            <Col md={6} className="d-flex align-items-end"><Form.Check checked={templateForm.isDefault} label="Default template" onChange={(e) => setTemplateForm((current) => ({ ...current, isDefault: e.target.checked }))} /></Col>
            <Col md={6} className="d-flex align-items-end"><Form.Check checked={templateForm.isActive} label="Active template" onChange={(e) => setTemplateForm((current) => ({ ...current, isActive: e.target.checked }))} /></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => void submitTemplate()} disabled={submitting}>{submitting ? 'Saving...' : 'Save Template'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(testTarget)} onHide={() => setTestTarget(null)}>
        <Modal.Header closeButton><Modal.Title>{testTarget?.type === 'SMS' ? 'Test SMS Provider' : 'Test Email Provider'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Label>{testTarget?.type === 'SMS' ? 'Recipient phone number (E.164)' : 'Recipient email address'}</Form.Label>
          <Form.Control value={testValue} onChange={(e) => setTestValue(e.target.value)} placeholder={testTarget?.type === 'SMS' ? '+8801XXXXXXXXX' : 'admin@example.com'} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setTestTarget(null)}>Cancel</Button>
          <Button variant="primary" onClick={() => void runProviderTest()} disabled={submitting || !testValue}>{submitting ? 'Testing...' : 'Run Test'}</Button>
        </Modal.Footer>
      </Modal>
    </>
  
}

export default CommunicationConsole
