'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, Button, Form, Badge, Spinner, Table, Row, Col, Modal } from 'react-bootstrap'
import { apiClient, ApiError } from '@/lib/apiClient'
import ApiErrorState from '@/components/common/ApiErrorState'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

type SecurityEvent = {
  id: string
  type: string
  severity: string
  createdAt: string
  resolved?: boolean
  ipAddress?: string | null
  userAgent?: string | null
  userId?: string | null
  clientId?: string | null
  user?: { id: string; email: string; username: string } | null
  metadata?: Record<string, unknown> | null
}

type SecurityEventsResponse = {
  success: boolean
  data?: {
    items?: SecurityEvent[]
    nextCursor?: string | null
    hasNextPage?: boolean
    limit?: number
  }
}

const EVENT_TYPE_OPTIONS = [
  'TOKEN_REUSE_DETECTED',
  'REFRESH_TOKEN_REUSE_DETECTED',
  'BRUTE_FORCE_DETECTED',
  'BOT_TRAFFIC_SPIKE',
  'ADMIN_LOGIN_ABUSE',
  'RATE_LIMIT_BLOCKED',
  'TEMPORARY_BLOCK_APPLIED',
  'QUEUE_FAILURE',
  'PROVIDER_FAILURE',
]

function redactMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return null
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase()
    if (lower.includes('token') || lower.includes('secret') || lower.includes('password') || lower.includes('refresh') || lower.includes('credential')) {
      out[key] = '[redacted]'
      continue
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = redactMetadata(value as Record<string, unknown>)
      continue
    }
    out[key] = value
  }
  return out
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  return query.toString()
}

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [resolvedFilter, setResolvedFilter] = useState('ALL')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)

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
      const query = buildQuery({
        limit: '25',
        cursor: append ? nextCursor ?? undefined : undefined,
        type: typeFilter || undefined,
        severity: severityFilter === 'ALL' ? undefined : severityFilter,
        resolved: resolvedFilter === 'ALL' ? undefined : resolvedFilter === 'true' ? 'true' : 'false',
        userId: userIdFilter || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
      })
      const response = await apiClient.get<SecurityEventsResponse>(`/admin/security-events${query ? `?${query}` : ''}`)
      const data = response?.data ?? {}
      const items = data.items ?? []
      const cursor = data.nextCursor ?? null
      const next = Boolean(data.hasNextPage)
      setEvents((prev) => (append ? [...prev, ...items] : items))
      setNextCursor(cursor)
      setHasNextPage(next)
    } catch (err) {
      if (err instanceof ApiError) {
        setError({
          message: err.status === 403 ? 'You do not have permission to view security events.' : err.message,
          status: err.status,
        })
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

  const filtered = useMemo(() => events, [events])

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Security Events</h4>
          <p className="text-muted mb-0 fs-13">Review suspicious activity, token reuse, brute-force attempts, temporary blocks, and worker or provider failures.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => load()} disabled={loading}>
            <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16 me-1' : 'fs-16 me-1'} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <ApiErrorState message={error.message} status={error.status} onRetry={() => load()} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <Row className="g-2 mb-3">
              <Col md={3}>
                <Form.Control placeholder="Filter by event type..." value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                  <option value="ALL">All Severities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="false">Unresolved</option>
                  <option value="true">Resolved</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control placeholder="User ID" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
              </Col>
              <Col md={1}>
                <Form.Control type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
              </Col>
              <Col md={1}>
                <Form.Control type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
              </Col>
              <Col md={1} className="d-flex">
                <Button variant="primary" className="w-100" onClick={() => load()} disabled={loading}>
                  Apply
                </Button>
              </Col>
            </Row>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {EVENT_TYPE_OPTIONS.slice(0, 6).map((item) => (
                <Badge key={item} bg="soft-secondary" className="text-secondary">
                  {item}
                </Badge>
              ))}
            </div>

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
                      <th>Status</th>
                      <th>User</th>
                      <th>Client</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((event) => (
                      <tr key={event.id} role="button" onClick={() => setSelectedEvent(event)}>
                        <td className="text-secondary fs-13">{new Date(event.createdAt).toLocaleString()}</td>
                        <td className="fw-semibold">{event.type}</td>
                        <td>
                          <Badge bg={`soft-${event.severity === 'CRITICAL' ? 'danger' : event.severity === 'HIGH' ? 'warning' : 'info'}`} className="text-capitalize">
                            {event.severity}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={event.resolved ? 'soft-success' : 'soft-secondary'} className={event.resolved ? 'text-success' : 'text-secondary'}>
                            {event.resolved ? 'Resolved' : 'Open'}
                          </Badge>
                        </td>
                        <td className="font-monospace fs-12">{event.user?.email || event.userId || '—'}</td>
                        <td className="font-monospace fs-12">{event.clientId || '—'}</td>
                        <td className="font-monospace fs-12">{event.ipAddress || '—'}</td>
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

      <Modal show={Boolean(selectedEvent)} onHide={() => setSelectedEvent(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Security Event Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent ? (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap gap-2">
                <Badge bg="soft-primary" className="text-primary">{selectedEvent.type}</Badge>
                <Badge bg={`soft-${selectedEvent.severity === 'CRITICAL' ? 'danger' : selectedEvent.severity === 'HIGH' ? 'warning' : 'info'}`} className="text-capitalize">
                  {selectedEvent.severity}
                </Badge>
                <Badge bg={selectedEvent.resolved ? 'soft-success' : 'soft-secondary'} className={selectedEvent.resolved ? 'text-success' : 'text-secondary'}>
                  {selectedEvent.resolved ? 'Resolved' : 'Open'}
                </Badge>
              </div>
              <div className="small text-muted">Created at {new Date(selectedEvent.createdAt).toLocaleString()}</div>
              <div className="d-grid gap-2">
                <div><strong>User:</strong> {selectedEvent.user?.email || selectedEvent.userId || '—'}</div>
                <div><strong>Client:</strong> {selectedEvent.clientId || '—'}</div>
                <div><strong>IP:</strong> {selectedEvent.ipAddress || '—'}</div>
                <div><strong>User Agent:</strong> {selectedEvent.userAgent || '—'}</div>
              </div>
              <div>
                <div className="fw-semibold mb-2">Redacted metadata</div>
                <pre className="mb-0 text-wrap bg-light p-3 rounded">{JSON.stringify(redactMetadata(selectedEvent.metadata), null, 2)}</pre>
              </div>
            </div>
          ) : null}
        </Modal.Body>
      </Modal>
    </div>
  )
}
