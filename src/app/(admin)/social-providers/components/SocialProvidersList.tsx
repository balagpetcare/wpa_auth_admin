'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Button, Modal, Form } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useNotificationContext } from '@/context/useNotificationContext'

const SocialProvidersList = () => {
  const { accessToken } = useAuth()
  const { showNotification } = useNotificationContext()
  const [providers, setProviders] = useState<any[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false
  
  const [showEdit, setShowEdit] = useState(false
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [editData, setEditData] = useState({ enabled: false, displayName: '', displayOrder: 0 }

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true
      if (!accessToken) return;
      const res: any = await apiClient(accessToken).get('/admin/social-providers'
      setProviders(res.providers || res.data || []
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
  }, [accessToken]

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders]

  const handleEdit = (provider: any) => {
    setSelectedProvider(provider
    setEditData({
      enabled: provider.enabled,
      displayName: provider.displayName,
      displayOrder: provider.displayOrder,
    }
    setShowEdit(true
  }

  const handleEditSubmit = async () => {
    if (!accessToken || !selectedProvider) return
    try {
      const payload = {
        enabled: editData.enabled,
        displayName: editData.displayName,
        displayOrder: Number(editData.displayOrder),
      }
      await apiClient(accessToken).patch(`/admin/social-providers/${selectedProvider.provider}`, payload
      showNotification({ message: 'Social provider updated', variant: 'success' }
      setShowEdit(false
      fetchProviders()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to update provider. Ensure environment variables are configured.', variant: 'danger' }
    }
  }

  const handleToggleStatus = async (provider: any) => {
    if (!accessToken) return
    try {
      await apiClient(accessToken).patch(`/admin/social-providers/${provider.provider}`, { enabled: !provider.enabled }
      showNotification({ message: `Provider ${!provider.enabled ? 'enabled' : 'disabled'}`, variant: 'success' }
      fetchProviders()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to update status. Check configuration.', variant: 'danger' }
    }
  }

  return ()
    <>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <CardTitle as="h4">Social Login Providers</CardTitle>
          <Button variant="outline-secondary" size="sm" onClick={fetchProviders}>
            <IconifyIcon icon="bx:refresh" className="me-1" />
            Refresh
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
          ) : providers.length === 0 ? ()
            <div className="text-center py-4 text-muted">
              No providers found.
            </div>
          ) : ()
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Provider</th>
                  <th>Display Name</th>
                  <th>Configured (Env)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p, idx) => ()
                  <tr key={p.id || idx}>
                    <td>{p.displayOrder}</td>
                    <td><strong className="text-uppercase">{p.provider}</strong></td>
                    <td>{p.displayName}</td>
                    <td>
                      {p.isConfigured ? ()
                        <span className="badge bg-success"><IconifyIcon icon="bx:check" /> Yes</span>
                      ) : ()
                        <span className="badge bg-warning text-dark"><IconifyIcon icon="bx:x" /> Missing</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge bg-${p.enabled ? 'success' : 'danger'}`}>
                        {p.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <Button variant="link" size="sm" className="p-0 me-2" onClick={() => handleEdit(p)}>
                        Edit
                      </Button>
                      <Button 
                        variant={p.enabled ? 'outline-danger' : 'outline-success'} 
                        size="sm" 
                        onClick={() => handleToggleStatus(p)}
                        disabled={!p.isConfigured && !p.enabled}
                      >
                        {p.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Provider: {selectedProvider?.provider}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Display Name</Form.Label>
              <Form.Control type="text" value={editData.displayName} onChange={e => setEditData({...editData, displayName: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Display Order</Form.Label>
              <Form.Control type="number" value={editData.displayOrder} onChange={e => setEditData({...editData, displayOrder: parseInt(e.target.value) || 0})} />
            </Form.Group>
            <Form.Check 
              type="switch"
              id="enable-switch"
              label="Enable Provider"
              checked={editData.enabled}
              onChange={e => setEditData({...editData, enabled: e.target.checked})}
              disabled={!selectedProvider?.isConfigured}
            />
            {!selectedProvider?.isConfigured && ()
              <small className="text-danger mt-1 d-block">
                This provider cannot be enabled because required environment variables are missing in the API.
              </small>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEditSubmit}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </>
  
}

export default SocialProvidersList
