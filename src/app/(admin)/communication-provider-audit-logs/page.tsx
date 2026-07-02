'use client'

import React, { useEffect, useState } from 'react'
import { Card, Table, Spinner, Button } from 'react-bootstrap'
import { communicationApi } from '@/features/communication/api'
import { ProviderAuditLog } from '@/features/communication/types'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'

export default function ProviderAuditLogsPage() {
  const [logs, setLogs] = useState<ProviderAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  const extractPaged = (response: any) => {
    const data = response?.data ?? response
    return {
      items: data?.items ?? [],
      nextCursor: data?.nextCursor ?? null,
      hasNextPage: Boolean(data?.hasNextPage),
    }
  }

  const load = async (append = false) => {
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setLogs([])
      setNextCursor(null)
      setHasNextPage(false)
    }
    setPageError(null)
    try {
      const response = await communicationApi.getProviderAuditLogs(25, append ? nextCursor ?? undefined : undefined)
      if (response.success) {
        const { items, nextCursor: cursor, hasNextPage: next } = extractPaged(response)
        setLogs((prev) => (append ? [...prev, ...items] : items))
        setNextCursor(cursor)
        setHasNextPage(next)
      }
    } catch (error: any) {
      console.error('Failed to load provider audit logs:', error)
      if (error instanceof ApiError) {
        setPageError({ message: error.status === 403 ? 'You do not have permission to view provider audit logs.' : error.message, status: error.status })
      } else {
        setPageError({ message: 'Unable to load provider audit logs.' })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Provider Audit Logs</h4>
        <p className="text-muted mb-0 fs-13">Every create/update/credential/test/rate-limit-block action on communication providers.</p>
      </div>

      {pageError ? (
        <ApiErrorState message={pageError.message} status={pageError.status} onRetry={load} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : logs.length === 0 ? (
              <EmptyState message="No provider audit log entries yet." icon="solar:document-text-bold-duotone" />
            ) : (
              <>
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4">Action</th>
                      <th>Provider</th>
                      <th>Actor</th>
                      <th>Metadata</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 fs-13 fw-semibold">{log.action}</td>
                        <td className="fs-12 text-secondary">{log.providerId || '—'}</td>
                        <td className="fs-12 text-secondary">{log.actorAdminId || 'system'}</td>
                        <td className="fs-11 text-secondary text-truncate" style={{ maxWidth: 280 }} title={JSON.stringify(log.metadata || {})}>
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                        <td className="fs-12 text-secondary">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {hasNextPage && (
                  <div className="text-center py-3 border-top">
                    <Button variant="outline-primary" size="sm" disabled={loadingMore} onClick={() => load(true)}>
                      {loadingMore ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
