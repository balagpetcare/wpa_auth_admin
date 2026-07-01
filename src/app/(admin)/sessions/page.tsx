import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import SessionsList from './components/SessionsList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Login Sessions' }

const SessionsPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">Login Sessions</h4>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <SessionsList />
        </Col>
      </Row>
    </>
  
}

export default SessionsPage
