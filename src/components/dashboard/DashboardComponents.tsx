'use client'

import React from 'react'
import { Card, Spinner, Button } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

// --- STAT CARD ---
interface StatCardProps {
  title: string
  value: string | number | undefined
  icon: string
  // UI polish fix (docs/admin-panel-shell-ui-polish.md): 'dark' was accepted
  // here but src/assets/scss/components/_backgrounds.scss only generates
  // `.bg-soft-*` classes for keys in the Bootstrap `$theme-colors` map, which
  // does not include 'dark' — so `bg-soft-dark` silently didn't exist,
  // rendering the stat icon's background as a blank/gray box. 'secondary' is
  // a real theme color and renders correctly.
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  description?: string
  loading?: boolean
}

export function StatCard({
  title,
  value,
  icon,
  variant = 'primary',
  description,
  loading = false,
}: StatCardProps) {
  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      <Card.Body className="p-4">
        {loading ? (
          <div className="d-flex flex-column gap-2">
            <div className="bg-light rounded" style={{ height: '14px', width: '40%' }} />
            <div className="bg-light rounded my-1" style={{ height: '32px', width: '70%' }} />
            <div className="bg-light rounded" style={{ height: '12px', width: '50%' }} />
          </div>
        ) : (
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="text-muted fw-semibold mb-1 fs-13 text-uppercase tracking-wider">{title}</p>
              <h3 className="fw-bold text-dark mb-1 fs-28">
                {value !== undefined && value !== null ? value : 'N/A'}
              </h3>
              {description && <p className="text-muted mb-0 fs-12">{description}</p>}
            </div>
            <div className={`avatar-md rounded bg-soft-${variant} d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
              <IconifyIcon icon={icon} className={`fs-24 text-${variant}`} />
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

// --- STATUS BADGE ---
interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase()
  let variant = 'secondary'

  if (['ACTIVE', 'SUCCESS', 'SENT', 'RESOLVED', 'UP'].includes(normalized)) variant = 'success'
  else if (['PENDING', 'WARNING', 'UNRESOLVED', 'PENDING_VERIFICATION'].includes(normalized)) variant = 'warning'
  else if (['SUSPENDED', 'FAILED', 'DELETED', 'ERROR', 'DOWN'].includes(normalized)) variant = 'danger'
  else if (['INFO', 'CLIENT'].includes(normalized)) variant = 'info'

  return <span className={`badge bg-soft-${variant} text-${variant} px-2 py-1 fs-12 fw-semibold`}>{status}</span>
}

// --- EMPTY STATE ---
interface EmptyStateProps {
  message?: string
  icon?: string
}

export function EmptyState({
  message = 'No data available at the moment.',
  icon = 'solar:clipboard-list-bold-duotone',
}: EmptyStateProps) {
  return (
    <div className="text-center py-4 my-2">
      <IconifyIcon icon={icon} className="fs-36 text-muted mb-2" />
      <p className="text-secondary fs-14 mb-0">{message}</p>
    </div>
  )
}

// --- ERROR STATE ---
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Failed to load data. Please verify backend API status.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="text-center py-4 my-2 p-3 bg-soft-danger rounded">
      <IconifyIcon icon="solar:danger-bold-duotone" className="fs-32 text-danger mb-2" />
      <p className="text-danger fs-14 fw-medium mb-3">{message}</p>
      {onRetry && (
        <Button size="sm" variant="danger" onClick={onRetry}>
          <IconifyIcon icon="solar:restart-bold-duotone" className="me-1 align-middle" />
          Retry Request
        </Button>
      )}
    </div>
  )
}
