'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usersApi } from '@/lib/apiClient'
import { Card, CardBody, CardHeader, Spinner, Modal, Button, Row, Col, Badge } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useNotificationContext } from '@/context/useNotificationContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const UserDetail = ({ userId }: { userId: string }) => {
  const { accessToken, user: currentAdmin } = useAuth()
  const { showNotification } = useNotificationContext()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    actionFn: () => Promise<void>;
    destructive: boolean;
    loading: boolean;
  }>({ show: false, title: '', message: '', actionFn: async () => {}, destructive: false, loading: false })

  const fetchUser = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const res = await usersApi(accessToken).getUserDetail(userId)
      setUser(res.user)
    } catch (err: any) {
      showNotification({ message: 'Failed to load user details', variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }, [accessToken, userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const confirmAction = (title: string, message: string, actionFn: () => Promise<void>, destructive = false) => {
    setConfirmModal({ show: true, title, message, actionFn, destructive, loading: false })
  }

  const executeAction = async () => {
    setConfirmModal(prev => ({ ...prev, loading: true }))
    try {
      await confirmModal.actionFn()
    } finally {
      setConfirmModal(prev => ({ ...prev, show: false, loading: false }))
    }
  }

  const handleStatusChange = (newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!accessToken) return
    const actionName = newStatus === 'ACTIVE' ? 'activate' : 'suspend'
    confirmAction(
      `Confirm ${newStatus === 'ACTIVE' ? 'Activation' : 'Suspension'}`,
      `Are you sure you want to ${actionName} this user?`,
      async () => {
        try {
          await usersApi(accessToken).updateUserStatus(userId, newStatus)
          showNotification({ message: `User ${actionName}d successfully`, variant: 'success' })
          fetchUser()
        } catch (err: any) {
          showNotification({ message: err.message || `Failed to ${actionName} user`, variant: 'danger' })
        }
      },
      newStatus === 'SUSPENDED'
    )
  }

  const handleResetPassword = () => {
    if (!accessToken) return
    confirmAction(
      'Reset Password',
      'Are you sure you want to trigger a password reset for this user?',
      async () => {
        try {
          const res = await usersApi(accessToken).resetUserPassword(userId)
          showNotification({ message: res.message || 'Password reset triggered', variant: 'success' })
        } catch (err: any) {
          showNotification({ message: err.message || 'Failed to trigger reset', variant: 'danger' })
        }
      },
      false
    )
  }

  const handleDeleteUser = () => {
    if (!accessToken) return
    confirmAction(
      'Deactivate / Delete User',
      'Are you sure you want to delete this user? This action will disable their account permanently.',
      async () => {
        try {
          const res = await usersApi(accessToken).deleteOrDeactivateUser(userId)
          showNotification({ message: res.message || 'User deactivated successfully', variant: 'success' })
          fetchUser()
        } catch (err: any) {
          showNotification({ message: err.message || 'Failed to deactivate user', variant: 'danger' })
        }
      },
      true
    )
  }

  const handleRevokeSessions = () => {
    if (!accessToken) return
    confirmAction(
      'Revoke Sessions',
      'Are you sure you want to revoke all active sessions for this user? They will be logged out everywhere.',
      async () => {
        try {
          const res = await usersApi(accessToken).revokeUserSessions(userId)
          showNotification({ message: `Successfully revoked ${res.revokedCount} sessions.`, variant: 'success' })
          fetchUser()
        } catch (err: any) {
          showNotification({ message: err.message || 'Failed to revoke sessions', variant: 'danger' })
        }
      },
      true
    )
  }

  if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>
  if (!user) return <div className="p-5 text-center text-muted">User not found</div>

  return (
    <>
      <div className="mb-3">
        <Button variant="light" size="sm" onClick={() => router.push('/users')}>
          <IconifyIcon icon="bx:arrow-back" className="me-1" /> Back to Users
        </Button>
      </div>

      <Row>
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <CardBody className="text-center">
              <div className="avatar-xl mx-auto mb-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="img-fluid rounded-circle" />
                ) : (
                  <span className="avatar-title bg-primary-subtle text-primary rounded-circle fw-semibold fs-1">
                    {(user.displayName || user.username || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h4 className="mb-1">{user.displayName || user.username || 'No Name'}</h4>
              <p className="text-muted mb-2">{user.email}</p>
              <Badge bg={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'warning' : user.status === 'DELETED' ? 'danger' : 'secondary'} className="px-3 py-2 fs-13 mb-3">
                {user.status}
              </Badge>
              <div className="d-flex justify-content-center gap-2">
                {user.emailVerifiedAt && <Badge bg="success-subtle" text="success"><IconifyIcon icon="bx:check" /> Email Verified</Badge>}
                {user.phoneVerifiedAt && <Badge bg="success-subtle" text="success"><IconifyIcon icon="bx:check" /> Phone Verified</Badge>}
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border-0 mb-4">
            <CardHeader className="bg-white border-bottom py-3">
              <h5 className="mb-0">Security & Actions</h5>
            </CardHeader>
            <CardBody>
              {user.id === currentAdmin?.id && (
                <div className="alert alert-warning py-2 px-3 mb-3 fs-13">
                  <IconifyIcon icon="bx:error-circle" className="me-1 align-middle text-warning" />
                  You are viewing your own profile. Self-suspension or deactivation is disabled.
                </div>
              )}
              {user.roles?.some((r: any) => ['super_admin', 'SUPER_ADMIN'].includes(r.name)) && user.id !== currentAdmin?.id && (
                <div className="alert alert-info py-2 px-3 mb-3 fs-13">
                  <IconifyIcon icon="bx:info-circle" className="me-1 align-middle text-info" />
                  This is a Super Admin account. Actions are restricted.
                </div>
              )}
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-primary" 
                  onClick={handleResetPassword}
                  disabled={user.id === currentAdmin?.id}
                >
                  <IconifyIcon icon="bx:lock-open" className="me-2" /> Reset Password
                </Button>
                <Button 
                  variant="outline-warning" 
                  onClick={handleRevokeSessions}
                  disabled={user.id === currentAdmin?.id}
                >
                  <IconifyIcon icon="bx:log-out-circle" className="me-2" /> Force Logout / Revoke Sessions
                </Button>
                {user.status === 'ACTIVE' ? (
                  <Button 
                    variant="outline-danger" 
                    onClick={() => handleStatusChange('SUSPENDED')}
                    disabled={user.id === currentAdmin?.id}
                  >
                    <IconifyIcon icon="bx:pause-circle" className="me-2" /> Suspend User
                  </Button>
                ) : (
                  <Button 
                    variant="outline-success" 
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={user.id === currentAdmin?.id}
                  >
                    <IconifyIcon icon="bx:play-circle" className="me-2" /> Activate User
                  </Button>
                )}
                <Button 
                  variant="danger" 
                  onClick={handleDeleteUser} 
                  disabled={user.status === 'DELETED' || user.id === currentAdmin?.id}
                >
                  <IconifyIcon icon="bx:trash" className="me-2" /> Deactivate Account
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0 mb-4">
            <CardHeader className="bg-white border-bottom py-3">
              <h5 className="mb-0">Profile Information</h5>
            </CardHeader>
            <CardBody>
              <Row className="mb-3">
                <Col sm={3}><p className="text-muted mb-0">ID</p></Col>
                <Col sm={9}><p className="mb-0">{user.id}</p></Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3}><p className="text-muted mb-0">Username</p></Col>
                <Col sm={9}><p className="mb-0">{user.username || '-'}</p></Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3}><p className="text-muted mb-0">Phone</p></Col>
                <Col sm={9}><p className="mb-0">{user.phone || '-'}</p></Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3}><p className="text-muted mb-0">Created At</p></Col>
                <Col sm={9}><p className="mb-0">{new Date(user.createdAt).toLocaleString()}</p></Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3}><p className="text-muted mb-0">Updated At</p></Col>
                <Col sm={9}><p className="mb-0">{new Date(user.updatedAt).toLocaleString()}</p></Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3}><p className="text-muted mb-0">Last Login</p></Col>
                <Col sm={9}><p className="mb-0">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</p></Col>
              </Row>
              <Row>
                <Col sm={3}><p className="text-muted mb-0">Last Password Change</p></Col>
                <Col sm={9}><p className="mb-0">{user.lastPasswordChangedAt ? new Date(user.lastPasswordChangedAt).toLocaleString() : 'Never'}</p></Col>
              </Row>
            </CardBody>
          </Card>

          <Card className="shadow-sm border-0 mb-4">
            <CardHeader className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Roles & Permissions</h5>
              <Button variant="light" size="sm" onClick={() => showNotification({ message: 'Role management coming soon', variant: 'info' })}>
                Manage Roles
              </Button>
            </CardHeader>
            <CardBody>
              {user.roles?.length ? (
                user.roles.map((r: any) => (
                  <Badge bg="primary" className="me-2 px-3 py-2 fs-13" key={r.id}>{r.name}</Badge>
                ))
              ) : (
                <p className="text-muted mb-0">No roles assigned.</p>
              )}
            </CardBody>
          </Card>

          <Row>
            <Col md={6}>
              <Card className="shadow-sm border-0 mb-4">
                <CardHeader className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Sessions</h5>
                  <Link href={`/sessions?userId=${user.id}`} className="btn btn-sm btn-light">View All</Link>
                </CardHeader>
                <CardBody className="p-0">
                  {user.recentSessions?.length ? (
                    <ul className="list-group list-group-flush">
                      {user.recentSessions.map((s: any) => (
                        <li className="list-group-item d-flex justify-content-between align-items-center" key={s.id}>
                          <div>
                            <p className="mb-0 fw-medium fs-13">{s.ipAddress || 'Unknown IP'}</p>
                            <p className="text-muted mb-0 fs-12 text-truncate" style={{ maxWidth: '200px' }}>{s.userAgent}</p>
                          </div>
                          <div className="text-end">
                            <span className="fs-12 text-muted d-block">{new Date(s.createdAt).toLocaleDateString()}</span>
                            {s.revokedAt ? <Badge bg="danger">Revoked</Badge> : <Badge bg="success">Active</Badge>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-muted">No recent sessions found.</div>
                  )}
                </CardBody>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="shadow-sm border-0 mb-4">
                <CardHeader className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">OAuth Accounts</h5>
                  <Link href={`/oauth-accounts?userId=${user.id}`} className="btn btn-sm btn-light">View All</Link>
                </CardHeader>
                <CardBody>
                  {user.oauthProviders?.length ? (
                    user.oauthProviders.map((provider: string) => (
                      <Badge bg="info" className="me-2 px-3 py-2 fs-13" key={provider}>{provider}</Badge>
                    ))
                  ) : (
                    <p className="text-muted mb-0">No linked OAuth accounts.</p>
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="shadow-sm border-0 mb-4">
                <CardHeader className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Audit Logs</h5>
                  <Link href={`/audit-logs?userId=${user.id}`} className="btn btn-sm btn-light">View All</Link>
                </CardHeader>
                <CardBody className="p-0">
                  {user.recentAuditLogs?.length ? (
                    <ul className="list-group list-group-flush">
                      {user.recentAuditLogs.map((log: any) => (
                        <li className="list-group-item py-2" key={log.id}>
                          <p className="mb-0 fs-13 fw-medium">{log.action}</p>
                          <p className="text-muted mb-0 fs-12">{new Date(log.createdAt).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-muted">No recent audit logs.</div>
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="shadow-sm border-0 mb-4">
                <CardHeader className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Security Events</h5>
                  <Link href={`/security-events?userId=${user.id}`} className="btn btn-sm btn-light">View All</Link>
                </CardHeader>
                <CardBody className="p-0">
                  {user.recentSecurityEvents?.length ? (
                    <ul className="list-group list-group-flush">
                      {user.recentSecurityEvents.map((evt: any) => (
                        <li className="list-group-item py-2" key={evt.id}>
                          <div className="d-flex justify-content-between">
                            <p className="mb-0 fs-13 fw-medium">{evt.type}</p>
                            <Badge bg={evt.severity === 'CRITICAL' || evt.severity === 'HIGH' ? 'danger' : 'warning'}>{evt.severity}</Badge>
                          </div>
                          <p className="text-muted mb-0 fs-12">{new Date(evt.createdAt).toLocaleString()}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-muted">No recent security events.</div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

        </Col>
      </Row>

      <Modal show={confirmModal.show} onHide={() => !confirmModal.loading && setConfirmModal(prev => ({ ...prev, show: false }))}>
        <Modal.Header closeButton={!confirmModal.loading}>
          <Modal.Title>{confirmModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">{confirmModal.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))} disabled={confirmModal.loading}>
            Cancel
          </Button>
          <Button variant={confirmModal.destructive ? 'danger' : 'primary'} onClick={executeAction} disabled={confirmModal.loading}>
            {confirmModal.loading ? <Spinner size="sm" animation="border" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default UserDetail
