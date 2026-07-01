'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Button, Modal, Form, Dropdown } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useNotificationContext } from '@/context/useNotificationContext'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal

const ClientsList = () => {
  const { accessToken } = useAuth()
  const { showNotification } = useNotificationContext()
  const [clients, setClients] = useState<any[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false
  
  const [showCreate, setShowCreate] = useState(false
  const [showEdit, setShowEdit] = useState(false
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const [createData, setCreateData] = useState({ name: '', slug: '', type: 'CONFIDENTIAL', redirectUris: '', allowedOrigins: '' }
  const [editData, setEditData] = useState({ redirectUris: '', allowedOrigins: '', allowedScopes: '' }

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true
      if (!accessToken) return;
      const res: any = await apiClient(accessToken).get('/admin/clients'
      setClients(res.clients || res.data || []
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
  }, [accessToken]

  useEffect(() => {
    fetchClients()
  }, [fetchClients]

  const handleEdit = (client: any) => {
    setSelectedClient(client
    setEditData({
      redirectUris: client.redirectUris?.join(', ') || '',
      allowedOrigins: client.allowedOrigins?.join(', ') || '',
      allowedScopes: client.allowedScopes?.join(', ') || '',
    }
    setShowEdit(true
  }

  const handleCreateSubmit = async () => {
    if (!accessToken) return
    try {
      const payload = {
        name: createData.name,
        slug: createData.slug,
        type: createData.type,
        redirectUris: createData.redirectUris.split(',').map(s => s.trim()).filter(Boolean),
        allowedOrigins: createData.allowedOrigins.split(',').map(s => s.trim()).filter(Boolean),
      }
      const res: any = await apiClient(accessToken).post('/admin/clients', payload
      showNotification({ message: 'Client created successfully', variant: 'success' }
      setShowCreate(false
      
      // Show secret securely
      MySwal.fire({
        title: 'Client Secret Generated',
        html: `Please copy this secret and store it securely. You will not be able to see it again.<br><br><code>${res.clientSecret}</code>`,
        icon: 'warning',
        confirmButtonText: 'I have copied it'
      }
      fetchClients()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to create client', variant: 'danger' }
    }
  }

  const handleEditSubmit = async () => {
    if (!accessToken || !selectedClient) return
    try {
      const payload = {
        redirectUris: editData.redirectUris.split(',').map(s => s.trim()).filter(Boolean),
        allowedOrigins: editData.allowedOrigins.split(',').map(s => s.trim()).filter(Boolean),
        allowedScopes: editData.allowedScopes.split(',').map(s => s.trim()).filter(Boolean),
      }
      await apiClient(accessToken).patch(`/admin/clients/${selectedClient.id}`, payload
      showNotification({ message: 'Client updated', variant: 'success' }
      setShowEdit(false
      fetchClients()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to update client', variant: 'danger' }
    }
  }

  const handleStatusChange = async (id: string, currentStatus: string) => {
    if (!accessToken) return
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await apiClient(accessToken).patch(`/admin/clients/${id}/status`, { status: newStatus }
      showNotification({ message: `Client ${newStatus.toLowerCase()}`, variant: 'success' }
      fetchClients()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to update status', variant: 'danger' }
    }
  }

  const handleRotateSecret = async (id: string) => {
    if (!accessToken) return
    MySwal.fire({
      title: 'Are you sure?',
      text: 'Rotating the secret will immediately invalidate the old secret. Client apps will fail to authenticate until updated.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, rotate it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res: any = await apiClient(accessToken).post(`/admin/clients/${id}/rotate-secret`
          MySwal.fire({
            title: 'Secret Rotated',
            html: `Please copy the new secret and store it securely.<br><br><code>${res.clientSecret}</code>`,
            icon: 'warning',
            confirmButtonText: 'I have copied it'
          }
        } catch (err: any) {
          showNotification({ message: err.message || 'Failed to rotate secret', variant: 'danger' }
        }
      }
    }
  }

  return ()
    <>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <CardTitle as="h4">Clients (Applications)</CardTitle>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <IconifyIcon icon="bx:plus" className="me-1" />
            Create Client
          </Button>
        </CardHeader>
        <CardBody>
          {loading ? ()
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? ()
            <div className="alert alert-warning" role="alert">
              Failed to load data.
            </div>
          ) : clients.length === 0 ? ()
            <div className="text-center py-4 text-muted">
              No clients found.
            </div>
          ) : ()
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Client ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, idx) => ()
                  <tr key={client.id || idx}>
                    <td>{client.name}</td>
                    <td>{client.slug}</td>
                    <td><code>{client.clientId}</code></td>
                    <td>
                      <span className={`badge bg-${client.status === 'ACTIVE' ? 'success' : 'danger'}`}>
                        {client.status}
                      </span>
                    </td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm">
                          <IconifyIcon icon="bx:dots-vertical-rounded" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleEdit(client)}>Edit Settings</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleRotateSecret(client.id)}>Rotate Secret</Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item 
                            className={client.status === 'ACTIVE' ? 'text-danger' : 'text-success'}
                            onClick={() => handleStatusChange(client.id, client.status)}
                          >
                            {client.status === 'ACTIVE' ? 'Disable Client' : 'Enable Client'}
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal show={showCreate} onHide={() => setShowCreate(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Client Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Mobile App" value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Slug</Form.Label>
              <Form.Control type="text" placeholder="e.g. mobile-app" value={createData.slug} onChange={e => setCreateData({...createData, slug: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={createData.type} onChange={e => setCreateData({...createData, type: e.target.value})}>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="PUBLIC">PUBLIC</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Redirect URIs (comma separated)</Form.Label>
              <Form.Control as="textarea" rows={2} value={createData.redirectUris} onChange={e => setCreateData({...createData, redirectUris: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allowed Origins</Form.Label>
              <Form.Control as="textarea" rows={2} value={createData.allowedOrigins} onChange={e => setCreateData({...createData, allowedOrigins: e.target.value})} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateSubmit}>Create</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Client: {selectedClient?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Redirect URIs (comma separated)</Form.Label>
              <Form.Control as="textarea" rows={2} value={editData.redirectUris} onChange={e => setEditData({...editData, redirectUris: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allowed Origins</Form.Label>
              <Form.Control as="textarea" rows={2} value={editData.allowedOrigins} onChange={e => setEditData({...editData, allowedOrigins: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Scopes</Form.Label>
              <Form.Control as="textarea" rows={2} value={editData.allowedScopes} onChange={e => setEditData({...editData, allowedScopes: e.target.value})} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEditSubmit}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </>
  
}

export default ClientsList
