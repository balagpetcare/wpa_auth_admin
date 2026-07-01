import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import SecurityEventsList from './components/SecurityEventsList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Security Events' }

const SecurityEventsPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">Security Events</h4>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <SecurityEventsList />
        </Col>
      </Row>
    </>
  
}

export default SecurityEventsPage
