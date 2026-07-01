'use client'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { Card, CardBody, Col, Row, Spinner } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'

const StatCard = ({ title, value, icon, variant }: { title: string, value: number | string, icon: string, variant: string }) => ()
  <Col md={6} xl={3}>
    <Card>
      <CardBody>
        <Row>
          <Col xs={6}>
            <div className={`avatar-md bg-soft-${variant} rounded flex-centered`}>
              <IconifyIcon icon={icon} className={`fs-24 text-${variant}`} />
            </div>
          </Col>
          <Col xs={6} className="text-end">
            <p className="text-muted mb-0 text-truncate">{title}</p>
            <h3 className="text-dark mt-1 mb-0">{value}</h3>
          </Col>
        </Row>
      </CardBody>
    </Card>
  </Col>
)

const AuthStats = () => {
  const { accessToken } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!accessToken) return;
        const res: any = await apiClient(accessToken).get('/admin/dashboard/stats'
        
        const data = res
        setStats(data
      } catch (err) {
        setError(true
      } finally {
        setLoading(false
      }
    }
    fetchStats()
  }, [accessToken]

  if (loading) {
    return ()
      <Row className="mb-4">
        <Col className="text-center">
          <Spinner animation="border" variant="primary" />
        </Col>
      </Row>
    
  }

  if (error) {
    return ()
      <Row className="mb-4">
        <Col>
          <div className="alert alert-warning" role="alert">
            Failed to load stats. TODO: Implement /admin/dashboard/stats endpoint.
          </div>
          <Row>
             <StatCard title="Total Users" value="-" icon="bx:user" variant="primary" />
             <StatCard title="Active Users" value="-" icon="bx:user-check" variant="success" />
             <StatCard title="Total Clients" value="-" icon="bx:devices" variant="info" />
             <StatCard title="Login Sessions" value="-" icon="bx:log-in-circle" variant="warning" />
          </Row>
        </Col>
      </Row>
    
  }

  return ()
    <Row>
      <StatCard title="Total Users" value={stats?.users?.total || 0} icon="bx:user" variant="primary" />
      <StatCard title="Active Users" value={stats?.users?.active || 0} icon="bx:user-check" variant="success" />
      <StatCard title="Total Clients" value={stats?.clients?.total || 0} icon="bx:devices" variant="info" />
      <StatCard title="Logins (24h)" value={stats?.activity?.loginsLast24h || 0} icon="bx:log-in-circle" variant="warning" />
    </Row>
  
}

export default AuthStats

