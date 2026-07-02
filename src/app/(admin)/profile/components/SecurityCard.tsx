'use client'

import Link from 'next/link'
import { Card, Col, Row } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import ChangePasswordCard from '@/features/account/components/ChangePasswordCard'
import { AccountProfile } from '@/features/account/types'

const SecurityCard = ({ account }: { account: AccountProfile }) => {
  return (
    <>
      <ChangePasswordCard lastPasswordChangedAt={account.lastPasswordChangedAt} />
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
        <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
          <div className="d-flex align-items-center gap-2 mb-1">
            <IconifyIcon icon="solar:shield-check-bold-duotone" className="text-primary fs-20" />
            <h5 className="fw-bold text-dark mb-0">Security</h5>
          </div>
          <span className="text-muted fs-12">Manage sessions and review security policies for your account.</span>
        </Card.Header>
        <Card.Body className="px-4 pb-4 mt-3">
          <Row className="g-3">
            <Col md={6}>
              <Link href="/sessions" className="d-flex align-items-center justify-content-between p-3 bg-light rounded text-decoration-none">
                <div>
                  <strong className="text-dark d-block fs-14">Active Sessions</strong>
                  <span className="text-muted fs-12">View and revoke your logged-in sessions.</span>
                </div>
                <IconifyIcon icon="solar:alt-arrow-right-bold" className="text-muted fs-18" />
              </Link>
            </Col>
            <Col md={6}>
              <Link href="/security-settings" className="d-flex align-items-center justify-content-between p-3 bg-light rounded text-decoration-none">
                <div>
                  <strong className="text-dark d-block fs-14">Security Settings</strong>
                  <span className="text-muted fs-12">Review platform-wide security configuration.</span>
                </div>
                <IconifyIcon icon="solar:alt-arrow-right-bold" className="text-muted fs-18" />
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  )
}

export default SecurityCard
