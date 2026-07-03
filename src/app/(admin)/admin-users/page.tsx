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
  Offcanvas,
  Tabs,
  Tab,
  Spinner,
  Badge,
  Alert
} from 'react-bootstrap'
import { adminUsersApi } from '@/features/admin-users/api'
import { AdminUser, AdminInvitation, Role } from '@/features/admin-users/types'
import { useAuth } from '@/context/useAuthContext'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatusBadge, EmptyState } from '@/components/dashboard/DashboardComponents'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'
import adminToast from '@/lib/adminToast'
import { getAdminErrorMessage } from '@/lib/adminErrorMessage'

const normalizeAdminUsers = (response: any): AdminUser[] => {
  const candidates = [
    response?.data?.items,
    response?.data?.users,
    response?.data?.data,
    response?.items,
    response?.users,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

const normalizeInvitations = (response: any): AdminInvitation[] => {
  const candidates = [
    response?.data?.items,
    response?.data?.invitations,
    response?.data?.data,
    response?.items,
    response?.invitations,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

export default function AdminUsersPage() {
  const { admin: currentAdmin } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  const [loadingUsers, setLoadingUsers] = useState(true)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('')

  // Modals / Drawer state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [selectedInviteRoles, setSelectedInviteRoles] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  // Confirmation Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'activate' | 'reset-pass' | 'revoke-invite' | 'resend-invite'
    targetId: string
    title: string
    message: string
    isSuperAdminWarning?: boolean
  } | null>(null)

  // Role editing in drawer
  const [editingRoles, setEditingRoles] = useState(false)
  const [userRolesMap, setUserRolesMap] = useState<string[]>([])

  // Invitations tab (Phase 2: docs/phase-2-core-identity-admin-modules.md)
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  const [invitationsError, setInvitationsError] = useState<{ message: string; status?: number } | null>(null)
  const [invitationsLoaded, setInvitationsLoaded] = useState(false)

  const loadUsers = async () => {
    setLoadingUsers(true)
    setPageError(null)
    try {
      const response = await adminUsersApi.listAdminUsers({
        q: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        role: roleFilter || undefined,
        limit: 50,
      })
      if (response.success) {
        setUsers(normalizeAdminUsers(response))
      }
    } catch (error: any) {
      console.error('Failed to load users:', error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setPageError({ message: 'You do not have permission to view admin users.', status: error.status })
        } else if (error.status === 404) {
          setPageError({ message: 'Admin users endpoint is unavailable.', status: error.status })
        } else {
          setPageError({ message: error.message || 'Unable to load admin users.', status: error.status })
        }
      } else {
        setPageError({ message: 'Unable to load admin users.' })
      }
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadRoles = async () => {
    setRolesLoading(true)
    try {
      const response = await adminUsersApi.listRoles()
      if (response.success && response.roles) {
        setRoles(response.roles)
      }
    } catch (error: any) {
      console.error('Failed to load roles:', error)
    } finally {
      setRolesLoading(false)
    }
  }

  const loadInvitations = async () => {
    setInvitationsLoading(true)
    setInvitationsError(null)
    try {
      const response = await adminUsersApi.listInvitations({ limit: 50 })
      if (response.success) {
        setInvitations(normalizeInvitations(response))
      }
      setInvitationsLoaded(true)
    } catch (error: any) {
      console.error('Failed to load invitations:', error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setInvitationsError({ message: 'You do not have permission to view admin invitations.', status: error.status })
        } else {
          setInvitationsError({ message: error.message || 'Unable to load invitations.', status: error.status })
        }
      } else {
        setInvitationsError({ message: 'Unable to load invitations.' })
      }
    } finally {
      setInvitationsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [searchTerm, statusFilter, roleFilter])

  const handleTabChange = (key: string | null) => {
    if (key === 'invitations') {
      loadInvitations()
    } else {
      loadUsers()
    }
  }

  // --- ACTIONS ---
  const handleOpenConfirm = (
    type: 'suspend' | 'activate' | 'reset-pass' | 'revoke-invite' | 'resend-invite',
    targetId: string,
    title: string,
    message: string,
    isSuperAdminWarning = false
  ) => {
    setConfirmAction({ type, targetId, title, message, isSuperAdminWarning })
    setShowConfirmModal(true)
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    const { type, targetId } = confirmAction

    try {
      if (type === 'suspend' && confirmAction.isSuperAdminWarning) {
        // Phase 1 audit fix (docs/central-auth-api-admin-scalability-audit.md):
        // this warning used to be cosmetic only — it displayed a message but
        // still allowed the request through, relying entirely on backend
        // enforcement. The Suspend button is now disabled for the last super
        // admin (see the users table below), so this only fires as a
        // defense-in-depth fallback in case this action is ever reachable
        // through another path. Backend enforcement (guardLastSuperAdmin in
        // admin.service.ts) remains the source of truth either way.
        adminToast.error('Cannot suspend the last active super admin.')
        setActionLoading(false)
        setShowConfirmModal(false)
        setConfirmAction(null)
        return
      }

      if (type === 'suspend') {
        const res = await adminUsersApi.updateUserStatus(targetId, 'SUSPENDED')
        if (res.success) {
          adminToast.success('Admin user status set to SUSPENDED.', 'The administrator was suspended successfully.')
          loadUsers()
          if (selectedUser?.id === targetId) {
            setSelectedUser({ ...selectedUser, status: 'SUSPENDED' })
          }
        }
      } else if (type === 'activate') {
        const res = await adminUsersApi.updateUserStatus(targetId, 'ACTIVE')
        if (res.success) {
          adminToast.success('Admin user status activated.', 'The administrator account is active again.')
          loadUsers()
          if (selectedUser?.id === targetId) {
            setSelectedUser({ ...selectedUser, status: 'ACTIVE' })
          }
        }
      } else if (type === 'reset-pass') {
        const res = await adminUsersApi.resetPassword(targetId)
        if (res.success) {
          adminToast.success('Password reset successful.', 'A temporary password was generated and must be shared securely.', { autoClose: false })
        }
      } else if (type === 'revoke-invite') {
        const res = await adminUsersApi.revokeInvitation(targetId)
        if (res.success) {
          adminToast.success('Invitation revoked.', 'The invitation can no longer be accepted.')
          loadInvitations()
        }
      } else if (type === 'resend-invite') {
        const res = await adminUsersApi.resendInvitation(targetId)
        if (res.success) {
          adminToast.success('Invitation resent successfully.', 'The invitation was sent again.')
          loadInvitations()
        }
      }
    } catch (error: any) {
      console.error('Action execution failed:', error)
      adminToast.error('Request failed.', getAdminErrorMessage(error, 'Please try again.'))
    } finally {
      setActionLoading(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedInviteRoles.length === 0) {
      adminToast.warning('Please assign at least one role to the invitee.')
      return
    }
    setActionLoading(true)
    try {
      const response = await adminUsersApi.inviteAdmin({
        email: inviteEmail,
        roleIds: selectedInviteRoles,
        message: inviteMessage || undefined,
      })
      if (response.success) {
        adminToast.success(`Invitation successfully dispatched to ${inviteEmail}`, 'The invitation email was sent successfully.')
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteMessage('')
        setSelectedInviteRoles([])
      }
    } catch (error: any) {
      console.error('Invite failed:', error)
      if (error instanceof ApiError) {
        if (error.status === 403) {
          adminToast.error('You do not have permission to send invitations.')
        } else if (error.status === 404) {
          adminToast.error('Invitation endpoint is unavailable.')
        } else if (error.status === 501) {
          adminToast.error('Invitation sending is not implemented in the backend yet.')
        } else {
          adminToast.error('Failed to issue administrative invitation.', error.message || 'Please try again.')
        }
      } else {
        adminToast.error('Failed to issue administrative invitation.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Drawer interactions
  const handleOpenDrawer = (user: AdminUser) => {
    setSelectedUser(user)
    setUserRolesMap(user.roles.map((r) => r.id))
    setEditingRoles(false)
    setShowDrawer(true)
  }

  const handleRoleToggle = (roleId: string) => {
    if (userRolesMap.includes(roleId)) {
      setUserRolesMap(userRolesMap.filter((id) => id !== roleId))
    } else {
      setUserRolesMap([...userRolesMap, roleId])
    }
  }

  const handleSaveRoles = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      const originalRoleIds = selectedUser.roles.map((r) => r.id)
      const toAdd = userRolesMap.filter((id) => !originalRoleIds.includes(id))
      const toRemove = originalRoleIds.filter((id) => !userRolesMap.includes(id))

      // Check if user is trying to remove their own super_admin role
      const isSelf = selectedUser.id === currentAdmin?.id
      const removingSuperAdmin = toRemove.some((roleId) => {
        const roleName = roles.find((r) => r.id === roleId)?.name?.toLowerCase()
        return roleName === 'super_admin' || roleName === 'admin'
      })

      if (isSelf && removingSuperAdmin) {
        adminToast.error('Security restriction: You cannot revoke your own administrative privileges.')
        setActionLoading(false)
        return
      }

      // Add roles
      for (const rId of toAdd) {
        await adminUsersApi.assignRoleToUser(selectedUser.id, rId)
      }
      // Remove roles
      for (const rId of toRemove) {
        await adminUsersApi.removeRoleFromUser(selectedUser.id, rId)
      }

      adminToast.success('Administrator roles updated successfully.', 'The administrator permissions were saved successfully.')
      setEditingRoles(false)
      loadUsers()

      // Refresh drawer state
      const updatedUserRoles = roles.filter((r) => userRolesMap.includes(r.id))
      setSelectedUser({ ...selectedUser, roles: updatedUserRoles })
    } catch (error: any) {
      console.error('Failed to update roles:', error)
      adminToast.error('Error updating administrative privileges.', getAdminErrorMessage(error, 'Please try again.'))
    } finally {
      setActionLoading(false)
    }
  }

  if (pageError) {
    if (pageError.status === 403) {
      return (
        <ApiErrorState
          title="Permission Denied"
          message={pageError.message}
          status={pageError.status}
          onRetry={loadUsers}
        />
      )
    }

    return (
      <ApiErrorState
        title="Administrator Team Management Unavailable"
        message={pageError.message}
        status={pageError.status}
        onRetry={loadUsers}
      />
    )
  }

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Administrator Team Management</h4>
          <p className="text-muted mb-0 fs-13">Configure administrative access, assign security privileges, and invite operators.</p>
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)} className="d-flex align-items-center gap-1">
          <IconifyIcon icon="solar:user-plus-bold-duotone" className="fs-18" />
          Invite Administrator
        </Button>
      </div>

      <Tabs defaultActiveKey="users" id="admin-users-tabs" onSelect={handleTabChange} className="mb-4">
        {/* USERS LIST TAB */}
        <Tab eventKey="users" title="Team Directory">
          <Card className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
            <Card.Body className="p-0">
              {/* FILTERS */}
              <div className="p-4 border-bottom d-flex flex-wrap align-items-center gap-3">
                <div style={{ minWidth: '240px' }}>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div style={{ minWidth: '160px' }}>
                  <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                  </Form.Select>
                </div>
                <div style={{ minWidth: '160px' }}>
                  <Form.Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </div>

              {/* TABLE */}
              {loadingUsers ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : users.length === 0 ? (
                <EmptyState message="No administrators found matching current filters." icon="solar:users-group-two-rounded-bold-duotone" />
              ) : (
                <div className="table-responsive">
                  <Table className="align-middle mb-0" hover>
                    <thead className="table-light">
                      <tr>
                        <th>Operator</th>
                        <th>Status</th>
                        <th>Assigned Roles</th>
                        <th>Created</th>
                        <th className="text-end px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const isSelf = user.id === currentAdmin?.id
                        return (
                          <tr key={user.id} className={isSelf ? 'table-light-info' : ''}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-13" style={{ width: '36px', height: '36px' }}>
                                  {(user.displayName || user.username).substring(0, 2).toUpperCase()}
                                </div>
                                <div className="d-flex flex-column">
                                  <span className="fw-semibold text-dark fs-14">
                                    {user.displayName || user.username} {isSelf && <Badge bg="info" className="ms-1">You</Badge>}
                                  </span>
                                  <span className="text-muted fs-11">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <StatusBadge status={user.status} />
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {user.roles.map((role) => (
                                  <Badge key={role.id} bg="soft-secondary" className="text-secondary fw-medium px-2 py-1 fs-12">
                                    {role.name}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span className="text-secondary fs-13">{new Date(user.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="text-end px-4">
                              <div className="d-flex justify-content-end gap-1">
                                <Button variant="link" size="sm" className="p-0 text-primary me-2" onClick={() => handleOpenDrawer(user)}>
                                  Manage Access
                                </Button>
                                {user.status === 'ACTIVE' ? (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-danger"
                                    disabled={isSelf || user.isLastSuperAdmin}
                                    title={user.isLastSuperAdmin ? 'Cannot suspend the last active super admin.' : undefined}
                                    onClick={() =>
                                      handleOpenConfirm(
                                        'suspend',
                                        user.id,
                                        'Suspend Admin User?',
                                        `Are you sure you want to suspend access for ${user.displayName || user.username}? They will be logged out instantly and denied gateway entry.`,
                                        user.isLastSuperAdmin
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
                                        user.id,
                                        'Activate Admin User?',
                                        `Are you sure you want to restore active status for ${user.displayName || user.username}?`
                                      )
                                    }
                                  >
                                    Activate
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* INVITATIONS TAB */}
        {/* Phase 2 fix (docs/phase-2-core-identity-admin-modules.md): this
            used to be a permanent ApiRequiredState stub with dead
            resend/revoke handlers. The backend already gained
            GET/resend/revoke admin-invitations endpoints (with permission
            checks) in the Phase 1 pass — this tab now calls them for real. */}
        <Tab eventKey="invitations" title="Pending Invitations">
          {invitationsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : invitationsError ? (
            <ApiErrorState message={invitationsError.message} onRetry={loadInvitations} />
          ) : invitationsLoaded && invitations.length === 0 ? (
            <EmptyState message="No pending or past invitations found." icon="solar:letter-bold-duotone" />
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4">Invited Email</th>
                      <th>Role(s)</th>
                      <th>Status</th>
                      <th>Invited By</th>
                      <th>Expires</th>
                      <th className="text-end px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((invite) => (
                      <tr key={invite.id}>
                        <td className="px-4">
                          <span className="fw-semibold text-dark fs-14">{invite.email}</span>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {(invite.roles || []).map((role) => (
                              <Badge key={role.id} bg="soft-secondary" className="text-secondary fw-medium px-2 py-1 fs-12">
                                {role.name}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={invite.status} />
                        </td>
                        <td>
                          <span className="text-secondary fs-13">
                            {invite.invitedBy?.displayName || invite.invitedBy?.username || invite.invitedBy?.email || '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-secondary fs-13">{new Date(invite.expiresAt).toLocaleDateString()}</span>
                        </td>
                        <td className="text-end px-4">
                          {invite.status === 'PENDING' && (
                            <div className="d-flex justify-content-end gap-1">
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-primary"
                                onClick={() =>
                                  handleOpenConfirm(
                                    'resend-invite',
                                    invite.id,
                                    'Resend Invitation?',
                                    `Resend the invitation email to ${invite.email}?`
                                  )
                                }
                              >
                                Resend
                              </Button>
                              <span className="text-muted">|</span>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 text-danger"
                                onClick={() =>
                                  handleOpenConfirm(
                                    'revoke-invite',
                                    invite.id,
                                    'Revoke Invitation?',
                                    `Revoke the invitation for ${invite.email}? They will no longer be able to accept it.`
                                  )
                                }
                              >
                                Revoke
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>

      {/* ACCESS MANAGEMENT DRAWER */}
      <Offcanvas show={showDrawer} onHide={() => setShowDrawer(false)} placement="end" style={{ width: '450px' }}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold">Operator Profile</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column justify-content-between h-100">
          {selectedUser && (
            <div>
              <div className="text-center py-4 border-bottom mb-4">
                <div className="bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-20 mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                  {(selectedUser.displayName || selectedUser.username).substring(0, 2).toUpperCase()}
                </div>
                <h5 className="fw-bold text-dark mb-1">{selectedUser.displayName || selectedUser.username}</h5>
                <span className="text-muted fs-12">{selectedUser.email}</span>
                <div className="mt-3">
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>

              {/* DETAILS SECTION */}
              <div className="mb-4">
                <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-3">Operator Properties</h6>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                  <li className="d-flex justify-content-between fs-13">
                    <span className="text-muted">Username:</span>
                    <strong className="text-dark">{selectedUser.username}</strong>
                  </li>
                  <li className="d-flex justify-content-between fs-13">
                    <span className="text-muted">Registered At:</span>
                    <strong className="text-dark">{new Date(selectedUser.createdAt).toLocaleDateString()}</strong>
                  </li>
                  {selectedUser.lastLoginAt && (
                    <li className="d-flex justify-content-between fs-13">
                      <span className="text-muted">Last Activity:</span>
                      <strong className="text-dark">{new Date(selectedUser.lastLoginAt).toLocaleString()}</strong>
                    </li>
                  )}
                </ul>
              </div>

              {/* ROLES ASSIGNMENT */}
              <div className="border-top pt-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-0">Assigned Privileges</h6>
                  {!editingRoles ? (
                    <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => setEditingRoles(true)}>
                      Modify Roles
                    </Button>
                  ) : (
                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => { setEditingRoles(false); setUserRolesMap(selectedUser.roles.map(r => r.id)) }}>
                      Cancel
                    </Button>
                  )}
                </div>

                {!editingRoles ? (
                  <div className="d-flex flex-wrap gap-1">
                    {selectedUser.roles.map((role) => (
                      <Badge key={role.id} bg="soft-secondary" className="text-secondary px-2 py-1.5 fs-12">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {roles.map((role) => {
                      const isChecked = userRolesMap.includes(role.id)
                      return (
                        <Form.Check
                          type="checkbox"
                          id={`drawer-role-${role.id}`}
                          key={role.id}
                          label={
                            <div className="ms-1">
                              <strong className="text-dark fs-13 d-block">{role.name}</strong>
                              <span className="text-muted fs-11 d-block">{role.description}</span>
                            </div>
                          }
                          checked={isChecked}
                          onChange={() => handleRoleToggle(role.id)}
                        />
                      )
                    })}
                    <Button variant="primary" size="sm" className="mt-3" onClick={handleSaveRoles} disabled={actionLoading}>
                      {actionLoading ? 'Saving...' : 'Save Privileges'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="border-top pt-3 mt-4">
              <Button
                variant="outline-danger"
                className="w-100 mb-2"
                onClick={() =>
                  handleOpenConfirm(
                    'reset-pass',
                    selectedUser.id,
                    'Reset Credentials?',
                    `Are you sure you want to trigger a password reset for ${selectedUser.displayName || selectedUser.username}? A temporary password will be generated.`
                  )
                }
              >
                Reset Password
              </Button>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* INVITE OPERATOR MODAL */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered>
        <Form onSubmit={handleInviteSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Invite Administrator</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                required
                placeholder="operator@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Personal Message (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Instruction note or welcome message..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </Form.Group>

            <Form.Label className="fw-semibold d-block mb-2">Assign Privileges</Form.Label>
            <div className="d-flex flex-column gap-2 p-3 bg-light rounded" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {roles.map((role) => {
                const isChecked = selectedInviteRoles.includes(role.id)
                return (
                  <Form.Check
                    type="checkbox"
                    id={`invite-role-${role.id}`}
                    key={role.id}
                    label={
                      <div className="ms-1">
                        <strong className="text-dark fs-12">{role.name}</strong>
                        <span className="text-muted fs-10 d-block">{role.description}</span>
                      </div>
                    }
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        setSelectedInviteRoles(selectedInviteRoles.filter((id) => id !== role.id))
                      } else {
                        setSelectedInviteRoles([...selectedInviteRoles, role.id])
                      }
                    }}
                  />
                )
              })}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Sending...' : 'Dispatch Invitation'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* CONFIRMATION ACTION MODAL */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{confirmAction?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmAction?.isSuperAdminWarning && (
            <Alert variant="warning" className="d-flex align-items-start gap-2">
              <IconifyIcon icon="solar:danger-triangle-bold" className="fs-22 text-warning flex-shrink-0" />
              <div>
                <strong className="text-warning-emphasis">Critical Super Admin Protection Warning</strong>
                <p className="fs-12 text-warning-emphasis mb-0 mt-1">
                  This user is currently the last Super Admin in the system database. Disabling or modifying their status could lockout all administrative operators.
                </p>
              </div>
            </Alert>
          )}
          <p className="mb-0 fs-14">{confirmAction?.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowConfirmModal(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant={confirmAction?.type === 'suspend' || confirmAction?.type === 'revoke-invite' ? 'danger' : 'success'}
            onClick={executeConfirmAction}
            disabled={actionLoading}
          >
            {actionLoading ? 'Executing...' : 'Confirm Action'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
