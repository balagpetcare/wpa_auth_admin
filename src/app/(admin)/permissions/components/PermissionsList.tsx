'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Spinner, Table } from 'react-bootstrap'

const PermissionsList = () => {
  const { accessToken } = useAuth()
  const [permissions, setPermissions] = useState<any[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false

  const fetchPermissions = useCallback(async () => {
    if (!accessToken) return
    try {
      setLoading(true
      const res: any = await apiClient(accessToken).get('/admin/permissions'
      setPermissions(res.permissions || []
    } catch (err) {
      setError(true
    } finally {
      setLoading(false
    }
  }, [accessToken]

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions]

  return ()
    <Row>
      <Col xl={12}>
        <Card>
          <CardHeader>
            <CardTitle as={'h4'}>Permissions List</CardTitle>
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
            ) : permissions.length === 0 ? ()
              <div className="text-center py-4 text-muted">
                No permissions found.
              </div>
            ) : ()
              <div className="table-responsive">
                <Table className="align-middle mb-0 table-hover table-centered" hover>
                  <thead className="bg-light-subtle">
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Resource</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((item, idx) => ()
                      <tr key={item.id || idx}>
                        <td><p className="fs-15 mb-0 fw-semibold">{item.name}</p></td>
                        <td>{item.description || '-'}</td>
                        <td><span className="badge bg-primary-subtle text-primary">{item.resource}</span></td>
                        <td><span className="badge bg-info-subtle text-info">{item.action}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  
}

export default PermissionsList
