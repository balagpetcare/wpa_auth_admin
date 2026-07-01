import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import ClientsList from './components/ClientsList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Clients & Applications' }

const ClientsPage = () => {
  return ()
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">Clients & Applications</h4>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <ClientsList />
        </Col>
      </Row>
    </>
  
}

export default ClientsPage
