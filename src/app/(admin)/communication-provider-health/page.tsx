'use client'

import React, { useEffect, useState } from 'react'
import { Card, Table, Form, Spinner, Badge } from 'react-bootstrap'
import { communicationApi } from '@/features/communication/api'
import { CommProvider } from '@/features/communication/types'
import { StatusBadge, EmptyState } from '@/components/dashboard/DashboardComponents'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'

export default function ProviderHealthPage() {
  const [providers, setProviders] = useState<CommProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'SMS' | 'EMAIL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN'>('ALL')

  const load = async () => {
    setLoading(true)
    setPageError(null)
    try {
      const response = await communicationApi.getProviderHealth()
      if (response.success) setProviders(response.data.items)
    } catch (error: any) {
      console.error('Failed to load provider health:', error)
      if (error instanceof ApiError) {
        setPageError({ message: error.status === 403 ? 'You do not have permission to view provider health.' : error.message, status: error.status })
      } else {
        setPageError({ message: 'Unable to load provider health.' })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = providers.filter((p) => (channelFilter === 'ALL' || p.type === channelFilter) && (statusFilter === 'ALL' || p.healthStatus === statusFilter))

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Provider Health</h4>
        <p className="text-muted mb-0 fs-13">Live delivery success/failure tracking per provider.</p>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="d-flex gap-2">
          <Form.Select style={{ maxWidth: 200 }} value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as any)}>
            <option value="ALL">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
          </Form.Select>
          <Form.Select style={{ maxWidth: 200 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="ALL">All Health Statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="DEGRADED">Degraded</option>
            <option value="DOWN">Down</option>
            <option value="UNKNOWN">Unknown</option>
          </Form.Select>
        </Card.Body>
      </Card>

      {pageError ? (
        <ApiErrorState message={pageError.message} status={pageError.status} onRetry={load} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState message="No providers match the current filters." icon="solar:heart-pulse-2-bold-duotone" />
            ) : (
              <Table hover responsive className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4">Provider</th>
                    <th>Channel</th>
                    <th>Health</th>
                    <th>Success</th>
                    <th>Failures</th>
                    <th>Last Success</th>
                    <th>Last Failure</th>
                    <th>Last Test</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((provider) => (
                    <tr key={provider.id}>
                      <td className="px-4 fw-semibold fs-13">{provider.name}</td>
                      <td>
                        <Badge bg="soft-secondary" className="text-secondary">
                          {provider.type}
                        </Badge>
                      </td>
                      <td>
                        <StatusBadge status={provider.healthStatus} />
                      </td>
                      <td className="text-success fw-semibold">{provider.successCount}</td>
                      <td className="text-danger fw-semibold">{provider.failureCount}</td>
                      <td className="fs-12 text-secondary">{provider.lastSuccessAt ? new Date(provider.lastSuccessAt).toLocaleString() : '—'}</td>
                      <td className="fs-12 text-secondary">{provider.lastFailureAt ? new Date(provider.lastFailureAt).toLocaleString() : '—'}</td>
                      <td className="fs-12">
                        {provider.credentials?.[0]?.lastTestStatus ? <StatusBadge status={provider.credentials[0].lastTestStatus} /> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
