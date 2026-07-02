'use client'

import React from 'react'
import { Card, Button } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Link from 'next/link'

interface PlaceholderPageProps {
  title: string
  description?: string
  icon?: string
}

export default function PlaceholderPage({
  title,
  description = 'This administrative interface page is currently planned for development or requires additional backend API endpoints.',
  icon = 'solar:bill-list-bold-duotone',
}: PlaceholderPageProps) {
  return (
    <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
      <Card className="text-center p-5 shadow-sm border-0" style={{ maxWidth: '600px', borderRadius: '12px' }}>
        <div className="mb-4 d-inline-flex align-items-center justify-content-center bg-light text-primary rounded-circle" style={{ width: '80px', height: '80px' }}>
          <IconifyIcon icon={icon} className="fs-40 text-primary" />
        </div>
        <h3 className="fw-bold text-dark mb-2">{title}</h3>
        <p className="text-muted fs-15 mb-4">{description}</p>
        <div className="bg-light p-3 rounded mb-4 text-start border-start border-3 border-primary">
          <h5 className="fs-14 fw-semibold text-primary mb-1">Implementation Note</h5>
          <span className="fs-13 text-secondary">
            This module is marked as <strong>Planned / Coming Soon</strong> in the WPA Central Auth Admin UI feature map. Real API endpoints are being integrated.
          </span>
        </div>
        <div>
          <Link href="/dashboard" passHref legacyBehavior>
            <Button variant="primary" className="px-4 py-2">
              <IconifyIcon icon="solar:home-bold-duotone" className="me-2 align-middle fs-16" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
