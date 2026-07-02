'use client'

// Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// delivery log viewer — never renders credentials/secrets, only the
// backend's already-sanitized errorCode/errorMessage/providerResponse
// summary fields.

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Form, Button, Spinner, Badge } from 'react-bootstrap'
import { communicationApi } from '@/features/communication/api'
import { DeliveryLog } from '@/features/communication/types'
import { StatusBadge, EmptyState } from '@/components/dashboard/DashboardComponents'
import ApiErrorState from '@/components/common/ApiErrorState'
import { ApiError } from '@/lib/apiClient'

export default function DeliveryLogsPage() {
  const [logs, setLogs] = useState<DeliveryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const [recipient, setRecipient] = useState('')
  const [countryCode, setCountryCode] = useState('')

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
      const response = await communicationApi.getDeliveryLogs({
        channel: (channel || undefined) as any,
        status: status || undefined,
        recipient: recipient || undefined,
        countryCode: countryCode || undefined,
        limit: 25,
        cursor: append ? nextCursor ?? undefined : undefined,
      })
      if (response.success) {
        const { items, nextCursor: cursor, hasNextPage: next } = extractPaged(response)
        setLogs((prev) => (append ? [...prev, ...items] : items))
        setNextCursor(cursor)
        setHasNextPage(next)
      }
    } catch (error: any) {
      console.error('Failed to load delivery logs:', error)
      if (error instanceof ApiError) {
        setPageError({ message: error.status === 403 ? 'You do not have permission to view delivery logs.' : error.message, status: error.status })
      } else {
        setPageError({ message: 'Unable to load delivery logs.' })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Delivery Logs</h4>
        <p className="text-muted mb-0 fs-13">Every send attempt across all providers. Credentials are never shown here.</p>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Form onSubmit={handleFilterSubmit}>
            <Row className="g-2 align-items-end">
              <Col md={2}>
                <Form.Label className="fs-12">Channel</Form.Label>
                <Form.Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="">All</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="fs-12">Status</Form.Label>
                <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="QUEUED">Queued</option>
                  <option value="RETRIED">Retried</option>
                  <option value="BLOCKED">Blocked</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="fs-12">Recipient</Form.Label>
                <Form.Control value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="email or phone" />
              </Col>
              <Col md={2}>
                <Form.Label className="fs-12">Country</Form.Label>
                <Form.Control value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder="e.g. 880" />
              </Col>
              <Col md={3}>
                <Button type="submit" variant="primary" size="sm">
                  Apply Filters
                </Button>
              </Col>
            </Row>
          </Form>
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
            ) : logs.length === 0 ? (
              <EmptyState message="No delivery logs match the current filters." icon="solar:clipboard-list-bold-duotone" />
            ) : (
              <>
              <Table hover responsive className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4">Recipient</th>
                    <th>Channel</th>
                    <th>Purpose</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Attempt</th>
                    <th>Error</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 fs-13">{log.recipient}</td>
                      <td>
                        <Badge bg="soft-secondary" className="text-secondary">
                          {log.channel}
                        </Badge>
                      </td>
                      <td className="fs-13">{log.purpose}</td>
                      <td className="fs-13">{log.countryCode || '—'}</td>
                      <td>
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="fs-13">{log.attemptNo}</td>
                      <td className="fs-12 text-danger text-truncate" style={{ maxWidth: 220 }} title={log.errorMessage || ''}>
                        {log.errorMessage || '—'}
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
