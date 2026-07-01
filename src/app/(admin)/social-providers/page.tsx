import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import SocialProvidersList from './components/SocialProvidersList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Social Providers' }

const SocialProvidersPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">Social Login Providers</h4>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <SocialProvidersList />
        </Col>
      </Row>
    </>
  
}

export default SocialProvidersPage
