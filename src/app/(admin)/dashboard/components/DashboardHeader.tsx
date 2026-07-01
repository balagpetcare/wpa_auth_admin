'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, Col, Row } from 'react-bootstrap'

type AdminData = {
  username?: string
  email?: string
  fullName?: string
  displayName?: string
}

export default function DashboardHeader() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('adminData')
    if (!raw) return
    try {
      setAdminData(JSON.parse(raw))
    } catch {
      setAdminData(null)
    }
  }, [])

  const displayName = adminData?.displayName || adminData?.fullName || adminData?.username || 'Administrator'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-sm">
      <CardBody className="position-relative p-4 p-lg-5">
        <div className="position-absolute top-0 end-0 opacity-10 pe-none">
          <span className="display-4 text-primary me-4 mt-3">🔐</span>
        </div>
        <Row className="align-items-center g-3">
          <Col xl={8}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge text-bg-primary-subtle text-primary border border-primary-subtle">WPA Auth Admin</span>
              <span className="badge text-bg-dark-subtle text-dark">Phase C</span>
            </div>
            <h1 className="mb-2 display-6 fw-semibold text-dark">WPA Central Auth Dashboard</h1>
            <p className="mb-0 text-muted fs-15">
              {greeting}, {displayName}. Review auth activity, system health, and operational shortcuts from one place.
            </p>
          </Col>
          <Col xl={4}>
            <div className="bg-light bg-opacity-50 rounded-3 p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted">Current admin</span>
                <span className="text-primary fs-4">👤</span>
              </div>
              <div className="fw-semibold text-dark">{displayName}</div>
              <div className="text-muted small text-break">{adminData?.email || 'No admin profile cached locally'}</div>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
