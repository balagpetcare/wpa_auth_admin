import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import RolesList from './components/RolesList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Roles & Permissions' }

const RolesPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">Roles & Permissions</h4>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <RolesList />
        </Col>
      </Row>
    </>
  
}

export default RolesPage
