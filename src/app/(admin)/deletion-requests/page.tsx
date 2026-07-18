'use client'

import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import { deletionApi } from '@/features/deletion/api'
import type { DeletionRequestDetail, DeletionRequestListItem, DeletionRequestStatus } from '@/features/deletion/types'
import { EmptyState, ErrorState } from '@/components/dashboard/DashboardComponents'
import adminToast from '@/lib/adminToast'

function badgeTone(status: DeletionRequestStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'SCHEDULED':
      return 'warning'
    case 'PROCESSING':
      return 'info'
    case 'CANCELLED':
      return 'secondary'
    case 'REJECTED':
    case 'FAILED':
      return 'danger'
    default:
      return 'primary'
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function DeletionRequestsPage() {
  const [items, setItems] = useState<DeletionRequestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [providerFilter, setProviderFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<DeletionRequestDetail | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async (nextPage = page) => {
    setLoading(true)
    setError(null)
    try {
      const response = await deletionApi.listRequests({
        status: statusFilter,
        requestType: typeFilter,
        provider: providerFilter,
        requestSource: sourceFilter,
        search: search || undefined,
        page: nextPage,
        limit: pageSize,
      })
      setItems(response.data.items)
      setPage(response.data.page)
      setTotalPages(response.data.totalPages)
    } catch (err: any) {
      setError(err?.message || 'Unable to load deletion requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1)
  }, [statusFilter, typeFilter, providerFilter, sourceFilter])

  const openDetails = async (requestId: string) => {
    setShowModal(true)
    setSelected(null)
    setSaving(false)
    try {
      const response = await deletionApi.getRequest(requestId)
      setSelected(response.data)
    } catch (err: any) {
      adminToast.error('Unable to load request details.', err?.message || 'Please try again.')
    }
  }

  const refreshCurrent = async () => {
    await load(page)
  }

  const runAction = async (action: 'approve' | 'reject' | 'retry' | 'cancel') => {
    if (!selected) return
    let reason: string | undefined
    if (action === 'reject') {
      reason = window.prompt('Provide a rejection reason:', '')?.trim() || undefined
      if (!reason) return
    } else {
      const verb = action === 'approve' ? 'approve' : action === 'retry' ? 'retry' : 'cancel'
      if (!window.confirm(`Are you sure you want to ${verb} this deletion request?`)) return
    }

    setSaving(true)
    try {
      const response = await deletionApi.updateRequest(selected.id, action, reason)
      setSelected(response.data)
      const actionLabel = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'retry' ? 'retried' : 'cancelled'
      adminToast.success('Deletion request updated.', `The request was ${actionLabel} successfully.`)
      await refreshCurrent()
    } catch (err: any) {
      adminToast.error('Unable to update deletion request.', err?.message || 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Deletion Requests</h4>
          <p className="text-muted mb-0 fs-13">Review account and social-data deletion requests, track status, and process manual approvals.</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={() => void load(page)} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={() => load(1)} />}

      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Control placeholder="Search code, email hash, or user id" value={search} onChange={(e) => setSearch(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {['ALL', 'PENDING_REVIEW', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REJECTED', 'FAILED'].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                {['ALL', 'ACCOUNT', 'DATA'].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
                {['ALL', 'GOOGLE', 'FACEBOOK', 'APPLE', 'MICROSOFT', 'LINKEDIN', 'TIKTOK', 'X', 'GITHUB', 'INSTAGRAM'].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                {['ALL', 'AUTHENTICATED_WEB', 'PUBLIC_WEB', 'EMAIL_REQUEST', 'META_CALLBACK', 'ADMIN'].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <div className="mt-3 d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => { setSearch(''); setStatusFilter('ALL'); setTypeFilter('ALL'); setProviderFilter('ALL'); setSourceFilter('ALL'); }}>
              Clear filters
            </Button>
            <Button variant="primary" size="sm" onClick={() => void load(1)}>
              Apply
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState message="No deletion requests match the current filters." icon="solar:trash-bin-2-bold-duotone" />
          ) : (
            <>
              <div className="table-responsive">
                <Table className="align-middle mb-0" hover>
                  <thead className="table-light">
                    <tr>
                      <th>Time</th>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Reference</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((request) => (
                      <tr key={request.id}>
                        <td className="fs-13">{formatDate(request.requestedAt)}</td>
                        <td className="font-monospace fs-13">{request.confirmationCode}</td>
                        <td>{request.requestType}</td>
                        <td className="fs-13">{request.requestSource}</td>
                        <td>
                          <Badge bg={badgeTone(request.status)}>{request.status}</Badge>
                        </td>
                        <td className="fs-13">
                          {request.emailReference || request.userId || 'N/A'}
                          {request.provider ? <div className="text-muted small">{request.provider}</div> : null}
                        </td>
                        <td className="text-end">
                          <Button variant="link" size="sm" onClick={() => void openDetails(request.id)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="p-3 border-top d-flex justify-content-between align-items-center">
                <span className="fs-13 text-muted">Page {page} of {totalPages}</span>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => void load(Math.max(1, page - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => void load(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Deletion Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selected ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <div>
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <div className="fw-semibold mb-2">Request</div>
                      <div><strong>Code:</strong> <span className="font-monospace">{selected.confirmationCode}</span></div>
                      <div><strong>Type:</strong> {selected.requestType}</div>
                      <div><strong>Source:</strong> {selected.requestSource}</div>
                      <div><strong>Provider:</strong> {selected.provider || 'N/A'}</div>
                      <div><strong>Status:</strong> <Badge bg={badgeTone(selected.status)} className="ms-1">{selected.status}</Badge></div>
                      <div><strong>Requested:</strong> {formatDate(selected.requestedAt)}</div>
                      <div><strong>Grace deadline:</strong> {formatDate(selected.gracePeriodDeadlineAt)}</div>
                      <div><strong>Processed:</strong> {formatDate(selected.processedAt)}</div>
                      <div><strong>Cancelled:</strong> {formatDate(selected.cancelledAt)}</div>
                      <div><strong>Reviewed:</strong> {formatDate(selected.reviewedAt)}</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <div className="fw-semibold mb-2">Subject</div>
                      <div><strong>User ID:</strong> {selected.userId || 'N/A'}</div>
                      <div><strong>Email hash:</strong> <span className="font-monospace">{selected.emailHash || 'N/A'}</span></div>
                      <div><strong>Email ref:</strong> {selected.emailReference || 'N/A'}</div>
                      <div><strong>IP:</strong> <span className="font-monospace">{selected.sourceIp || 'N/A'}</span></div>
                      <div><strong>User agent:</strong> {selected.sourceUserAgent || 'N/A'}</div>
                      {selected.user && (
                        <div className="mt-3 rounded border p-3 bg-light">
                          <div className="fw-semibold mb-1">Linked user</div>
                          <div>{selected.user.displayName || selected.user.username || selected.user.email || selected.user.id}</div>
                          <div className="text-muted fs-13">{selected.user.status}</div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {selected.failureReason && (
                <div className="alert alert-danger">{selected.failureReason}</div>
              )}

              <Card className="mb-3">
                <Card.Body>
                  <div className="fw-semibold mb-2">Audit metadata</div>
                  <pre className="mb-0 bg-light p-3 rounded small" style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {JSON.stringify(selected.auditMetadata ?? {}, null, 2)}
                  </pre>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="fw-semibold mb-3">Processing history</div>
                  <div className="d-flex flex-column gap-2">
                    {(selected.events ?? []).map((event) => (
                      <div key={event.id} className="rounded border p-3">
                        <div className="d-flex justify-content-between gap-3">
                          <div className="fw-semibold">{event.eventType}</div>
                          <div className="text-muted fs-13">{formatDate(event.createdAt)}</div>
                        </div>
                        <div className="text-muted fs-13">Source: {event.actorSource}</div>
                        <pre className="mb-0 mt-2 bg-light p-2 rounded small">{JSON.stringify(event.metadata ?? {}, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <div className="d-flex gap-2">
            {selected && selected.status === 'PENDING_REVIEW' && (
              <>
                <Button variant="success" onClick={() => void runAction('approve')} disabled={saving}>Approve</Button>
                <Button variant="danger" onClick={() => void runAction('reject')} disabled={saving}>Reject</Button>
              </>
            )}
            {selected && selected.status === 'FAILED' && (
              <Button variant="warning" onClick={() => void runAction('retry')} disabled={saving}>Retry</Button>
            )}
            {selected && selected.status === 'SCHEDULED' && (
              <Button variant="outline-danger" onClick={() => void runAction('cancel')} disabled={saving}>Cancel</Button>
            )}
          </div>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
