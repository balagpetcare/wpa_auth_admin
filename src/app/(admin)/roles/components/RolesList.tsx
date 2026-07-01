'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Button, Modal, Form, Dropdown } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useNotificationContext } from '@/context/useNotificationContext'

const RolesList = () => {
  const { accessToken } = useAuth()
  const { showNotification } = useNotificationContext()
  const [roles, setRoles] = useState<any[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false
  
  const [showAssign, setShowAssign] = useState(false
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [assignUserId, setAssignUserId] = useState(''

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true
      if (!accessToken) return;
      const res: any = await apiClient(accessToken).get('/admin/roles'
      setRoles(res.roles || []
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
  }, [accessToken]

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles]

  const handleAssignClick = (role: any) => {
    setSelectedRole(role
    setAssignUserId(''
    setShowAssign(true
  }

  const handleAssignSubmit = async () => {
    if (!accessToken || !selectedRole || !assignUserId) return
    try {
      await apiClient(accessToken).post(`/admin/users/${assignUserId}/roles`, { roleId: selectedRole.id }
      showNotification({ message: 'Role assigned successfully', variant: 'success' }
      setShowAssign(false
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to assign role', variant: 'danger' }
    }
  }

  return ()
    <>
      <Card>
        <CardHeader className="d-flex justify-content-between align-items-center">
          <CardTitle as="h4">Roles</CardTitle>
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
          ) : roles.length === 0 ? ()
            <div className="text-center py-4 text-muted">
              No roles found.
            </div>
          ) : ()
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Description</th>
                  <th>Total Users</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, idx) => ()
                  <tr key={role.id || idx}>
                    <td>{role.name}</td>
                    <td>{role.description || '-'}</td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">
                        {role._count?.users || 0}
                      </span>
                    </td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm">
                          <IconifyIcon icon="bx:dots-vertical-rounded" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleAssignClick(role)}>Assign to User</Dropdown.Item>
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

      <Modal show={showAssign} onHide={() => setShowAssign(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Role: {selectedRole?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>User ID</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter exact User ID" 
                value={assignUserId} 
                onChange={(e) => setAssignUserId(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAssignSubmit} disabled={!assignUserId}>Assign Role</Button>
        </Modal.Footer>
      </Modal>
    </>
  
}

export default RolesList
