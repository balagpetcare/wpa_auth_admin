import { Metadata } from 'next'
import { Col, Row } from 'react-bootstrap'
import UserDetail from './components/UserDetail'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'User Details' }

type PageProps = {
  params: Promise<{ userId: string }>
}

const UserDetailsPage = async ({ params }: PageProps) => {
  const { userId } = await params
  return (
    <>
      <Row>
        <Col xs={12}>
          <div className="page-title-box">
            <h4 className="mb-0">User Details</h4>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <UserDetail userId={userId} />
        </Col>
      </Row>
    </>
  )
}

export default UserDetailsPage
