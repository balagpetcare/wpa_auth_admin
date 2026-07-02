'use client'

import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Badge,
  Spinner,
} from 'react-bootstrap'
import { toast } from 'react-toastify'
import { auditLogsApi } from '@/features/audit-logs/api'
import { AuditLog } from '@/features/audit-logs/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { EmptyState, ErrorState } from '@/components/dashboard/DashboardComponents'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination & Filtering
  const [limit] = useState(20)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [userIdFilter, setUserIdFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  // Drawer / Detail state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showModal, setShowModal] = useState(false)

  const loadLogs = async (append = false) => {
    setLoading(true)
    setError(null)
    try {
      const response = await auditLogsApi.listAuditLogs({
        userId: userIdFilter || undefined,
        action: actionFilter || undefined,
        limit,
        cursor: append ? nextCursor ?? undefined : undefined,
      })
      const items = response.items ?? response.data?.items ?? []
      if (response.success) {
        setLogs((prev) => (append ? [...prev, ...items] : items))
        setNextCursor(response.nextCursor ?? response.data?.nextCursor ?? null)
        setHasNextPage(Boolean(response.hasNextPage ?? response.data?.hasNextPage))
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err)
      setError(err?.message || 'Access Denied: Missing permissions to query system audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [userIdFilter, actionFilter])

  // Get action color badge
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes('CREATE') || act.includes('ADD')) return 'success'
    if (act.includes('UPDATE') || act.includes('PATCH') || act.includes('EDIT')) return 'warning'
    if (act.includes('DELETE') || act.includes('REVOKE') || act.includes('REMOVE')) return 'danger'
    if (act.includes('LOGIN') || act.includes('AUTH')) return 'info'
    return 'secondary'
  }

  const handleOpenDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setShowModal(true)
  }

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">System Audit Logs</h4>
          <p className="text-muted mb-0 fs-13">Inspect cryptographic activity, account modifications, credentials rotation, and operations histories.</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={() => loadLogs(false)} disabled={loading} className="d-flex align-items-center gap-1 px-3 py-2 shadow-sm">
          <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16' : 'fs-16'} />
          Refresh Audit Trail
        </Button>
      </div>

      {error && <ErrorState message={error} onRetry={loadLogs} />}

      <Card className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
        <Card.Body className="p-0">
          {/* SEARCH & FILTERS */}
          <div className="p-4 border-bottom d-flex flex-wrap align-items-center gap-3">
            <div style={{ minWidth: '240px' }}>
              <Form.Control
                type="text"
                placeholder="Filter by Actor User ID..."
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value)
                  setNextCursor(null)
                  setHasNextPage(false)
                }}
              />
            </div>
            <div style={{ minWidth: '240px' }}>
              <Form.Control
                type="text"
                placeholder="Filter by Action (e.g. LOGIN, UPDATE)..."
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setNextCursor(null)
                  setHasNextPage(false)
                }}
              />
            </div>
          </div>

          {/* TABLE LIST */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState message="No audit events found matching current filter parameters." icon="solar:document-text-bold-duotone" />
          ) : (
            <>
              <div className="table-responsive">
                <Table className="align-middle mb-0" hover>
                  <thead className="table-light">
                    <tr>
                      <th>Time</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Resource Mapping</th>
                      <th>IP Address</th>
                      <th className="text-end px-4">Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span className="text-secondary fs-13">{new Date(log.createdAt).toLocaleString()}</span>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-semibold text-dark fs-13">
                              {log.user?.username || 'Internal System'}
                            </span>
                            {log.user?.email && <span className="text-muted fs-11">{log.user?.email}</span>}
                          </div>
                        </td>
                        <td>
                          <Badge bg={`soft-${getActionBadge(log.action)}`} className={`text-${getActionBadge(log.action)} fw-semibold px-2 py-1 fs-12`}>
                            {log.action}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="text-secondary fs-13">Type: <strong>{log.resource || 'N/A'}</strong></span>
                            {log.resourceId && (
                              <span className="text-muted font-monospace fs-11">Ref ID: {log.resourceId}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="text-secondary fs-13 font-monospace">{log.ipAddress || 'Internal'}</span>
                        </td>
                        <td className="text-end px-4">
                          <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => handleOpenDetails(log)}>
                            View Payload
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* PAGINATION PANEL */}
              {hasNextPage && (
                <div className="p-4 border-top text-center">
                  <Button variant="outline-primary" size="sm" onClick={() => loadLogs(true)}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* METADATA DETAILS MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Audit Event Properties</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div>
              <Row className="mb-3 border-bottom pb-3">
                <Col md={6} className="mb-2">
                  <span className="text-muted fs-12 d-block">Audit Log ID</span>
                  <strong className="text-dark fs-13 font-monospace">{selectedLog.id}</strong>
                </Col>
                <Col md={6} className="mb-2">
                  <span className="text-muted fs-12 d-block">Activity Timestamp</span>
                  <strong className="text-dark fs-13">{new Date(selectedLog.createdAt).toLocaleString()}</strong>
                </Col>
                <Col md={6} className="mb-2">
                  <span className="text-muted fs-12 d-block">Operator Type</span>
                  <strong className="text-dark fs-13">
                    {selectedLog.user?.username || 'Internal System Operator'}
                  </strong>
                </Col>
                <Col md={6} className="mb-2">
                  <span className="text-muted fs-12 d-block">Origin Network IP</span>
                  <strong className="text-dark fs-13 font-monospace">{selectedLog.ipAddress || '127.0.0.1'}</strong>
                </Col>
              </Row>

              <h6 className="fw-bold text-secondary text-uppercase fs-11 tracking-wider mb-2">Metadata Payload</h6>
              <pre className="p-3 bg-light text-dark rounded font-monospace fs-12" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close Properties
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
