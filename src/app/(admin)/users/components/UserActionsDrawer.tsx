'use client'
import { useState } from 'react'
import { Offcanvas, OffcanvasHeader, OffcanvasBody, Button, Badge, Modal, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { usersApi } from '@/lib/apiClient'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useRouter } from 'next/navigation'

type UserActionsDrawerProps = {
  show: boolean
  onHide: () => void
  user: any
  currentAdmin: any
  onSuccess: () => void
}

export const UserActionsDrawer = ({ show, onHide, user, currentAdmin, onSuccess }: UserActionsDrawerProps) => {
  const { showNotification } = useNotificationContext()
  const router = useRouter()
  const [modalState, setModalState] = useState<{
    show: boolean;
    title: string;
    message: string;
    actionFn: () => Promise<void>;
    destructive: boolean;
    loading: boolean;
  }>({ show: false, title: '', message: '', actionFn: async () => {}, destructive: false, loading: false }

  if (!user) return null

  const isSelf = user.id === currentAdmin?.id
  const isSuperAdmin = user.roles?.some((r: any) => ['super_admin', 'SUPER_ADMIN'].includes(r.name)

  const handleActionClick = (title: string, message: string, actionFn: () => Promise<void>, destructive = false) => {
    setModalState({ show: true, title, message, actionFn, destructive, loading: false }
  }

  const executeAction = async () => {
    setModalState(prev => ({ ...prev, loading: true })
    try {
      await modalState.actionFn()
      onSuccess()
      setModalState(prev => ({ ...prev, show: false, loading: false })
    } catch (err: any) {
      showNotification({ message: err.message || 'Operation failed', variant: 'danger' }
      setModalState(prev => ({ ...prev, loading: false })
    }
  }

  const triggerResetPassword = () => {
    handleActionClick()
      'Confirm Password Reset',
      'Are you sure you want to trigger a password reset for this user? If mail services are configured, they will receive an email instruction.',
      async () => {
        const res = await usersApi(currentAdmin?.accessToken || '').resetUserPassword(user.id
        showNotification({ message: res.message || 'Password reset triggered successfully.', variant: 'success' }
      }
    
  }

  const triggerStatusChange = (newStatus: 'ACTIVE' | 'SUSPENDED') => {
    const actionText = newStatus === 'ACTIVE' ? 'activate' : 'suspend'
    handleActionClick()
      `Confirm User ${newStatus === 'ACTIVE' ? 'Activation' : 'Suspension'}`,
      `Are you sure you want to ${actionText} this user's account?`,
      async () => {
        await usersApi(currentAdmin?.accessToken || '').updateUserStatus(user.id, newStatus
        showNotification({ message: `User status changed to ${newStatus}.`, variant: 'success' }
      },
      newStatus === 'SUSPENDED'
    
  }

  const triggerRevokeSessions = () => {
    handleActionClick()
      'Confirm Session Revocation',
      'Are you sure you want to invalidate all active login sessions and OAuth tokens for this user? This will log them out of all devices.',
      async () => {
        const res = await usersApi(currentAdmin?.accessToken || '').revokeUserSessions(user.id
        showNotification({ message: `Successfully revoked ${res.revokedCount} active sessions.`, variant: 'success' }
      },
      true
    
  }

  const triggerDeactivateUser = () => {
    handleActionClick()
      'Confirm Account Deactivation',
      'Are you sure you want to deactivate this account? This performs a safe enterprise soft-delete, immediately disabling all system logins and OAuth access.',
      async () => {
        const res = await usersApi(currentAdmin?.accessToken || '').deleteOrDeactivateUser(user.id
        showNotification({ message: res.message || 'User account successfully deactivated.', variant: 'success' }
      },
      true
    
  }

  return ()
    <>
      <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: '380px' }}>
        <OffcanvasHeader closeButton className="border-bottom">
          <h5 className="mb-0 fw-semibold">User Actions</h5>
        </OffcanvasHeader>
        <OffcanvasBody className="d-flex flex-column h-100 p-0">
          
          {/* User Summary Header */}
          <div className="p-3 border-bottom bg-light-subtle">
            <div className="d-flex align-items-center mb-3">
              <div className="avatar-md me-3">
                {user.avatarUrl ? ()
                  <img src={user.avatarUrl} alt="avatar" className="img-fluid rounded-circle" style={{ width: '48px', height: '48px' }} />
                ) : ()
                  <span className="avatar-title bg-primary-subtle text-primary rounded-circle fw-semibold fs-5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    {(user.displayName || user.username || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="overflow-hidden">
                <h5 className="fs-15 mb-1 text-truncate">{user.displayName || user.username || 'No Name'}</h5>
                <p className="text-muted mb-0 fs-13 text-truncate">{user.email}</p>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <Badge bg={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'warning' : user.status === 'DELETED' ? 'danger' : 'secondary'}>
                {user.status}
              </Badge>
              {user.roles?.map((r: any) => ()
                <Badge bg="primary-subtle" text="primary" key={r.id}>{r.name}</Badge>
              ))}
            </div>
          </div>

          <div className="flex-grow-1 p-3 overflow-y-auto">
            {/* Warning Blocks */}
            {isSelf && ()
              <div className="alert alert-warning py-2 px-3 mb-3 fs-13">
                <IconifyIcon icon="bx:error-circle" className="me-1 align-middle text-warning" />
                This is your active admin account. Destructive or status modification actions are disabled.
              </div>
            )}
            {user.isLastSuperAdmin && !isSelf && ()
              <div className="alert alert-danger py-2 px-3 mb-3 fs-13">
                <IconifyIcon icon="bx:error-circle" className="me-1 align-middle text-danger" />
                This is the last Super Admin account. Destructive actions are disabled to prevent system lockout.
              </div>
            )}
            {isSuperAdmin && !user.isLastSuperAdmin && !isSelf && ()
              <div className="alert alert-info py-2 px-3 mb-3 fs-13">
                <IconifyIcon icon="bx:info-circle" className="me-1 align-middle text-info" />
                This is a Super Admin account. Dangerous modifications are protected.
              </div>
            )}

            {/* Action Group: View & Activity */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted fs-11 fw-bold tracking-wider mb-2">View & Activity</h6>
              <div className="d-grid gap-1">
                <Button variant="light" className="text-start fs-13 d-flex align-items-center" onClick={() => { onHide(); router.push(`/users/${user.id}`) }}>
                  <IconifyIcon icon="bx:user" className="me-2 text-muted fs-16" /> View Details
                </Button>
                <Button variant="light" className="text-start fs-13 d-flex align-items-center" onClick={() => { onHide(); router.push(`/sessions?userId=${user.id}`) }}>
                  <IconifyIcon icon="bx:history" className="me-2 text-muted fs-16" /> View Sessions
                </Button>
                <Button variant="light" className="text-start fs-13 d-flex align-items-center" onClick={() => { onHide(); router.push(`/oauth-accounts?userId=${user.id}`) }}>
                  <IconifyIcon icon="bx:link-alt" className="me-2 text-muted fs-16" /> View OAuth Accounts
                </Button>
                <Button variant="light" className="text-start fs-13 d-flex align-items-center" onClick={() => { onHide(); router.push(`/audit-logs?userId=${user.id}`) }}>
                  <IconifyIcon icon="bx:list-ul" className="me-2 text-muted fs-16" /> View Audit Logs
                </Button>
                <Button variant="light" className="text-start fs-13 d-flex align-items-center" onClick={() => { onHide(); router.push(`/security-events?userId=${user.id}`) }}>
                  <IconifyIcon icon="bx:shield-quarter" className="me-2 text-muted fs-16" /> View Security Events
                </Button>
              </div>
            </div>

            {/* Action Group: Security */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted fs-11 fw-bold tracking-wider mb-2">Security Actions</h6>
              <div className="d-grid gap-1">
                <Button 
                  variant="outline-primary" 
                  className="text-start fs-13 d-flex align-items-center" 
                  onClick={triggerResetPassword}
                  disabled={isSelf}
                >
                  <IconifyIcon icon="bx:key" className="me-2 fs-16" /> Reset Password
                </Button>
                <Button 
                  variant="outline-warning" 
                  className="text-start fs-13 d-flex align-items-center" 
                  onClick={triggerRevokeSessions}
                  disabled={isSelf || user.isLastSuperAdmin}
                >
                  <IconifyIcon icon="bx:log-out" className="me-2 fs-16" /> Revoke Sessions / Force Logout
                </Button>
              </div>
            </div>

            {/* Action Group: Status & Zone */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted fs-11 fw-bold tracking-wider mb-2">Status Modifications</h6>
              <div className="d-grid gap-1">
                {user.status === 'ACTIVE' ? ()
                  <Button 
                    variant="outline-danger" 
                    className="text-start fs-13 d-flex align-items-center" 
                    onClick={() => triggerStatusChange('SUSPENDED')}
                    disabled={isSelf || user.isLastSuperAdmin}
                  >
                    <IconifyIcon icon="bx:pause-circle" className="me-2 fs-16" /> Suspend User
                  </Button>
                ) : ()
                  <Button 
                    variant="outline-success" 
                    className="text-start fs-13 d-flex align-items-center" 
                    onClick={() => triggerStatusChange('ACTIVE')}
                    disabled={isSelf || user.isLastSuperAdmin}
                  >
                    <IconifyIcon icon="bx:play-circle" className="me-2 fs-16" /> Activate User
                  </Button>
                )}
                <Button 
                  variant="danger" 
                  className="text-start fs-13 d-flex align-items-center" 
                  onClick={triggerDeactivateUser}
                  disabled={isSelf || user.isLastSuperAdmin || user.status === 'DELETED'}
                >
                  <IconifyIcon icon="bx:trash" className="me-2 fs-16" /> Deactivate Account (Soft Delete
                </Button>
              </div>
            </div>

          </div>
        </OffcanvasBody>
      </Offcanvas>

      {/* Confirmation Modal */}
      <Modal show={modalState.show} onHide={() => !modalState.loading && setModalState(prev => ({ ...prev, show: false }))} centered>
        <Modal.Header closeButton={!modalState.loading}>
          <Modal.Title>{modalState.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0 fs-14">{modalState.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setModalState(prev => ({ ...prev, show: false }))} disabled={modalState.loading}>
            Cancel
          </Button>
          <Button variant={modalState.destructive ? 'danger' : 'primary'} onClick={executeAction} disabled={modalState.loading}>
            {modalState.loading ? <Spinner size="sm" animation="border" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  
}
