'use client'

import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Badge,
  Spinner,
  Alert,
  Offcanvas
} from 'react-bootstrap'
import { toast } from 'react-toastify'
import { applicationsApi } from '@/features/applications/api'
import { ClientApplication } from '@/features/applications/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import {
  StatCard,
  StatusBadge,
  EmptyState,
  ErrorState
} from '@/components/dashboard/DashboardComponents'

export default function ApplicationsPage() {
  const [clients, setClients] = useState<ClientApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals & Offcanvas
  const [selectedClient, setSelectedClient] = useState<ClientApplication | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Form Fields
  const [appName, setAppName] = useState('')
  const [appSlug, setAppSlug] = useState('')
  const [appType, setAppType] = useState<'SPA' | 'WEB' | 'NATIVE'>('SPA')
  const [redirectUrisInput, setRedirectUrisInput] = useState('')
  const [allowedOriginsInput, setAllowedOriginsInput] = useState('')

  // Drawer Edit Fields
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editRedirectUris, setEditRedirectUris] = useState<string[]>([])
  const [newRedirectUri, setNewRedirectUri] = useState('')
  const [editAllowedOrigins, setEditAllowedOrigins] = useState<string[]>([])
  const [newAllowedOrigin, setNewAllowedOrigin] = useState('')

  // Secret display
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null)
  const [showSecretModal, setShowSecretModal] = useState(false)

  // Confirmation Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate' | 'rotate-secret'
    clientId: string
    title: string
    message: string
  } | null>(null)

  const loadClients = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await applicationsApi.listClients({
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      })
      if (response.success && response.items) {
        setClients(response.items)
      }
    } catch (err: any) {
      console.error('Failed to load applications:', err)
      setError(err?.message || 'Access Denied: Missing permissions to query applications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [searchTerm, statusFilter])

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  // --- MUTATIONS ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    // Normalize inputs
    const redirectUris = redirectUrisInput.split(',').map((u) => u.trim()).filter(Boolean)
    const allowedOrigins = allowedOriginsInput.split(',').map((u) => u.trim()).filter(Boolean)

    try {
      const response = await applicationsApi.createClient({
        name: appName,
        slug: appSlug,
        type: appType,
        redirectUris,
        allowedOrigins,
      })

      if (response.success && response.client) {
        toast.success(`Application "${appName}" successfully registered.`)
        setShowCreateModal(false)

        // Clear create form
        setAppName('')
        setAppSlug('')
        setAppType('SPA')
        setRedirectUrisInput('')
        setAllowedOriginsInput('')

        // Show secret modal if secret exists
        if (response.clientSecret) {
          setNewlyCreatedSecret(response.clientSecret)
          setShowSecretModal(true)
        }
        loadClients()
      }
    } catch (err: any) {
      console.error('Create application failed:', err)
      toast.error(err?.message || 'Failed to register client application.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenConfirm = (
    type: 'suspend' | 'activate' | 'rotate-secret',
    clientId: string,
    title: string,
    message: string
  ) => {
    setConfirmAction({ type, clientId, title, message })
    setShowConfirmModal(true)
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    const { type, clientId } = confirmAction

    try {
      if (type === 'suspend') {
        const res = await applicationsApi.updateClientStatus(clientId, 'SUSPENDED')
        if (res.success) {
          toast.success('Application status changed to SUSPENDED.')
          loadClients()
          if (selectedClient?.id === clientId) {
            setSelectedClient({ ...selectedClient, status: 'SUSPENDED' })
          }
        }
      } else if (type === 'activate') {
        const res = await applicationsApi.updateClientStatus(clientId, 'ACTIVE')
        if (res.success) {
          toast.success('Application status activated.')
          loadClients()
          if (selectedClient?.id === clientId) {
            setSelectedClient({ ...selectedClient, status: 'ACTIVE' })
          }
        }
      } else if (type === 'rotate-secret') {
        const res = await applicationsApi.rotateSecret(clientId)
        if (res.success && res.clientSecret) {
          setNewlyCreatedSecret(res.clientSecret)
          setShowSecretModal(true)
          toast.success('Client secret regenerated successfully.')
        }
      }
    } catch (err: any) {
      console.error('Action failed:', err)
      toast.error(err?.message || 'Action request failed.')
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const handleOpenDrawer = (client: ClientApplication) => {
    setSelectedClient(client)
    setEditName(client.name)
    setEditRedirectUris(client.redirectUris || [])
    setEditAllowedOrigins(client.allowedOrigins || [])
    setIsEditing(false)
    setShowDrawer(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedClient) return
    setActionLoading(true)
    try {
      const res = await applicationsApi.updateClient(selectedClient.id, {
        name: editName,
        redirectUris: editRedirectUris,
        allowedOrigins: editAllowedOrigins,
      })

      if (res.success && res.client) {
        toast.success('Application properties updated.')
        setIsEditing(false)
        setSelectedClient(res.client)
        loadClients()
      }
    } catch (err: any) {
      console.error('Update client failed:', err)
      toast.error(err?.message || 'Failed to save application modifications.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Application Registry</h4>
          <p className="text-muted mb-0 fs-13">Register and manage clients/websites connecting via OAuth 2.0 / OpenID Connect.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="d-flex align-items-center gap-1">
          <IconifyIcon icon="solar:laptop-phone-bold-duotone" className="fs-18" />
          Register Application
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={loadClients} />}

      <Card className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
        <Card.Body className="p-0">
          {/* SEARCH & FILTERS */}
          <div className="p-4 border-bottom d-flex flex-wrap align-items-center gap-3">
            <div style={{ minWidth: '280px' }}>
              <Form.Control
                type="text"
                placeholder="Search by client name, slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '160px' }}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DELETED">Archived / Deleted</option>
              </Form.Select>
            </div>
          </div>

          {/* LIST TABLE */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : clients.length === 0 ? (
            <EmptyState message="No integrated applications found matching current criteria." icon="solar:laptop-phone-bold-duotone" />
          ) : (
            <div className="table-responsive">
              <Table className="align-middle mb-0" hover>
                <thead className="table-light">
                  <tr>
                    <th>Application</th>
                    <th>Client Type</th>
                    <th>Client ID</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold text-dark fs-14">{client.name}</span>
                          <span className="text-muted fs-11">/{client.slug}</span>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" className="text-dark border px-2 py-1 fs-12">
                          {client.type}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-secondary font-monospace fs-13 d-flex align-items-center gap-1">
                          {client.id.substring(0, 12)}...
                          <Button variant="link" size="sm" className="p-0 text-muted hover-text-primary" onClick={() => copyToClipboard(client.id, 'Client ID')}>
                            <IconifyIcon icon="solar:copy-bold" className="fs-14" />
                          </Button>
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={client.status} />
                      </td>
                      <td>
                        <span className="text-secondary fs-13">{new Date(client.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="text-end px-4">
                        <div className="d-flex justify-content-end gap-1">
                          <Button variant="link" size="sm" className="p-0 text-primary me-2" onClick={() => handleOpenDrawer(client)}>
                            Manage Config
                          </Button>
                          {client.status === 'ACTIVE' ? (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-danger"
                              onClick={() =>
                                handleOpenConfirm(
                                  'suspend',
                                  client.id,
                                  'Suspend Client Application?',
                                  `Are you sure you want to suspend access for "${client.name}"? Integrated logins for this app will be rejected instantly.`
                                )
                              }
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-success"
                              onClick={() =>
                                handleOpenConfirm(
                                  'activate',
                                  client.id,
                                  'Activate Client Application?',
                                  `Are you sure you want to restore active connection status for "${client.name}"?`
                                )
                              }
                            >
                              Activate
                            </Button>
                          )}
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

      {/* CREATE NEW CLIENT MODAL */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Register Client Application</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Application Name</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. Furtail Storefront"
                value={appName}
                onChange={(e) => {
                  setAppName(e.target.value)
                  setAppSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>App Slug</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. furtail-storefront"
                value={appSlug}
                onChange={(e) => setAppSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Client Profile Type</Form.Label>
              <Form.Select value={appType} onChange={(e) => setAppType(e.target.value as any)}>
                <option value="SPA">Single Page Application (SPA / React / Vue)</option>
                <option value="WEB">Regular Web App (NextJS / NodeJS / Rails)</option>
                <option value="NATIVE">Native / Mobile Application</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allowed Redirect URIs (Comma separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="http://localhost:3000/api/auth/callback, https://app.com/callback"
                value={redirectUrisInput}
                onChange={(e) => setRedirectUrisInput(e.target.value)}
              />
              <Form.Text className="text-muted">Where authorization codes and tokens are safely dispatched.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allowed Origins (CORS - Comma separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="http://localhost:3000, https://app.com"
                value={allowedOriginsInput}
                onChange={(e) => setAllowedOriginsInput(e.target.value)}
              />
              <Form.Text className="text-muted">Origins permitted to execute silent token renews and requests.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Registering...' : 'Register Client'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* NEW SECRET GENERATED POPUP */}
      <Modal show={showSecretModal} onHide={() => setShowSecretModal(false)} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton className="bg-soft-success">
          <Modal.Title className="fw-bold text-success">
            <IconifyIcon icon="solar:shield-check-bold" className="me-2" />
            Client Secret Key Generated
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="d-flex align-items-start gap-2">
            <IconifyIcon icon="solar:danger-triangle-bold" className="fs-22 text-warning flex-shrink-0" />
            <div>
              <strong className="text-warning-emphasis">Store Secret Now Safely!</strong>
              <p className="fs-12 text-warning-emphasis mb-0 mt-1">
                For security, this client secret will never be displayed in the console interface again. Copy and paste it to environment configs immediately.
              </p>
            </div>
          </Alert>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Client Secret Key</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                readOnly
                className="font-monospace bg-light"
                value={newlyCreatedSecret || ''}
              />
              <Button variant="primary" onClick={() => copyToClipboard(newlyCreatedSecret || '', 'Client Secret')}>
                Copy
              </Button>
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={() => setShowSecretModal(false)}>
            I Have Saved It Safely
          </Button>
        </Modal.Footer>
      </Modal>

      {/* EDIT CONFIG DRAWER */}
      <Offcanvas show={showDrawer} onHide={() => setShowDrawer(false)} placement="end" style={{ width: '480px' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold">Client Settings</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column justify-content-between h-100">
          {selectedClient && (
            <div>
              <div className="mb-4 pb-3 border-bottom">
                <h5 className="fw-bold text-dark mb-1">{selectedClient.name}</h5>
                <span className="text-muted fs-12">Client Type: <strong>{selectedClient.type}</strong></span>
                <div className="mt-2">
                  <StatusBadge status={selectedClient.status} />
                </div>
              </div>

              {/* READ ONLY CLIENT ID */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold fs-13">Client ID</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    readOnly
                    className="font-monospace bg-light fs-13"
                    value={selectedClient.id}
                  />
                  <Button variant="outline-secondary" size="sm" onClick={() => copyToClipboard(selectedClient.id, 'Client ID')}>
                    Copy
                  </Button>
                </div>
              </Form.Group>

              {/* MUTABLE FIELD MANAGEMENT */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-0">Configurations</h6>
                  {!isEditing ? (
                    <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => setIsEditing(true)}>
                      Modify Config
                    </Button>
                  ) : (
                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </div>

                {!isEditing ? (
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <span className="text-muted fs-12 fw-medium d-block mb-1">Redirect URIs</span>
                      {editRedirectUris.length === 0 ? (
                        <span className="text-muted fs-12">None registered</span>
                      ) : (
                        <div className="d-flex flex-column gap-1">
                          {editRedirectUris.map((uri, idx) => (
                            <span key={idx} className="font-monospace fs-12 text-secondary bg-light p-1.5 rounded">{uri}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-muted fs-12 fw-medium d-block mb-1">Allowed Origins (CORS)</span>
                      {editAllowedOrigins.length === 0 ? (
                        <span className="text-muted fs-12">None registered</span>
                      ) : (
                        <div className="d-flex flex-column gap-1">
                          {editAllowedOrigins.map((origin, idx) => (
                            <span key={idx} className="font-monospace fs-12 text-secondary bg-light p-1.5 rounded">{origin}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    <Form.Group>
                      <Form.Label>Client Display Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </Form.Group>

                    {/* REDIRECT URIs MANAGER */}
                    <div className="p-3 bg-light rounded">
                      <Form.Label className="fw-semibold fs-13">Redirect URIs</Form.Label>
                      <div className="d-flex gap-2 mb-2">
                        <Form.Control
                          type="text"
                          placeholder="Add callback URL..."
                          value={newRedirectUri}
                          onChange={(e) => setNewRedirectUri(e.target.value)}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (newRedirectUri && !editRedirectUris.includes(newRedirectUri)) {
                              setEditRedirectUris([...editRedirectUris, newRedirectUri])
                              setNewRedirectUri('')
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="d-flex flex-column gap-1" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {editRedirectUris.map((uri, idx) => (
                          <div key={idx} className="d-flex align-items-center justify-content-between bg-white p-1 px-2 border rounded fs-12 font-monospace">
                            <span className="text-truncate" style={{ maxWidth: '240px' }}>{uri}</span>
                            <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => setEditRedirectUris(editRedirectUris.filter(u => u !== uri))}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CORS ORIGINS MANAGER */}
                    <div className="p-3 bg-light rounded">
                      <Form.Label className="fw-semibold fs-13">CORS Allowed Origins</Form.Label>
                      <div className="d-flex gap-2 mb-2">
                        <Form.Control
                          type="text"
                          placeholder="Add allowed origin..."
                          value={newAllowedOrigin}
                          onChange={(e) => setNewAllowedOrigin(e.target.value)}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (newAllowedOrigin && !editAllowedOrigins.includes(newAllowedOrigin)) {
                              setEditAllowedOrigins([...editAllowedOrigins, newAllowedOrigin])
                              setNewAllowedOrigin('')
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="d-flex flex-column gap-1" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                        {editAllowedOrigins.map((origin, idx) => (
                          <div key={idx} className="d-flex align-items-center justify-content-between bg-white p-1 px-2 border rounded fs-12 font-monospace">
                            <span className="text-truncate" style={{ maxWidth: '240px' }}>{origin}</span>
                            <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => setEditAllowedOrigins(editAllowedOrigins.filter(o => o !== origin))}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button variant="primary" size="sm" className="mt-2" onClick={handleSaveEdit} disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedClient && selectedClient.type !== 'SPA' && (
            <div className="border-top pt-3 mt-4">
              <Button
                variant="outline-danger"
                className="w-100"
                onClick={() =>
                  handleOpenConfirm(
                    'rotate-secret',
                    selectedClient.id,
                    'Rotate Client Secret?',
                    'Are you sure you want to regenerate the client secret for this application? The previous secret key will stop working immediately, potentially disrupting connected web services.'
                  )
                }
              >
                Regenerate Client Secret
              </Button>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* CONFIRM ACTION MODAL */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{confirmAction?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0 fs-14">{confirmAction?.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowConfirmModal(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant={confirmAction?.type === 'suspend' || confirmAction?.type === 'rotate-secret' ? 'danger' : 'success'}
            onClick={executeConfirmAction}
            disabled={actionLoading}
          >
            {actionLoading ? 'Confirming...' : 'Confirm Action'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
