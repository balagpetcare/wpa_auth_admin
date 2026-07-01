import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import UsersList from './components/UsersList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Users Management' }

const UsersPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">Users Management</h4>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <UsersList />
        </Col>
      </Row>
    </>
  
}

export default UsersPage
