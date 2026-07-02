'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, Button, Form, Badge, Spinner, Table, Row, Col } from 'react-bootstrap'
import { apiClient, ApiError } from '@/lib/apiClient'
import ApiErrorState from '@/components/common/ApiErrorState'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

type SecurityEvent = {
  id: string
  type: string
  severity: string
  createdAt: string
  ipAddress?: string | null
  userAgent?: string | null
  userId?: string | null
  clientId?: string | null
  metadata?: Record<string, unknown> | null
}

function redactMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return null
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase()
    if (lower.includes('token') || lower.includes('secret') || lower.includes('password') || lower.includes('refresh')) {
      out[key] = '[redacted]'
      continue
    }
    out[key] = value
  }
  return out
}

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  const extractPaged = (response: any) => {
    const data = response?.data ?? response
    return {
      items: data?.items ?? response?.events ?? response?.items ?? [],
      nextCursor: data?.nextCursor ?? response?.nextCursor ?? null,
      hasNextPage: Boolean(data?.hasNextPage ?? response?.hasNextPage),
    }
  }

  const load = async (append = false) => {
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setEvents([])
      setNextCursor(null)
      setHasNextPage(false)
    }
    setError(null)
    try {
      const response = await apiClient.get<{ success: boolean; events?: SecurityEvent[]; data?: { items?: SecurityEvent[]; nextCursor?: string | null; hasNextPage?: boolean } }>(`/admin/security-events?limit=25${append && nextCursor ? `&cursor=${encodeURIComponent(nextCursor)}` : ''}`)
      const { items, nextCursor: cursor, hasNextPage: next } = extractPaged(response)
      setEvents((prev) => (append ? [...prev, ...items] : items))
      setNextCursor(cursor)
      setHasNextPage(next)
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ message: err.status === 403 ? 'You do not have permission to view security events.' : err.message, status: err.status })
      } else {
        setError({ message: 'Unable to load security events.' })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const matchesType = !typeFilter || event.type.toLowerCase().includes(typeFilter.toLowerCase())
      const matchesSeverity = severityFilter === 'ALL' || event.severity === severityFilter
      const matchesUser = !userIdFilter || (event.userId ?? '').toLowerCase().includes(userIdFilter.toLowerCase())
      return matchesType && matchesSeverity && matchesUser
    })
  }, [events, typeFilter, severityFilter, userIdFilter])

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Security Events</h4>
          <p className="text-muted mb-0 fs-13">Review suspicious activity, token reuse, brute-force attempts, and temporary blocks.</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={() => load()} disabled={loading}>
          <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16 me-1' : 'fs-16 me-1'} />
          Refresh
        </Button>
      </div>

      {error ? (
        <ApiErrorState message={error.message} status={error.status} onRetry={load} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <Row className="g-2 mb-3">
              <Col md={4}>
                <Form.Control placeholder="Filter by event type..." value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                  <option value="ALL">All Severities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Form.Select>
              </Col>
              <Col md={5}>
                <Form.Control placeholder="Filter by user ID..." value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
              </Col>
            </Row>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState message="No security events match the current filters." icon="solar:shield-warning-bold-duotone" />
            ) : (
              <>
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>User</th>
                    <th>Client</th>
                    <th>IP</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id}>
                      <td className="text-secondary fs-13">{new Date(event.createdAt).toLocaleString()}</td>
                      <td className="fw-semibold">{event.type}</td>
                      <td>
                        <Badge bg={`soft-${event.severity === 'CRITICAL' ? 'danger' : event.severity === 'HIGH' ? 'warning' : 'info'}`} className="text-capitalize">
                          {event.severity}
                        </Badge>
                      </td>
                      <td className="font-monospace fs-12">{event.userId || '—'}</td>
                      <td className="font-monospace fs-12">{event.clientId || '—'}</td>
                      <td className="font-monospace fs-12">{event.ipAddress || '—'}</td>
                      <td className="fs-12">
                        <pre className="mb-0 text-wrap bg-light p-2 rounded">{JSON.stringify(redactMetadata(event.metadata), null, 2)}</pre>
                      </td>
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
