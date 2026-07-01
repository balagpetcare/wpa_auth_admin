import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import AdminTeamList from './components/AdminTeamList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Admin Team' })

const AdminUsersPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">Admin Team</h4>
            <p className="text-muted mt-1 mb-0">Invite, manage, and secure administrators who can access WPA Central Auth.</p>
          </div>
        </Col>
      </Row>
      <Row className="mt-3">
        <Col xs={12}>
          <AdminTeamList />
        </Col>
      </Row>
    </>
  
}

export default AdminUsersPage
