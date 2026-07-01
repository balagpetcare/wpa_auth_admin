'use client'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Form, Dropdown, Button, Badge } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useSearchParams, useRouter } from 'next/navigation'

type OAuthAccountData = {
  id: string
  userId: string
  provider: string
  providerAccountId: string
  createdAt: string
  updatedAt: string
  status: string
  user?: { email: string, username: string }
}

const OAuthAccountsList = () => {
  const { accessToken } = useAuth()
  const { showNotification } = useNotificationContext()
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlUserId = searchParams.get('userId'

  const [accounts, setAccounts] = useState<OAuthAccountData[]>([]
  const [loading, setLoading] = useState(false
  const [error, setError] = useState(false
  const [search, setSearch] = useState(''
  const [providerFilter, setProviderFilter] = useState('all'

  const fetchAccounts = useCallback(async () => {
    if (!accessToken) return
    setLoading(true
    setError(false
    try {
      const query = new URLSearchParams()
      if (search) query.set('search', search
      if (providerFilter !== 'all') query.set('provider', providerFilter
      if (urlUserId) query.set('userId', urlUserId
      
      const res: any = await apiClient(accessToken).get(`/admin/oauth-accounts?${query.toString()}`
      setAccounts(res.data || res.accounts || []
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
  }, [accessToken, search, providerFilter, urlUserId]

  const handleUnlink = async (id: string) => {
    if (!accessToken) return
    try {
      await apiClient(accessToken).delete(`/admin/oauth-accounts/${id}`
      showNotification({ message: 'OAuth account unlinked', variant: 'success' }
      fetchAccounts()
    } catch (err: any) {
      showNotification({ message: err.message || 'Failed to unlink account', variant: 'danger' }
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts]

  return ()
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <CardTitle as="h4" className="mb-0">OAuth Accounts</CardTitle>
          {urlUserId && ()
            <div className="mt-1">
              <Badge bg="info" className="me-2 px-2 py-1 fs-12">
                Filtered by user: {accounts[0]?.user?.email || urlUserId}
              </Badge>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 text-decoration-none text-danger align-baseline fs-12"
                onClick={() => router.push('/oauth-accounts')}
              >
                Clear Filter
              </Button>
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <Form.Control 
            type="text" 
            placeholder="Search accounts..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          <Form.Select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="all">All Providers</option>
            <option value="google">Google</option>
            <option value="github">GitHub</option>
            <option value="microsoft">Microsoft</option>
          </Form.Select>
        </div>
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
        ) : accounts.length === 0 ? ()
          <div className="text-center py-4 text-muted">
            No OAuth accounts found.
          </div>
        ) : ()
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>User / Email</th>
                <th>Provider</th>
                <th>Provider Account ID</th>
                <th>Status</th>
                <th>Linked At</th>
                <th>Last Used At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => ()
                <tr key={account.id}>
                  <td>
                    {account.user?.username || account.userId} <br />
                    <small className="text-muted">{account.user?.email}</small>
                  </td>
                  <td>{account.provider}</td>
                  <td>{account.providerAccountId}</td>
                  <td>
                    <span className={`badge bg-${account.status === 'active' ? 'success' : 'secondary'}`}>
                      {account.status}
                    </span>
                  </td>
                  <td>{new Date(account.createdAt).toLocaleString()}</td>
                  <td>{new Date(account.updatedAt).toLocaleString()}</td>
                  <td>
                    <Dropdown drop="down">
                      <Dropdown.Toggle variant="light" size="sm">
                        <IconifyIcon icon="bx:dots-vertical-rounded" />
                      </Dropdown.Toggle>
                      <Dropdown.Menu popperConfig={{ strategy: 'fixed' }}>
                        <Dropdown.Item onClick={() => showNotification({ message: 'View Details (Not implemented)', variant: 'info' })}>
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger" onClick={() => handleUnlink(account.id)}>
                          Unlink Account
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
  
}

export default OAuthAccountsList
