'use client'

import { useEffect, useState } from 'react'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Form, Nav, Row, Spinner, Tab } from 'react-bootstrap'
import AdminAvatar from '@/components/admin/AdminAvatar'
import { useCurrentAdmin } from '@/context/useCurrentAdminContext'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import Link from 'next/link'

const MyAccount = () => {
  const { accessToken } = useAuth()
  const { admin: account, setAdmin, refreshAdmin } = useCurrentAdmin()
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    jobTitle: '',
    department: '',
    organization: '',
    bio: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [prefData, setPrefData] = useState({
    notificationPreferences: {
      securityAlerts: true,
      adminActivityAlerts: true,
      loginAlerts: true,
    },
    interfacePreferences: {
      language: 'en',
      timezone: 'Asia/Dhaka',
      dateFormat: 'DD/MM/YYYY',
      compactTableMode: false,
    },
  })

  useEffect(() => {
    if (account) {
      setProfileData({
        fullName: account.fullName || account.displayName || '',
        phone: account.phone || '',
        jobTitle: account.jobTitle || '',
        department: account.department || '',
        organization: account.organization || '',
        bio: account.bio || '',
      })
      if (account.notificationPreferences) {
        setPrefData((prev) => ({ ...prev, notificationPreferences: account.notificationPreferences! }))
      }
      if (account.interfacePreferences) {
        setPrefData((prev) => ({ ...prev, interfacePreferences: account.interfacePreferences! }))
      }
      setLoading(false)
    } else if (!loading) {
      setLoading(false)
    }
  }, [account])

  useEffect(() => {
    if (!accessToken) return
    if (account) {
      setLoading(false)
      return
    }
    const run = async () => {
      try {
        await refreshAdmin()
      } catch {
        showNotification({ message: 'Failed to load account details', variant: 'danger' })
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [accessToken, account, refreshAdmin, showNotification])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    setSaving(true)
    try {
      const res: any = await apiClient(accessToken).patch('/admin/account/me', profileData)
      setAdmin(res.account)
      showNotification({ message: 'Profile updated successfully', variant: 'success' })
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to update profile', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    setSaving(true)
    try {
      const res: any = await apiClient(accessToken).patch('/admin/account/me', prefData)
      setAdmin(res.account)
      showNotification({ message: 'Preferences updated successfully', variant: 'success' })
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to update preferences', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    setSaving(true)
    try {
      await apiClient(accessToken).post('/admin/account/change-password', passwordData
      showNotification({ message: 'Password changed successfully', variant: 'success' }
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to change password', variant: 'danger' }
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0])
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showNotification({ message: 'Avatar must be 2MB or smaller.', variant: 'danger' }
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showNotification({ message: 'Only JPG, PNG, and WEBP files are allowed.', variant: 'danger' }
      return
    }
    setAvatarFile(file
    setAvatarPreview(URL.createObjectURL(file)
  }

  const handleAvatarUpload = async () => {
    if (!accessToken || !avatarFile) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile
      const res: any = await apiClient(accessToken).post('/admin/account/avatar', formData
      setAdmin((current) => (current ? { ...current, avatarUrl: res.data.avatarUrl } : current)
      setAvatarFile(null)
      setAvatarPreview(null)
      showNotification({ message: res.message || 'Profile photo updated successfully.', variant: 'success' }
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to upload profile photo', variant: 'danger' }
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarRemove = async () => {
    if (!accessToken) return
    setRemovingAvatar(true)
    try {
      await apiClient(accessToken).delete('/admin/account/avatar'
      setAdmin((current) => (current ? { ...current, avatarUrl: null } : current)
      setAvatarPreview(null)
      setAvatarFile(null)
      showNotification({ message: 'Profile photo removed successfully.', variant: 'success' }
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to remove profile photo', variant: 'danger' }
    } finally {
      setRemovingAvatar(false)
    }
  }

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  }

  if (!account) {
    return <div className="alert alert-warning">Could not load account details.</div>
  }

  const avatarUser = {
    ...account,
    avatarUrl: avatarPreview || account.avatarUrl,
  }

  return ()
    <Tab.Container defaultActiveKey="profile">
      <Row className="g-4">
        <Col xl={4}>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle as="h5">Profile Photo</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="d-flex flex-column align-items-center text-center">
                <AdminAvatar user={avatarUser} size={112} />
                <h5 className="mt-3 mb-1">{account.fullName || account.displayName || account.username || 'Admin'}</h5>
                <p className="text-muted mb-2">{account.email}</p>
                <Badge bg="primary">{Array.isArray(account.roles) && account.roles.length > 0 ? ((account.roles[0] as any).name || account.roles[0]) : 'ADMIN'}</Badge>
                <div className="w-100 mt-4">
                  <Form.Group controlId="avatarUpload">
                    <Form.Label className="fw-semibold">Upload new photo</Form.Label>
                    <Form.Control type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleAvatarSelection} />
                    <Form.Text className="text-muted">Allowed formats: JPG, PNG, WEBP. Max size: 2MB.</Form.Text>
                  </Form.Group>
                  {avatarPreview && ()
                    <div className="mt-3 p-3 border rounded bg-light-subtle">
                      <div className="small text-muted mb-2">Preview</div>
                      <AdminAvatar user={avatarUser} size={88} />
                    </div>
                  )}
                  <div className="d-flex gap-2 mt-3">
                    <Button variant="primary" onClick={() => void handleAvatarUpload()} disabled={!avatarFile || uploadingAvatar}>
                      {uploadingAvatar ? <Spinner size="sm" animation="border" /> : 'Upload Photo'})
                    </Button>
                    {account.avatarUrl && ()
                      <Button variant="outline-danger" onClick={() => void handleAvatarRemove()} disabled={removingAvatar}>
                        {removingAvatar ? <Spinner size="sm" animation="border" /> : 'Remove Photo'})
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Nav variant="pills" className="flex-column mt-4 gap-2">
            <Nav.Item><Nav.Link eventKey="profile">Profile Information</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="security">Security Settings</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="preferences">Preferences</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="metadata">Account Info</Nav.Link></Nav.Item>
          </Nav>
        </Col>

        <Col xl={8}>
          <Tab.Content>
            <Tab.Pane eventKey="profile">
              <Card className="shadow-sm">
                <CardHeader><CardTitle as="h5">Profile Information</CardTitle></CardHeader>
                <CardBody>
                  <Form onSubmit={handleProfileUpdate}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Username</Form.Label>
                          <Form.Control type="text" value={account.username || ''} disabled readOnly />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" value={account.email || ''} disabled readOnly />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Full Name</Form.Label><Form.Control type="text" value={profileData.fullName} onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} /></Form.Group></Col>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Phone Number</Form.Label><Form.Control type="text" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} /></Form.Group></Col>
                    </Row>
                    <Row>
                      <Col md={4}><Form.Group className="mb-3"><Form.Label>Job Title</Form.Label><Form.Control type="text" value={profileData.jobTitle} onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })} /></Form.Group></Col>
                      <Col md={4}><Form.Group className="mb-3"><Form.Label>Department</Form.Label><Form.Control type="text" value={profileData.department} onChange={(e) => setProfileData({ ...profileData, department: e.target.value })} /></Form.Group></Col>
                      <Col md={4}><Form.Group className="mb-3"><Form.Label>Organization</Form.Label><Form.Control type="text" value={profileData.organization} onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })} /></Form.Group></Col>
                    </Row>
                    <Form.Group className="mb-4">
                      <Form.Label>Bio</Form.Label>
                      <Form.Control as="textarea" rows={4} maxLength={250} value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} />
                    </Form.Group>
                    <div className="text-end">
                      <Button type="submit" variant="primary" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Save Changes'}</Button>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Tab.Pane>

            <Tab.Pane eventKey="security">
              <Card className="mb-4 shadow-sm">
                <CardHeader><CardTitle as="h5">Change Password</CardTitle></CardHeader>
                <CardBody>
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3"><Form.Label>Current Password</Form.Label><Form.Control type="password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>New Password</Form.Label><Form.Control type="password" required value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} /><Form.Text className="text-muted">Must be at least 8 characters with mixed case and a number.</Form.Text></Form.Group>
                    <Form.Group className="mb-4"><Form.Label>Confirm New Password</Form.Label><Form.Control type="password" required value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} /></Form.Group>
                    <Button type="submit" variant="primary" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Update Password'}</Button>
                  </Form>
                </CardBody>
              </Card>
              <Card className="shadow-sm">
                <CardHeader><CardTitle as="h5">Security Tools</CardTitle></CardHeader>
                <CardBody className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Active Login Sessions</h6>
                      <p className="text-muted mb-0 small">Review and revoke active sessions across devices.</p>
                    </div>
                    <Link href="/sessions" className="btn btn-outline-primary btn-sm">View Sessions</Link>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Security Events</h6>
                      <p className="text-muted mb-0 small">Inspect suspicious activity and security monitoring alerts.</p>
                    </div>
                    <Link href="/security-events" className="btn btn-outline-dark btn-sm">Open Security Events</Link>
                  </div>
                </CardBody>
              </Card>
            </Tab.Pane>

            <Tab.Pane eventKey="preferences">
              <Card className="shadow-sm">
                <CardHeader><CardTitle as="h5">Preferences</CardTitle></CardHeader>
                <CardBody>
                  <Form onSubmit={handlePreferencesUpdate}>
                    <Form.Group className="mb-3">
                      <Form.Label>Notification Email</Form.Label>
                      <Form.Control type="email" value={account.email || ''} readOnly disabled />
                    </Form.Group>
                    <Form.Check type="switch" id="alert-security" label="Receive Security Alerts" checked={prefData.notificationPreferences.securityAlerts} onChange={(e) => setPrefData((prev) => ({ ...prev, notificationPreferences: { ...prev.notificationPreferences, securityAlerts: e.target.checked } }))} className="mb-2" />
                    <Form.Check type="switch" id="alert-activity" label="Receive Admin Activity Alerts" checked={prefData.notificationPreferences.adminActivityAlerts} onChange={(e) => setPrefData((prev) => ({ ...prev, notificationPreferences: { ...prev.notificationPreferences, adminActivityAlerts: e.target.checked } }))} className="mb-2" />
                    <Form.Check type="switch" id="alert-login" label="Receive Login Alerts" checked={prefData.notificationPreferences.loginAlerts} onChange={(e) => setPrefData((prev) => ({ ...prev, notificationPreferences: { ...prev.notificationPreferences, loginAlerts: e.target.checked } }))} className="mb-4" />
                    <hr />
                    <Row>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Language</Form.Label><Form.Select value={prefData.interfacePreferences.language} onChange={(e) => setPrefData((prev) => ({ ...prev, interfacePreferences: { ...prev.interfacePreferences, language: e.target.value } }))}><option value="en">English</option><option value="bn">Bangla</option></Form.Select></Form.Group></Col>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Timezone</Form.Label><Form.Select value={prefData.interfacePreferences.timezone} onChange={(e) => setPrefData((prev) => ({ ...prev, interfacePreferences: { ...prev.interfacePreferences, timezone: e.target.value } }))}><option value="Asia/Dhaka">Asia/Dhaka</option><option value="UTC">UTC</option><option value="America/New_York">America/New_York</option><option value="Europe/London">Europe/London</option></Form.Select></Form.Group></Col>
                    </Row>
                    <Row>
                      <Col md={6}><Form.Group className="mb-4"><Form.Label>Date Format</Form.Label><Form.Select value={prefData.interfacePreferences.dateFormat} onChange={(e) => setPrefData((prev) => ({ ...prev, interfacePreferences: { ...prev.interfacePreferences, dateFormat: e.target.value } }))}><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></Form.Select></Form.Group></Col>
                      <Col md={6} className="d-flex align-items-center mt-md-3"><Form.Check type="switch" id="compact-table" label="Compact Table Mode" checked={prefData.interfacePreferences.compactTableMode} onChange={(e) => setPrefData((prev) => ({ ...prev, interfacePreferences: { ...prev.interfacePreferences, compactTableMode: e.target.checked } }))} /></Col>
                    </Row>
                    <div className="text-end"><Button type="submit" variant="primary" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Save Preferences'}</Button></div>
                  </Form>
                </CardBody>
              </Card>
            </Tab.Pane>

            <Tab.Pane eventKey="metadata">
              <Card className="shadow-sm">
                <CardHeader><CardTitle as="h5">Account Info</CardTitle></CardHeader>
                <CardBody>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center"><span className="text-muted">Account Status</span><Badge bg={account.status === 'ACTIVE' ? 'success' : 'warning'}>{account.status}</Badge></li>
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center"><span className="text-muted">Roles</span><div>{account.roles?.map((r: any, index: number) => <Badge bg="primary" className="me-1" key={r.id || index}>{r.name || r}</Badge>)}</div></li>
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center"><span className="text-muted">Created At</span><span>{account.createdAt ? new Date(account.createdAt).toLocaleString() : 'N/A'}</span></li>
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center"><span className="text-muted">Last Updated</span><span>{account.updatedAt ? new Date(account.updatedAt).toLocaleString() : 'N/A'}</span></li>
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center"><span className="text-muted">Last Login</span><span>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : 'N/A'}</span></li>
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center"><span className="text-muted">Last Password Change</span><span>{account.lastPasswordChangedAt ? new Date(account.lastPasswordChangedAt).toLocaleString() : 'Never'}</span></li>
                  </ul>
                </CardBody>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  
}

export default MyAccount
