import { Row, Col } from 'react-bootstrap'
import { Metadata } from 'next'
import AuthStats from './components/AuthStats'
import RecentSecurityEvents from './components/RecentSecurityEvents'
import RecentAuditLogs from './components/RecentAuditLogs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Auth Dashboard' }

const DashboardPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">WPA Auth Dashboard</h4>
          </div>
        </Col>
      </Row>
      <AuthStats />
      <Row>
        <Col lg={6}>
          <RecentSecurityEvents />
        </Col>
        <Col lg={6}>
          <RecentAuditLogs />
        </Col>
      </Row>
    </>
  
}

export default DashboardPage
