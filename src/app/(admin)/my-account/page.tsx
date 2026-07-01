'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardBody, Col, Row, Badge } from 'react-bootstrap'

type AdminData = {
  id?: string
  username?: string
  email?: string
  fullName?: string
  displayName?: string
}

export default function MyAccountPage() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  useEffect(() => {
    const data = localStorage.getItem('adminData')
    if (!data) return
    try {
      setAdminData(JSON.parse(data))
    } catch {
      setAdminData(null)
    }
  }, [])

  const displayName = adminData?.displayName || adminData?.fullName || adminData?.username || 'Administrator'

  return (
    <>
      <div className="page-title-box">
        <div>
          <h1 className="mb-1">My Account</h1>
          <p className="text-muted mb-0">Profile, access, and account information.</p>
        </div>
        <Link href="/dashboard" className="btn btn-light">Back to dashboard</Link>
      </div>

      <Row className="g-4">
        <Col xs={12} lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h4 className="mb-1">Profile card</h4>
                  <p className="text-muted mb-0">Local account snapshot from the signed-in admin session.</p>
                </div>
                <Badge bg="primary">Admin</Badge>
              </div>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="avatar-lg bg-primary-subtle text-primary rounded-circle flex-centered fs-2">👤</div>
                <div>
                  <h3 className="mb-1 text-dark">{displayName}</h3>
                  <div className="text-muted">{adminData?.email || 'No email stored locally'}</div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr><td className="text-muted">Display name</td><td className="fw-semibold text-dark">{adminData?.displayName || 'Unavailable'}</td></tr>
                    <tr><td className="text-muted">Username</td><td className="fw-semibold text-dark">{adminData?.username || 'Unavailable'}</td></tr>
                    <tr><td className="text-muted">Email</td><td className="fw-semibold text-dark">{adminData?.email || 'Unavailable'}</td></tr>
                    <tr><td className="text-muted">User ID</td><td className="fw-semibold text-dark text-break">{adminData?.id || 'Unavailable'}</td></tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xs={12} lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="p-4">
              <h4 className="mb-3">Account security</h4>
              <div className="d-grid gap-3">
                <button className="btn btn-light" disabled>Change password</button>
                <button className="btn btn-light" disabled>Two-factor authentication</button>
                <button className="btn btn-light" disabled>Notification preferences</button>
              </div>
              <div className="alert alert-soft-secondary mt-4 mb-0">
                Additional profile actions remain unavailable until the related backend endpoints exist.
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
