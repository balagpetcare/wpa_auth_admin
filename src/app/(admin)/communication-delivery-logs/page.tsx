'use client'

// Phase 2.6A (docs/phase-2-6a-app-aware-communication-routing-ui.md):
// delivery log viewer — never renders credentials/secrets, only the
// backend's already-sanitized errorCode/errorMessage/providerResponse
// summary fields.
//
// Communication retry/resend center: extended to a full resend center —
// filters, retry-aware columns, row/bulk retry & cancel actions, and a
// detail view with provider attempt chain + audit trail. OTP/token
// messages are always shown as non-retryable with an explicit reason
// (see backend communication.retryPolicy.ts) — this page never lets an
// admin retry or bulk-retry one.

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Form, Button, Spinner, Badge, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { communicationApi } from '@/features/communication/api'
import { DeliveryLog, DeliveryLogDetail } from '@/features/communication/types'
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
  const [purpose, setPurpose] = useState('')
  const [recipient, setRecipient] = useState('')
  const [providerId, setProviderId] = useState('')
  const [retryableOnly, setRetryableOnly] = useState(false)
  const [deadLetterOnly, setDeadLetterOnly] = useState(false)
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [rowBusyId, setRowBusyId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const [detail, setDetail] = useState<DeliveryLogDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

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
      setSelected(new Set())
    }
    setPageError(null)
    try {
      const response = await communicationApi.getDeliveryLogs({
        channel: (channel || undefined) as any,
        status: status || undefined,
        purpose: purpose || undefined,
        recipient: recipient || undefined,
        providerId: providerId || undefined,
        retryableOnly: retryableOnly || undefined,
        deadLetterOnly: deadLetterOnly || undefined,
        createdFrom: createdFrom ? new Date(createdFrom).toISOString() : undefined,
        createdTo: createdTo ? new Date(createdTo).toISOString() : undefined,
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

  const canRetry = (log: DeliveryLog) => log.isRetryable && ['FAILED', 'DEAD_LETTER', 'RETRY_SCHEDULED'].includes(log.status)
  const canCancel = (log: DeliveryLog) => log.status === 'RETRY_SCHEDULED'

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const retryableIds = logs.filter(canRetry).map((l) => l.id)
    setSelected((prev) => (prev.size === retryableIds.length ? new Set() : new Set(retryableIds)))
  }

  const handleRetry = async (id: string) => {
    setRowBusyId(id)
    setActionMessage(null)
    try {
      const res = await communicationApi.retryDeliveryLog(id)
      setActionMessage(res.message || 'Retry attempted.')
      await load()
    } catch (error) {
      setActionMessage(error instanceof ApiError ? error.message : 'Retry failed.')
    } finally {
      setRowBusyId(null)
    }
  }

  const handleCancel = async (id: string) => {
    setRowBusyId(id)
    setActionMessage(null)
    try {
      const res = await communicationApi.cancelDeliveryLogRetry(id)
      setActionMessage(res.message || 'Retry cancelled.')
      await load()
    } catch (error) {
      setActionMessage(error instanceof ApiError ? error.message : 'Cancel failed.')
    } finally {
      setRowBusyId(null)
    }
  }

  const handleBulkRetry = async () => {
    if (!selected.size) return
    setBulkBusy(true)
    setActionMessage(null)
    try {
      const res = await communicationApi.bulkRetryDeliveryLogs(Array.from(selected))
      setActionMessage(res.message || `Retried ${res.data.retried} of ${res.data.requested} (${res.data.skipped} skipped).`)
      await load()
    } catch (error) {
      setActionMessage(error instanceof ApiError ? error.message : 'Bulk retry failed.')
    } finally {
      setBulkBusy(false)
    }
  }

  const handleBulkCancel = async () => {
    if (!selected.size) return
    setBulkBusy(true)
    setActionMessage(null)
    try {
      const res = await communicationApi.bulkCancelDeliveryLogRetries(Array.from(selected))
      setActionMessage(res.message || `Cancelled ${res.data.cancelled} of ${res.data.requested} (${res.data.skipped} skipped).`)
      await load()
    } catch (error) {
      setActionMessage(error instanceof ApiError ? error.message : 'Bulk cancel failed.')
    } finally {
      setBulkBusy(false)
    }
  }

  const openDetail = async (id: string) => {
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const res = await communicationApi.getDeliveryLogDetail(id)
      if (res.success) setDetail(res.data)
    } catch (error) {
      setDetailError(error instanceof ApiError ? error.message : 'Unable to load delivery details.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Delivery Logs &amp; Resend Center</h4>
        <p className="text-muted mb-0 fs-13">Every send attempt across all providers. Credentials are never shown here. OTP/token messages cannot be retried.</p>
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
                <Form.Label className="fs-12">Purpose</Form.Label>
                <Form.Select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  <option value="">All</option>
                  <option value="LOGIN">Login</option>
                  <option value="REGISTER">Register</option>
                  <option value="PASSWORD_RESET">Password Reset</option>
                  <option value="PAYMENT_VERIFY">Payment Verify</option>
                  <option value="ADMIN_INVITE">Admin Invite</option>
                  <option value="GENERAL">General</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="fs-12">Status</Form.Label>
                <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="QUEUED">Queued</option>
                  <option value="RETRY_SCHEDULED">Retry Scheduled</option>
                  <option value="RETRYING">Retrying</option>
                  <option value="DEAD_LETTER">Dead Letter</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RETRIED">Retried</option>
                  <option value="BLOCKED">Blocked</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label className="fs-12">Recipient</Form.Label>
                <Form.Control value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="email or phone" />
              </Col>
              <Col md={2}>
                <Form.Label className="fs-12">Provider ID</Form.Label>
                <Form.Control value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="provider id" />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  id="retryableOnly"
                  label="Retryable only"
                  checked={retryableOnly}
                  onChange={(e) => setRetryableOnly(e.target.checked)}
                  className="mb-1"
                />
                <Form.Check
                  type="checkbox"
                  id="deadLetterOnly"
                  label="Dead-letter only"
                  checked={deadLetterOnly}
                  onChange={(e) => setDeadLetterOnly(e.target.checked)}
                />
              </Col>
              <Col md={2}>
                <Form.Label className="fs-12">From</Form.Label>
                <Form.Control type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label className="fs-12">To</Form.Label>
                <Form.Control type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" size="sm">
                  Apply Filters
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {actionMessage ? (
        <div className="alert alert-info py-2 px-3 fs-13" role="status">
          {actionMessage}
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="fs-13 text-muted">{selected.size} selected</span>
          <Button size="sm" variant="outline-primary" disabled={bulkBusy} onClick={handleBulkRetry}>
            {bulkBusy ? <Spinner size="sm" animation="border" className="me-1" /> : null}
            Retry selected
          </Button>
          <Button size="sm" variant="outline-secondary" disabled={bulkBusy} onClick={handleBulkCancel}>
            Cancel selected retries
          </Button>
        </div>
      ) : null}

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
                    <th className="px-4">
                      <Form.Check type="checkbox" checked={selected.size > 0 && selected.size === logs.filter(canRetry).length} onChange={toggleSelectAll} />
                    </th>
                    <th>Recipient</th>
                    <th>Channel</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Provider</th>
                    <th>Retry</th>
                    <th>Next Retry</th>
                    <th>Last Error</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4">
                        <Form.Check type="checkbox" disabled={!canRetry(log)} checked={selected.has(log.id)} onChange={() => toggleSelected(log.id)} />
                      </td>
                      <td className="fs-13">{log.recipient}</td>
                      <td>
                        <Badge bg="soft-secondary" className="text-secondary">
                          {log.channel}
                        </Badge>
                      </td>
                      <td className="fs-13">{log.purpose}</td>
                      <td>
                        <StatusBadge status={log.status} />
                        {!log.isRetryable && (log.status === 'FAILED' || log.status === 'DEAD_LETTER') ? (
                          <OverlayTrigger overlay={<Tooltip>{log.nonRetryableReason || 'OTP messages are not retried for security and expiry reasons.'}</Tooltip>}>
                            <Badge bg="soft-warning" className="text-warning ms-1">Non-retryable</Badge>
                          </OverlayTrigger>
                        ) : null}
                      </td>
                      <td className="fs-13">{log.provider?.name || log.provider?.code || '—'}</td>
                      <td className="fs-13">{log.retryCount}/{log.maxRetries}</td>
                      <td className="fs-12 text-secondary">{log.nextRetryAt ? new Date(log.nextRetryAt).toLocaleString() : '—'}</td>
                      <td className="fs-12 text-danger text-truncate" style={{ maxWidth: 200 }} title={log.lastErrorMessage || log.errorMessage || ''}>
                        {log.lastErrorMessage || log.errorMessage || '—'}
                      </td>
                      <td className="fs-12 text-secondary">{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button size="sm" variant="outline-secondary" onClick={() => openDetail(log.id)}>
                            View
                          </Button>
                          {canRetry(log) ? (
                            <Button size="sm" variant="outline-primary" disabled={rowBusyId === log.id} onClick={() => handleRetry(log.id)}>
                              {rowBusyId === log.id ? <Spinner size="sm" animation="border" /> : 'Retry now'}
                            </Button>
                          ) : null}
                          {canCancel(log) ? (
                            <Button size="sm" variant="outline-danger" disabled={rowBusyId === log.id} onClick={() => handleCancel(log.id)}>
                              Cancel retry
                            </Button>
                          ) : null}
                        </div>
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

      <Modal show={!!detail || detailLoading || !!detailError} onHide={() => { setDetail(null); setDetailError(null) }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-18">Delivery Detail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : detailError ? (
            <div className="alert alert-danger">{detailError}</div>
          ) : detail ? (
            <div className="fs-13">
              <Row className="mb-3">
                <Col md={6}><strong>Recipient:</strong> {detail.recipient}</Col>
                <Col md={6}><strong>Channel:</strong> {detail.channel}</Col>
                <Col md={6}><strong>Purpose:</strong> {detail.purpose}</Col>
                <Col md={6}><strong>Status:</strong> <StatusBadge status={detail.status} /></Col>
                <Col md={6}><strong>Retry:</strong> {detail.retryCount}/{detail.maxRetries}</Col>
                <Col md={6}><strong>Next Retry:</strong> {detail.nextRetryAt ? new Date(detail.nextRetryAt).toLocaleString() : '—'}</Col>
              </Row>

              {!detail.isRetryable ? (
                <div className="alert alert-warning py-2">
                  {detail.nonRetryableReason || 'OTP messages are not retried for security and expiry reasons.'}
                </div>
              ) : null}

              {detail.lastErrorMessage || detail.errorMessage ? (
                <div className="mb-3">
                  <strong>Last error:</strong> {detail.lastErrorMessage || detail.errorMessage}
                </div>
              ) : null}

              {detail.messagePreview ? (
                <div className="mb-3">
                  <strong>Safe message preview:</strong>
                  <div className="border rounded p-2 mt-1 bg-light">
                    {detail.messagePreview.subject ? <div><strong>Subject:</strong> {detail.messagePreview.subject}</div> : null}
                    <div className="text-truncate">{detail.messagePreview.text || detail.messagePreview.message}</div>
                  </div>
                </div>
              ) : null}

              <div className="mb-3">
                <strong>Provider attempt chain:</strong>
                <Table size="sm" className="mt-1">
                  <thead>
                    <tr><th>#</th><th>Provider</th><th>Result</th><th>Error</th><th>At</th></tr>
                  </thead>
                  <tbody>
                    {(detail.providerAttemptChain || []).map((a, i) => (
                      <tr key={i}>
                        <td>{a.attemptNo}</td>
                        <td>{a.providerCode || '—'}</td>
                        <td>{a.success ? <Badge bg="soft-success" className="text-success">Success</Badge> : <Badge bg="soft-danger" className="text-danger">Failed</Badge>}</td>
                        <td className="text-truncate" style={{ maxWidth: 180 }} title={a.errorMessage || ''}>{a.errorMessage || '—'}</td>
                        <td>{new Date(a.at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div>
                <strong>Audit trail:</strong>
                <Table size="sm" className="mt-1">
                  <thead>
                    <tr><th>Action</th><th>By</th><th>When</th></tr>
                  </thead>
                  <tbody>
                    {(detail.auditTrail || []).map((a) => (
                      <tr key={a.id}>
                        <td>{a.action}</td>
                        <td>{a.actorAdmin?.email || a.actorAdmin?.username || 'System'}</td>
                        <td>{new Date(a.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : null}
        </Modal.Body>
      </Modal>
    </div>
  )
}
