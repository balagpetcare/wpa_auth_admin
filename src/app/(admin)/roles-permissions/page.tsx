'use client'

import React, { useEffect, useState, useMemo } from 'react'
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
  Alert
} from 'react-bootstrap'
import { toast } from 'react-toastify'
import { rolesPermissionsApi } from '@/features/roles-permissions/api'
import { Role, Permission } from '@/features/roles-permissions/types'
import { useAuth } from '@/context/useAuthContext'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { EmptyState, ErrorState } from '@/components/dashboard/DashboardComponents'

export default function RolesPermissionsPage() {
  const { admin: currentAdmin } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selected Role details
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loadingRoleDetails, setLoadingRoleDetails] = useState(false)

  // Modals / forms state
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Matrix edits
  const [pendingPermissionIds, setPendingPermissionIds] = useState<string[]>([])
  const [savingMatrix, setSavingMatrix] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const rolesRes = await rolesPermissionsApi.listRoles()
      const permsRes = await rolesPermissionsApi.listPermissions()

      if (rolesRes.success && rolesRes.roles) {
        setRoles(rolesRes.roles)
        if (rolesRes.roles.length > 0 && !selectedRoleId) {
          setSelectedRoleId(rolesRes.roles[0].id)
        }
      }

      if (permsRes.success && Array.isArray(permsRes.permissions)) {
        setPermissions(permsRes.permissions)
      } else {
        setPermissions([])
      }
    } catch (err: any) {
      console.error('Failed to load RBAC data:', err)
      setError(err?.message || 'Access Denied: Missing roles:read or permissions:read permission.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadRoleDetails = async (id: string) => {
    setLoadingRoleDetails(true)
    try {
      const res = await rolesPermissionsApi.getRole(id)
      if (res.success && res.role) {
        setSelectedRole(res.role)
        // Normalize permissions format from API
        const rolePerms = res.role.permissions || []
        const permIds = rolePerms.map((p: any) => p.permission?.id || p.id).filter(Boolean)
        setPendingPermissionIds(permIds)
      }
    } catch (err: any) {
      console.error('Failed to load role details:', err)
      toast.error('Error retrieving granular role permissions.')
    } finally {
      setLoadingRoleDetails(false)
    }
  }

  useEffect(() => {
    if (selectedRoleId) {
      loadRoleDetails(selectedRoleId)
    } else {
      setSelectedRole(null)
      setPendingPermissionIds([])
    }
  }, [selectedRoleId])

  // Group permissions by their prefix/module name
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {}
      ;(Array.isArray(permissions) ? permissions : []).forEach((perm) => {
      // Deduce module from permission key format (e.g. roles:read or communication.providers.read)
      let moduleName = 'System'
      if (perm.key.includes(':')) {
        moduleName = perm.key.split(':')[0]
      } else if (perm.key.includes('.')) {
        moduleName = perm.key.split('.')[0]
      }
      if (!groups[moduleName]) groups[moduleName] = []
      groups[moduleName].push(perm)
    })
    return groups
  }, [permissions])

  // --- MUTATIONS ---
  const handleOpenCreateModal = () => {
    setEditingRoleId(null)
    setRoleName('')
    setRoleDescription('')
    setShowRoleModal(true)
  }

  const handleOpenEditModal = (role: Role) => {
    setEditingRoleId(role.id)
    setRoleName(role.name)
    setRoleDescription(role.description || '')
    setShowRoleModal(true)
  }

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      if (editingRoleId) {
        const res = await rolesPermissionsApi.updateRole(editingRoleId, {
          name: roleName,
          description: roleDescription,
        })
        if (res.success) {
          toast.success('Role metadata updated successfully.')
          loadData()
          if (selectedRoleId === editingRoleId) {
            loadRoleDetails(editingRoleId)
          }
        }
      } else {
        const res = await rolesPermissionsApi.createRole({
          name: roleName,
          description: roleDescription,
        })
        if (res.success) {
          toast.success('New role successfully created.')
          loadData()
          setSelectedRoleId(res.role.id)
        }
      }
      setShowRoleModal(false)
    } catch (err: any) {
      console.error('Role mutation failed:', err)
      toast.error(err?.message || 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    const isSystemRole = ['super_admin', 'admin'].includes(roleName.toLowerCase())
    if (isSystemRole) {
      toast.error('Security action denied: System default roles cannot be deleted.')
      return
    }

    if (!window.confirm(`Are you sure you want to permanently delete the role "${roleName}"? This action is irreversible.`)) {
      return
    }

    setActionLoading(true)
    try {
      const res = await rolesPermissionsApi.deleteRole(roleId)
      if (res.success) {
        toast.success(`Role "${roleName}" has been successfully removed.`)
        setSelectedRoleId(null)
        loadData()
      }
    } catch (err: any) {
      console.error('Delete role failed:', err)
      toast.error(err?.message || 'Failed to remove role. Check if users are still assigned to it.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMatrixCheckboxChange = (permId: string) => {
    if (pendingPermissionIds.includes(permId)) {
      setPendingPermissionIds(pendingPermissionIds.filter((id) => id !== permId))
    } else {
      setPendingPermissionIds([...pendingPermissionIds, permId])
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedRoleId || !selectedRole) return

    const isSystemRole = ['super_admin', 'admin'].includes(selectedRole.name.toLowerCase())
    const isSelfUser = currentAdmin?.roles.some((r) => r.toLowerCase() === selectedRole.name.toLowerCase())

    if (isSelfUser) {
      const confirmSelf = window.confirm(
        'Warning: You are modifying a role that is currently assigned to your account. Revoking permissions could lock you out. Proceed?'
      )
      if (!confirmSelf) return
    }

    setSavingMatrix(true)
    try {
      const res = await rolesPermissionsApi.replaceRolePermissions(selectedRoleId, {
        permissionIds: pendingPermissionIds,
      })
      if (res.success) {
        toast.success(`Permissions matrix updated for role: ${selectedRole.name}`)
        loadRoleDetails(selectedRoleId)
      }
    } catch (err: any) {
      console.error('Matrix save failed:', err)
      toast.error(err?.message || 'Failed to update permissions matrix.')
    } finally {
      setSavingMatrix(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />
  }

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Access Control & Privileges (RBAC)</h4>
          <p className="text-muted mb-0 fs-13">Configure administrative access roles, map permissions, and verify security matrices.</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateModal} className="d-flex align-items-center gap-1">
          <IconifyIcon icon="solar:shield-plus-bold-duotone" className="fs-18" />
          Add Role
        </Button>
      </div>

      <Row>
        {/* ROLES PANEL LIST */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold text-dark mb-0">Configured Roles</h5>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="d-flex flex-column gap-2">
                {roles.map((role) => {
                  const isSelected = selectedRoleId === role.id
                  const isSystem = ['super_admin', 'admin'].includes(role.name.toLowerCase())
                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`p-3 rounded border cursor-pointer transition-all d-flex align-items-center justify-content-between ${
                        isSelected ? 'border-primary bg-light-primary' : 'bg-light-hover'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong className="text-dark fs-14">{role.name}</strong>
                          {isSystem ? (
                            <Badge bg="soft-danger" className="text-danger fs-11">
                              System
                            </Badge>
                          ) : (
                            <Badge bg="soft-secondary" className="text-secondary fs-11">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted fs-12 mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                          {role.description || 'No description provided.'}
                        </p>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-muted hover-text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEditModal(role)
                          }}
                        >
                          <IconifyIcon icon="solar:pen-bold" className="fs-16" />
                        </Button>
                        {!isSystem && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-muted hover-text-danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRole(role.id, role.name)
                            }}
                          >
                            <IconifyIcon icon="solar:trash-bin-trash-bold" className="fs-16" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* PERMISSIONS MATRIX */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  Permissions Matrix: {selectedRole?.name || 'Loading...'}
                </h5>
                <span className="text-muted fs-12">Assign and revoke operational privileges for this role.</span>
              </div>
              <Button
                variant="success"
                size="sm"
                onClick={handleSavePermissions}
                disabled={savingMatrix || !selectedRoleId}
                className="px-4 py-2"
              >
                {savingMatrix ? 'Saving...' : 'Save Privileges'}
              </Button>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {loadingRoleDetails ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : !selectedRole ? (
                <EmptyState message="Select a role on the left to map its permissions." icon="solar:key-bold-duotone" />
              ) : (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                    <div key={moduleName} className="mb-4 bg-light p-3 rounded">
                      <h6 className="fw-bold text-primary text-uppercase fs-12 mb-3 pb-2 border-bottom">
                        {moduleName} Module
                      </h6>
                      <Row>
                        {perms.map((perm) => {
                          const isChecked = pendingPermissionIds.includes(perm.id)
                          return (
                            <Col md={6} key={perm.id} className="mb-2">
                              <Form.Check
                                type="checkbox"
                                id={`perm-${perm.id}`}
                                label={
                                  <div className="ms-1">
                                    <strong className="text-dark fs-13 d-block">{perm.key}</strong>
                                    {perm.description && (
                                      <span className="text-muted fs-11 d-block">{perm.description}</span>
                                    )}
                                  </div>
                                }
                                checked={isChecked}
                                onChange={() => handleMatrixCheckboxChange(perm.id)}
                              />
                            </Col>
                          )
                        })}
                      </Row>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CREATE / EDIT ROLE MODAL */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Form onSubmit={handleRoleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">{editingRoleId ? 'Edit Role Metadata' : 'Create Access Role'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Role Name</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. support_staff"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe administrative permissions mapping..."
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Role'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
