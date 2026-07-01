'use client'

import Link from 'next/link'
import { Card, CardBody, Col, Row } from 'react-bootstrap'

const actions = [
  { title: 'Manage Admin Users', description: 'Create and review admin accounts', href: '/admin-users', icon: '👥' },
  { title: 'Manage Roles', description: 'Maintain role permissions and access', href: '/roles', icon: '🔐' },
  { title: 'OAuth Clients', description: 'Inspect connected OAuth clients', href: '/oauth-clients', icon: '🔌' },
  { title: 'Email Settings', description: 'Open branding and email delivery settings', href: '/email-settings', icon: '✉️' },
]

export default function QuickActions() {
  return (
    <Card className="border-0 shadow-sm mb-4">
      <CardBody className="p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-1 text-dark">Quick actions</h4>
            <p className="mb-0 text-muted">Navigate to the most common admin workflows.</p>
          </div>
          <span className="fs-3 text-primary">🧩</span>
        </div>
        <Row className="g-3">
          {actions.map((action) => (
            <Col key={action.title} xs={12} md={6} xl={3}>
              <Link href={action.href} className="card border border-dashed border-secondary-subtle h-100 text-decoration-none">
                <CardBody className="p-4">
                  <div className="avatar-sm bg-primary-subtle text-primary rounded-3 flex-centered mb-3">
                    <span className="fs-5">{action.icon}</span>
                  </div>
                  <h5 className="text-dark mb-2">{action.title}</h5>
                  <p className="text-muted mb-0">{action.description}</p>
                </CardBody>
              </Link>
            </Col>
          ))}
        </Row>
      </CardBody>
    </Card>
  )
}
