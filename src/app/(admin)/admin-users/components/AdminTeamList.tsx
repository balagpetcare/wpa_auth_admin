'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Tab, Tabs, Table, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationContext } from '@/context/useNotificationContext'
import { adminTeamApi, apiClient } from '@/lib/apiClient'
import { useRouter } from 'next/navigation'

export default function AdminTeamList() {
  const { accessToken, user: currentAdmin } = useAuth()
  const { showNotification } = useNotificationContext()
  const router = useRouter()

  // State for Lists
  const [admins, setAdmins] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true))
  const [loadingInvites, setLoadingInvites] = useState(true))

  // Filters
  const [adminSearch, setAdminSearch] = useState(''
  const [adminRoleFilter, setAdminRoleFilter] = useState(''
  const [adminStatusFilter, setAdminStatusFilter] = useState('ALL'

  const [inviteStatusFilter, setInviteStatusFilter] = useState('all'
  const [inviteSearch, setInviteSearch] = useState(''

  // Statistics
  const [stats, setStats] = useState({
    activeAdmins: 0,
    pendingInvites: 0,
    expiredInvites: 0,
    superAdmins: 0,
  }

  // Modal State for Roles Management
  const [roleModal, setRoleModal] = useState<{
    show: boolean
    user: any
    selectedRoleIds: string[])
    saving: boolean
  }>({ show: false, user: null, selectedRoleIds: [], saving: false }

  // Modal State for Revoke Invitation
  const [revokeModal, setRevokeModal] = useState<{
    show: boolean
    invitation: any
    submitting: boolean
  }>({ show: false, invitation: null, submitting: false }

  // Form State for Sending Invite
  const [inviteForm, setInviteForm] = useState({
    email: '',
    roleIds: [] as string[],
    message: '',
    submitting: false,
    createdInviteUrl: null as string | null | undefined,
    emailConfigured: true
  }

  // Form State for Assigning Existing User
  const [assignForm, setAssignForm] = useState({
    searchQuery: '',
    searching: false,
    searchResults: [] as any[],
    selectedUser: null as any,
    roleIds: [] as string[],
    submitting: false,
  }

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    if (!accessToken) return
    try {
      const res: any = await apiClient(accessToken).get('/admin/roles'
      setRoles(res.roles || []
    } catch (err) {
      console.error('Failed to fetch roles', err
    }
)
  }, [accessToken])

  // Fetch Admin Users
  const fetchAdminUsers = useCallback(async () => {
    if (!accessToken) return
    setLoadingAdmins(true)
    try {
      const params: any = {})
      if (adminSearch) params.q = adminSearch
      if (adminRoleFilter) params.role = adminRoleFilter
      if (adminStatusFilter !== 'ALL') params.status = adminStatusFilter

      const res = await adminTeamApi(accessToken).listAdminUsers(params
      setAdmins(res.data.items || []
      
      // Calculate Stats
      const items = res.data.items || [])
      const active = items.filter((u: any) => u.status === 'ACTIVE').length
      const supers = items.filter((u: any) => u.roles.some((r: any) => ['super_admin', 'SUPER_ADMIN'].includes(r.name))).length
      setStats(prev => ({ ...prev, activeAdmins: active, superAdmins: supers })
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to load admin users.', variant: 'danger' }
    } finally {
      setLoadingAdmins(false)
    }
)
  }, [accessToken, adminSearch, adminRoleFilter, adminStatusFilter])

  // Fetch Invitations
  const fetchInvitations = useCallback(async () => {
    if (!accessToken) return
    setLoadingInvites(true)
    try {
      const params: any = {})
      if (inviteSearch) params.q = inviteSearch
      if (inviteStatusFilter !== 'all') params.status = inviteStatusFilter

      const res = await adminTeamApi(accessToken).listAdminInvitations(params
      setInvitations(res.data.items || []

      // Calculate Stats
      const items = res.data.items || [])
      const pending = items.filter((i: any) => i.status === 'PENDING' && new Date(i.expiresAt) > new Date()).length
      const expired = items.filter((i: any) => i.status === 'PENDING' && new Date(i.expiresAt) <= new Date()).length
      setStats(prev => ({ ...prev, pendingInvites: pending, expiredInvites: expired })
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to load invitations.', variant: 'danger' }
    } finally {
      setLoadingInvites(false)
    }
)
  }, [accessToken, inviteSearch, inviteStatusFilter])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  useEffect(() => {
    fetchAdminUsers()
  }, [fetchAdminUsers])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  // Handle Manage Roles
  const handleOpenRoleModal = (user: any) => {
    setRoleModal({
      show: true,
      user,
      selectedRoleIds: user.roles.map((r: any) => r.id),
      saving: false,
    }
  }

  const handleSaveRoles = async () => {
    if (!accessToken || !roleModal.user) return
    setRoleModal(prev => ({ ...prev, saving: true })
    try {
      const res = await adminTeamApi(accessToken).assignExistingUserAdmin({
        userId: roleModal.user.id,
        roleIds: roleModal.selectedRoleIds
      }
      showNotification({ message: res.message || 'Roles updated successfully.', variant: 'success' }
      setRoleModal(prev => ({ ...prev, show: false })
      fetchAdminUsers()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to update roles.', variant: 'danger' }
    } finally {
      setRoleModal(prev => ({ ...prev, saving: false })
    }
  }

  // Handle Remove Admin Access
  const handleRemoveAdminAccess = (user: any) => {
    // Overwrite their roles to empty to revoke admin access
    const isSelf = user.id === currentAdmin?.id
    if (isSelf) {
      showNotification({ message: 'For safety reasons, you cannot revoke your own admin access.', variant: 'danger' }
      return
    }

    if (window.confirm(`Are you sure you want to revoke all admin privileges for ${user.displayName || user.username || user.email}?`)) {
      setRoleModal(prev => ({ ...prev, saving: true })
      adminTeamApi(accessToken!
        .assignExistingUserAdmin({ userId: user.id, roleIds: [] }
        .then((res) => {
          showNotification({ message: res.message || 'Admin privileges revoked successfully.', variant: 'success' }
          fetchAdminUsers()
        }
        .catch((err) => {
          showNotification({ message: err.message || 'Failed to revoke admin privileges.', variant: 'danger' }
        }
    }
  }

  // Handle Send Invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    if (!inviteForm.email || inviteForm.roleIds.length === 0) {
      showNotification({ message: 'Please provide an email and select at least one role.', variant: 'warning' }
      return
    }

    setInviteForm(prev => ({ ...prev, submitting: true, createdInviteUrl: null })
    try {
      const res = await adminTeamApi(accessToken).createAdminInvitation({
        email: inviteForm.email,
        roleIds: inviteForm.roleIds,
        message: inviteForm.message
      }
      showNotification({ message: res.message || 'Invitation sent.', variant: 'success' }
      setInviteForm(prev => ({
        ...prev,
        email: '',
        roleIds: [],
        message: '',
        createdInviteUrl: res.inviteUrl,
        emailConfigured: res.emailConfigured
      })
      fetchInvitations()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to send invitation.', variant: 'danger' }
    } finally {
      setInviteForm(prev => ({ ...prev, submitting: false })
    }
  }

  // Handle Search Users for Existing Assignment
  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken || !assignForm.searchQuery) return
    setAssignForm(prev => ({ ...prev, searching: true, searchResults: [] })
    try {
      const res: any = await apiClient(accessToken).get(`/admin/users?q=${encodeURIComponent(assignForm.searchQuery)}&limit=5`
      setAssignForm(prev => ({ ...prev, searchResults: res.data?.items || [] })
    } catch (err: any) {
      showNotification({ message: 'Failed to search users.', variant: 'danger' }
    } finally {
      setAssignForm(prev => ({ ...prev, searching: false })
    }
  }

  // Handle Assign Existing Admin
  const handleAssignExistingAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    if (!assignForm.selectedUser || assignForm.roleIds.length === 0) {
      showNotification({ message: 'Please select a user and assign at least one role.', variant: 'warning' }
      return
    }

    setAssignForm(prev => ({ ...prev, submitting: true })
    try {
      const res = await adminTeamApi(accessToken).assignExistingUserAdmin({
        userId: assignForm.selectedUser.id,
        roleIds: assignForm.roleIds
      }
      showNotification({ message: res.message || 'Admin granted access.', variant: 'success' }
      setAssignForm({
        searchQuery: '',
        searching: false,
        searchResults: [],
        selectedUser: null,
        roleIds: [],
        submitting: false,
      }
      fetchAdminUsers()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to assign role.', variant: 'danger' }
    } finally {
      setAssignForm(prev => ({ ...prev, submitting: false })
    }
  }

  // Handle Resend Invitation
  const handleResendInvitation = async (invite: any) => {
    if (!accessToken) return
    try {
      const res = await adminTeamApi(accessToken).resendAdminInvitation(invite.id
      showNotification({ message: res.message || 'Invitation resent successfully.', variant: 'success' }
      if (res.inviteUrl) {
        // Log or show invite URL for local dev
        showNotification({ message: `Local dev link: ${res.inviteUrl}`, variant: 'info' }
      }
      fetchInvitations()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to resend invitation.', variant: 'danger' }
    }
  }

  // Handle Revoke Invitation
  const handleOpenRevokeModal = (invitation: any) => {
    setRevokeModal({ show: true, invitation, submitting: false }
  }

  const handleRevokeInvitation = async () => {
    if (!accessToken || !revokeModal.invitation) return
    setRevokeModal(prev => ({ ...prev, submitting: true })
    try {
      await adminTeamApi(accessToken).revokeAdminInvitation(revokeModal.invitation.id
      showNotification({ message: 'Invitation revoked successfully.', variant: 'success' }
      setRevokeModal({ show: false, invitation: null, submitting: false }
      fetchInvitations()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to revoke invitation.', variant: 'danger' }
    } finally {
      setRevokeModal(prev => ({ ...prev, submitting: false })
    }
  }

  const isActorSuperAdmin = currentAdmin?.roles?.some((r: any) => ['super_admin', 'SUPER_ADMIN'].includes(r.name || r)

  return ()
    <>
      {/* Summary Cards */})
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-0 bg-white">
            <CardBody className="d-flex align-items-center">
              <div className="rounded-circle bg-primary-subtle text-primary p-3 me-3">
                <IconifyIcon icon="solar:users-group-two-rounded-bold-duotone" className="fs-24" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{stats.activeAdmins}</h4>
                <p className="text-muted mb-0 fs-13">Active Admins</p>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 bg-white">
            <CardBody className="d-flex align-items-center">
              <div className="rounded-circle bg-info-subtle text-info p-3 me-3">
                <IconifyIcon icon="solar:shield-bold-duotone" className="fs-24" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{stats.superAdmins}</h4>
                <p className="text-muted mb-0 fs-13">Super Admins</p>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 bg-white">
            <CardBody className="d-flex align-items-center">
              <div className="rounded-circle bg-warning-subtle text-warning p-3 me-3">
                <IconifyIcon icon="solar:bell-bing-bold-duotone" className="fs-24" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{stats.pendingInvites}</h4>
                <p className="text-muted mb-0 fs-13">Pending Invites</p>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 bg-white">
            <CardBody className="d-flex align-items-center">
              <div className="rounded-circle bg-danger-subtle text-danger p-3 me-3">
                <IconifyIcon icon="solar:danger-triangle-bold-duotone" className="fs-24" />
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{stats.expiredInvites}</h4>
                <p className="text-muted mb-0 fs-13">Expired Invites</p>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 bg-white">
        <CardBody className="p-0">
          <Tabs defaultActiveKey="members" className="nav-tabs-custom px-3 pt-2 border-bottom">
            
            {/* Tab 1: Admin Members */})
            <Tab eventKey="members" title="Admin Members" className="p-3">
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <Form.Control 
                    type="text" 
                    placeholder="Search by email, name or username..." 
                    value={adminSearch} )
                    onChange={e => setAdminSearch(e.target.value)} 
                  />
                </Col>
                <Col md={3}>
                  <Form.Select value={adminRoleFilter} onChange={e => setAdminRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    {roles.map(r => <option value={r.name} key={r.id}>{r.name}</option>)}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select value={adminStatusFilter} onChange={e => setAdminStatusFilter(e.target.value)}>
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </Form.Select>
                </Col>
                <Col md={2} className="text-md-end">
                  <Button variant="primary" className="w-100" onClick={fetchAdminUsers}>
                    <IconifyIcon icon="bx:refresh" className="me-1 align-middle" /> Refresh
                  </Button>
                </Col>
              </Row>

              {loadingAdmins ? ()
                <div className="text-center py-5"><Spinner animation="border" /></div>
              ) : admins.length === 0 ? ()
                <div className="text-center py-5 text-muted">No admin users found matching filters.</div>
              ) : ()
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Admin User</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Roles</th>
                        <th>Last Login</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map(user => ()
                        <tr key={user.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="avatar-title bg-primary-subtle text-primary rounded-circle fw-semibold fs-14 d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
                                {(user.displayName || user.username || user.email || 'U').charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <h6 className="mb-0 fs-14">{user.displayName || user.username}</h6>
                                <small className="text-muted">@{user.username}</small>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <Badge bg={user.status === 'ACTIVE' ? 'success' : 'warning'}>{user.status}</Badge>
                          </td>
                          <td>
                            {user.roles?.map((r: any) => ()
                              <Badge bg="primary-subtle" text="primary" className="me-1" key={r.id}>{r.name}</Badge>
                            ))}
                          </td>
                          <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                          <td className="text-end">
                            <Button variant="light" size="sm" className="me-1" onClick={() => router.push(`/users/${user.id}`)}>
                              View
                            </Button>
                            <Button variant="light" size="sm" className="me-1 text-primary" onClick={() => handleOpenRoleModal(user)}>
                              Manage Roles
                            </Button>
                            <Button 
                              variant="light" 
                              size="sm" 
                              className="text-danger" 
                              onClick={() => handleRemoveAdminAccess(user)}
                              disabled={user.isLastSuperAdmin || user.id === currentAdmin?.id})
                              title={user.isLastSuperAdmin ? 'Cannot demote the last Super Admin' : user.id === currentAdmin?.id ? 'Cannot demote yourself' : 'Remove admin access'})
                            >
                              Revoke Access
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>

            {/* Tab 2: Pending Invitations */})
            <Tab eventKey="invitations" title="Pending Invitations" className="p-3">
              <Row className="g-3 mb-3">
                <Col md={5}>
                  <Form.Control 
                    type="text" 
                    placeholder="Search by email..." 
                    value={inviteSearch} )
                    onChange={e => setInviteSearch(e.target.value)} 
                  />
                </Col>
                <Col md={4}>
                  <Form.Select value={inviteStatusFilter} onChange={e => setInviteStatusFilter(e.target.value)}>
                    <option value="all">All Invitation Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REVOKED">Revoked</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="text-md-end">
                  <Button variant="primary" className="w-100" onClick={fetchInvitations}>
                    <IconifyIcon icon="bx:refresh" className="me-1 align-middle" /> Refresh
                  </Button>
                </Col>
              </Row>

              {loadingInvites ? ()
                <div className="text-center py-5"><Spinner animation="border" /></div>
              ) : invitations.length === 0 ? ()
                <div className="text-center py-5 text-muted">No invitations found.</div>
              ) : ()
                <div className="table-responsive">
                  <Table hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Email</th>
                        <th>Intended Roles</th>
                        <th>Invited By</th>
                        <th>Status</th>
                        <th>Expires At</th>
                        <th>Created At</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map(invite => {
                        const isExpired = new Date(invite.expiresAt) < new Date() && invite.status === 'PENDING'
                        return ()
                          <tr key={invite.id}>
                            <td>{invite.email}</td>
                            <td>
                              {invite.roles?.map((r: any) => ()
                                <Badge bg="info-subtle" text="info" className="me-1" key={r.id}>{r.name}</Badge>
                              ))}
                            </td>
                            <td>{invite.invitedBy?.displayName || invite.invitedBy?.email || 'System'}</td>
                            <td>
                              {isExpired ? ()
                                <Badge bg="danger">EXPIRED</Badge>
                              ) : ()
                                <Badge bg={invite.status === 'PENDING' ? 'warning' : invite.status === 'ACCEPTED' ? 'success' : 'secondary'}>
                                  {invite.status})
                                </Badge>
                              )}
                            </td>
                            <td>{new Date(invite.expiresAt).toLocaleDateString()}</td>
                            <td>{new Date(invite.createdAt).toLocaleDateString()}</td>
                            <td className="text-end">
                              {invite.status === 'PENDING' && ()
                                <>
                                  <Button variant="light" size="sm" className="me-1 text-primary" onClick={() => void handleResendInvitation(invite)}>
                                    Resend
                                  </Button>
                                  <Button variant="light" size="sm" className="text-danger" onClick={() => handleOpenRevokeModal(invite)}>
                                    Revoke
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Tab>

            {/* Tab 3: Invite Admin */})
            <Tab eventKey="invite" title="Invite / Assign Admin" className="p-4">
              <Row className="g-4">
                
                {/* Column 1: Invite New User by Email */})
                <Col lg={6} className="border-end">
                  <h5 className="mb-3 fw-semibold">Invite New User</h5>
                  <p className="text-muted small">Send a secure link by email to set up their administrative account.</p>
                  
                  <Form onSubmit={handleSendInvite}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Email Address</Form.Label>
                      <Form.Control 
                        type="email" 
                        placeholder="admin@wpa.com" 
                        value={inviteForm.email} )
                        onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))} 
                        required 
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Assign System Roles</Form.Label>
                      <div className="d-flex flex-column gap-2 p-3 border rounded bg-light-subtle">
                        {roles
                          .filter(r => ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(r.name)
                          .map(role => {
                            const isSuper = ['super_admin', 'SUPER_ADMIN'].includes(role.name
                            return ()
                              <Form.Check 
                                type="checkbox"
                                id={`invite-role-${role.id}`}
                                key={role.id})
                                label={
                                  <span>
                                    <strong>{role.name}</strong> - <span className="text-muted small">{role.description || 'System Access'}</span>
                                    {isSuper && <Badge bg="danger" className="ms-2">Super Admin Privileged</Badge>})
                                  </span>
                                }
                                checked={inviteForm.roleIds.includes(role.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setInviteForm(prev => ({ ...prev, roleIds: [...prev.roleIds, role.id] })
                                  } else {
                                    setInviteForm(prev => ({ ...prev, roleIds: prev.roleIds.filter(id => id !== role.id) })
                                  }
                                }}
                                disabled={isSuper && !isActorSuperAdmin})
                              />
                            
                          })}
                      </div>
                      {!isActorSuperAdmin && ()
                        <Form.Text className="text-danger small">
                          * Super Admin assignment is disabled. Only a Super Admin can assign the Super Admin role.
                        </Form.Text>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Optional Message</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={3} )
                        placeholder="Specify organization, department, or guidelines..." 
                        value={inviteForm.message} )
                        onChange={e => setInviteForm(prev => ({ ...prev, message: e.target.value }))} 
                      />
                    </Form.Group>

                    <Button type="submit" variant="primary" disabled={inviteForm.submitting}>
                      {inviteForm.submitting ? <Spinner size="sm" animation="border" /> : 'Send Invitation Link'})
                    </Button>
                  </Form>

                  {/* Local Development URL Display */})
                  {inviteForm.createdInviteUrl && ()
                    <div className="mt-4 p-3 border rounded bg-info-subtle border-info text-info-emphasis">
                      <h6 className="fw-bold mb-2">Local Developer Link (Copied from UI):</h6>
                      <code className="text-break bg-white p-2 rounded d-block mb-2">{inviteForm.createdInviteUrl}</code>
                      <Button size="sm" variant="outline-info" onClick={() => {
                        navigator.clipboard.writeText(inviteForm.createdInviteUrl!
                        showNotification({ message: 'Copied link to clipboard.', variant: 'success' }
                      }}>
                        Copy Link
                      </Button>
                      <div className="small mt-2">* Visible for local dev testing (NODE_ENV !== production). Email service configured: {inviteForm.emailConfigured ? 'Yes' : 'No'}.</div>
                    </div>
                  )}
                </Col>

                {/* Column 2: Assign Existing Registered User */})
                <Col lg={6}>
                  <h5 className="mb-3 fw-semibold">Assign Existing Registered User</h5>
                  <p className="text-muted small">Promote an existing WPA Central Auth account to the admin team instantly.</p>
                  
                  <Form onSubmit={handleSearchUsers} className="mb-4">
                    <Form.Label className="fw-semibold">Search Existing User</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control 
                        type="text" 
                        placeholder="Search by email, name or username..." 
                        value={assignForm.searchQuery})
                        onChange={e => setAssignForm(prev => ({ ...prev, searchQuery: e.target.value }))}
                        required
                      />
                      <Button type="submit" variant="outline-secondary" disabled={assignForm.searching}>
                        {assignForm.searching ? <Spinner size="sm" animation="border" /> : 'Search'})
                      </Button>
                    </div>
                  </Form>

                  {/* Search Results */})
                  {assignForm.searchResults.length > 0 && ()
                    <div className="mb-4">
                      <h6 className="fw-semibold small text-muted mb-2">Search Results:</h6>
                      <div className="list-group">
                        {assignForm.searchResults.map(u => {
                          const isAlreadyAdmin = u.roles?.some((r: any) => ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(r.name)
                          return ()
                            <button
                              type="button"
                              key={u.id})
                              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${assignForm.selectedUser?.id === u.id ? 'active' : ''}`}
                              onClick={() => setAssignForm(prev => ({ ...prev, selectedUser: u }))}
                              disabled={isAlreadyAdmin})
                            >
                              <div>
                                <div className="fw-semibold">{u.displayName || u.username}</div>
                                <div className="small text-muted">{u.email}</div>
                              </div>
                              {isAlreadyAdmin && <Badge bg="secondary">Already Admin</Badge>})
                            </button>
                          
                        })}
                      </div>
                    </div>
                  )}

                  {/* Assign Role Section for Selected User */})
                  {assignForm.selectedUser && ()
                    <Form onSubmit={handleAssignExistingAdmin}>
                      <div className="p-3 border rounded bg-light-subtle mb-3">
                        <div className="small text-muted mb-1">Target Account</div>
                        <h6 className="fw-bold mb-0">{assignForm.selectedUser.displayName || assignForm.selectedUser.username}</h6>
                        <div className="small">{assignForm.selectedUser.email}</div>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Assign System Roles</Form.Label>
                        <div className="d-flex flex-column gap-2 p-3 border rounded bg-light-subtle">
                          {roles
                            .filter(r => ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(r.name)
                            .map(role => {
                              const isSuper = ['super_admin', 'SUPER_ADMIN'].includes(role.name
                              return ()
                                <Form.Check 
                                  type="checkbox"
                                  id={`assign-role-${role.id}`}
                                  key={role.id})
                                  label={
                                    <span>
                                      <strong>{role.name}</strong> - <span className="text-muted small">{role.description || 'System Access'}</span>
                                      {isSuper && <Badge bg="danger" className="ms-2">Super Admin Privileged</Badge>})
                                    </span>
                                  }
                                  checked={assignForm.roleIds.includes(role.id)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setAssignForm(prev => ({ ...prev, roleIds: [...prev.roleIds, role.id] })
                                    } else {
                                      setAssignForm(prev => ({ ...prev, roleIds: prev.roleIds.filter(id => id !== role.id) })
                                    }
                                  }}
                                  disabled={isSuper && !isActorSuperAdmin})
                                />
                              
                            })}
                        </div>
                      </Form.Group>

                      <Button type="submit" variant="primary" disabled={assignForm.submitting}>
                        {assignForm.submitting ? <Spinner size="sm" animation="border" /> : 'Grant Admin Privileges'})
                      </Button>
                    </Form>
                  )}
                </Col>

              </Row>
            </Tab>

          </Tabs>
        </CardBody>
      </Card>

      {/* Roles Editing Modal */})
      <Modal show={roleModal.show} onHide={() => !roleModal.saving && setRoleModal(prev => ({ ...prev, show: false }))} centered>
        <Modal.Header closeButton={!roleModal.saving}>
          <Modal.Title>Manage System Roles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {roleModal.user && ()
            <>
              <div className="mb-3">
                <h6 className="fw-semibold mb-0">{roleModal.user.displayName || roleModal.user.username}</h6>
                <small className="text-muted">{roleModal.user.email}</small>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Admin Roles</Form.Label>
                <div className="d-flex flex-column gap-2 p-3 border rounded bg-light-subtle">
                  {roles
                    .filter(r => ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(r.name)
                    .map(role => {
                      const isSuper = ['super_admin', 'SUPER_ADMIN'].includes(role.name
                      return ()
                        <Form.Check 
                          type="checkbox"
                          id={`modal-role-${role.id}`}
                          key={role.id})
                          label={
                            <span>
                              <strong>{role.name}</strong>
                              {isSuper && <Badge bg="danger" className="ms-2">Super Admin Privileged</Badge>})
                            </span>
                          }
                          checked={roleModal.selectedRoleIds.includes(role.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setRoleModal(prev => ({ ...prev, selectedRoleIds: [...prev.selectedRoleIds, role.id] })
                            } else {
                              setRoleModal(prev => ({ ...prev, selectedRoleIds: prev.selectedRoleIds.filter(id => id !== role.id) })
                            }
                          }}
                          disabled={isSuper && !isActorSuperAdmin})
                        />
                      
                    })}
                </div>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setRoleModal(prev => ({ ...prev, show: false }))} disabled={roleModal.saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveRoles} disabled={roleModal.saving}>
            {roleModal.saving ? <Spinner size="sm" animation="border" /> : 'Save Roles'})
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Revoke Modal */})
      <Modal show={revokeModal.show} onHide={() => !revokeModal.submitting && setRevokeModal(prev => ({ ...prev, show: false }))} centered>
        <Modal.Header closeButton={!revokeModal.submitting}>
          <Modal.Title>Revoke Invitation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {revokeModal.invitation && ()
            <p className="mb-0 fs-14">
              Are you sure you want to revoke the pending invitation for <strong>{revokeModal.invitation.email}</strong>?
              This will immediately invalidate the verification link.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setRevokeModal(prev => ({ ...prev, show: false }))} disabled={revokeModal.submitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRevokeInvitation} disabled={revokeModal.submitting}>
            {revokeModal.submitting ? <Spinner size="sm" animation="border" /> : 'Revoke'})
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  
}
