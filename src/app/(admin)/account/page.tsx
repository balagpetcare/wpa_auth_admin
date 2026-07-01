import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import MyAccount from './components/MyAccount'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'My Account' })

const AccountPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">My Account</h4>
            <p className="text-muted mt-1 mb-0">Manage your admin profile, security, and preferences.</p>
          </div>
        </Col>
      </Row>
      <Row className="mt-3">
        <Col xs={12}>
          <MyAccount />
        </Col>
      </Row>
    </>
  
}

export default AccountPage
