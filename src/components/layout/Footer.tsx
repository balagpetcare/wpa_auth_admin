import { Col, Container, Row } from 'react-bootstrap'

const Footer = () => {
  return (
    <footer className="footer">
      <Container fluid>
        <Row>
          <Col xs={12} className="text-center">
            © WPA Central Auth. Built for identity operations.
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
