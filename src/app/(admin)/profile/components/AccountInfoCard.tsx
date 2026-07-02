'use client'

import React from 'react'
import { Card } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { StatusBadge } from '@/components/dashboard/DashboardComponents'
import { AccountProfile } from '@/features/account/types'

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="d-flex justify-content-between align-items-center border-bottom py-2 fs-13 gap-2">
    <span className="text-muted flex-shrink-0">{label}</span>
    <strong className="text-dark text-end text-truncate">{value}</strong>
  </div>
)

const AccountInfoCard = ({ account }: { account: AccountProfile }) => {
  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
        <div className="d-flex align-items-center gap-2 mb-1">
          <IconifyIcon icon="solar:document-text-bold-duotone" className="text-primary fs-20" />
          <h5 className="fw-bold text-dark mb-0">Account Information</h5>
        </div>
        <span className="text-muted fs-12">Read-only account and system details.</span>
      </Card.Header>
      <Card.Body className="px-4 pb-4 mt-3">
        <InfoRow label="Email" value={account.email} />
        <InfoRow label="Username" value={account.username} />
        <InfoRow label="Admin ID" value={<span className="font-monospace fs-11" title={account.id}>{account.id}</span>} />
        <InfoRow label="Status" value={<StatusBadge status={account.status} />} />
        <InfoRow label="Roles" value={account.roles.map((r) => r.name).join(', ') || '—'} />
        <InfoRow label="Created At" value={new Date(account.createdAt).toLocaleDateString()} />
        <InfoRow label="Updated At" value={new Date(account.updatedAt).toLocaleDateString()} />
        <InfoRow label="Last Login" value={account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : 'Never'} />
      </Card.Body>
    </Card>
  )
}

export default AccountInfoCard
