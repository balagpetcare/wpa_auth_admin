import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import OAuthAccountsList from './components/OAuthAccountsList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'OAuth Accounts' }

const OAuthAccountsPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">OAuth Accounts</h4>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <OAuthAccountsList />
        </Col>
      </Row>
    </>
  
}

export default OAuthAccountsPage
