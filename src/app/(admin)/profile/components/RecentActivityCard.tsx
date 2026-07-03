'use client'

import { useEffect, useState } from 'react'
import { Card, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import { accountApi } from '@/features/account/api'
import { AuditLogEntry } from '@/features/account/types'

const formatAction = (action: string) =>
  action
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')

const RecentActivityCard = ({ userId }: { userId: string }) => {
  const [items, setItems] = useState<AuditLogEntry[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading is seeded by mount and updated only by async completion
    accountApi
      .listMyActivity(userId, 8)
      .then((res) => {
        if (!cancelled) setItems(res.data.items)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
        <div className="d-flex align-items-center gap-2 mb-1">
          <IconifyIcon icon="solar:history-bold-duotone" className="text-primary fs-20" />
          <h5 className="fw-bold text-dark mb-0">Recent Activity</h5>
        </div>
        <span className="text-muted fs-12">Recent profile and security events for your account.</span>
      </Card.Header>
      <Card.Body className="px-4 pb-4 mt-3">
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="d-flex flex-column gap-2">
            {items.map((item) => (
              <div key={item.id} className="d-flex justify-content-between align-items-center border-bottom py-2 fs-13">
                <span className="text-dark fw-medium">{formatAction(item.action)}</span>
                <span className="text-muted fs-12">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No recent profile activity." icon="solar:inbox-line-bold-duotone" />
        )}
      </Card.Body>
    </Card>
  )
}

export default RecentActivityCard
