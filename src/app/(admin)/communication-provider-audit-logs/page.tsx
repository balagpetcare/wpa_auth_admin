'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import ApiErrorState from '@/components/common/ApiErrorState'
import { EmptyState } from '@/components/dashboard/DashboardComponents'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { communicationApi } from '@/features/communication/api'
import { ProviderAuditLog, CommProvider } from '@/features/communication/types'
import { ApiError } from '@/lib/apiClient'

type DatePreset = 'all' | 'today' | '7d' | '30d'

const actionLabel = (action: string) => action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase())

const actionTone = (action: string) => {
  if (/FAILED|BLOCKED|DELETED|DISABLED|REVOKED/i.test(action)) return { bg: 'soft-danger', text: 'danger' }
  if (/TEST|RETRY|RESEND/i.test(action)) return { bg: 'soft-warning', text: 'warning' }
  if (/CREATED|UPDATED|GRANTED|SUCCEEDED|ACCEPTED|ENABLED|HEALTH/i.test(action)) return { bg: 'soft-success', text: 'success' }
  return { bg: 'soft-primary', text: 'primary' }
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

const toRange = (preset: DatePreset) => {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  if (preset === 'all') return {}
  const start = new Date(now)
  if (preset === 'today') start.setHours(0, 0, 0, 0)
  if (preset === '7d') start.setDate(start.getDate() - 7)
  if (preset === '30d') start.setDate(start.getDate() - 30)
  start.setHours(0, 0, 0, 0)
  return { createdFrom: start.toISOString(), createdTo: end.toISOString() }
}

const redactMetadata = (value: unknown, depth = 0): unknown => {
  if (value == null || depth > 6) return value
  if (Array.isArray(value)) return value.map((item) => redactMetadata(item, depth + 1))
  if (typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => {
    const lower = key.toLowerCase()
    if (/(token|secret|password|otp|authorization|api[-_]?key|refresh|private[-_]?key|client[-_]?secret)/.test(lower)) {
      return [key, '[REDACTED]']
    }
    return [key, redactMetadata(item, depth + 1)]
  }))
}

const summarize = (logs: ProviderAuditLog[]) => ({
  total: logs.length,
  providerTests: logs.filter((log) => /TEST/i.test(log.action)).length,
  deliveryBlockedRetried: logs.filter((log) => /BLOCKED|RETRY|RESEND/i.test(log.action)).length,
  failedActions: logs.filter((log) => /FAILED|ERROR|DISABLED|DELETED/i.test(log.action)).length,
})

export default function ProviderAuditLogsPage() {
  const [logs, setLogs] = useState<ProviderAuditLog[]>([])
  const [providers, setProviders] = useState<CommProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pageError, setPageError] = useState<{ message: string; status?: number } | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalCount, setTotalCount] = useState<number>(0)

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [actorFilter, setActorFilter] = useState('')
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [pageSize, setPageSize] = useState(25)
  const [selectedLog, setSelectedLog] = useState<ProviderAuditLog | null>(null)

  const providerOptions = useMemo(() => providers, [providers])

  const loadProviders = useCallback(async () => {
    try {
      const response = await communicationApi.listProviders({ type: undefined })
      setProviders(response?.data?.items ?? [])
    } catch {
      setProviders([])
    }
  }, [])

  const load = useCallback(async (append = false) => {
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setLogs([])
      setNextCursor(null)
      setHasNextPage(false)
    }
    setPageError(null)
    try {
      const range = toRange(datePreset)
      const response = await communicationApi.getProviderAuditLogs({
        limit: pageSize,
        cursor: append ? nextCursor ?? undefined : undefined,
        action: actionFilter || undefined,
        providerId: providerFilter || undefined,
        actorAdminId: actorFilter || undefined,
        search: search.trim() || undefined,
        createdFrom: 'createdFrom' in range ? range.createdFrom : undefined,
        createdTo: 'createdTo' in range ? range.createdTo : undefined,
      })
      if (response.success) {
        const data = response.data
        setLogs((prev) => (append ? [...prev, ...(data.items ?? [])] : (data.items ?? [])))
        setNextCursor(data.nextCursor ?? null)
        setHasNextPage(Boolean(data.hasNextPage))
        setTotalCount(data.totalCount ?? data.items?.length ?? 0)
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
  }, [actionFilter, actorFilter, datePreset, nextCursor, pageSize, providerFilter, search])

  useEffect(() => {
    void loadProviders()
  }, [loadProviders])

  useEffect(() => {
    void load()
  }, [load])

  const visibleLogs = useMemo(() => {
    const term = search.trim().toLowerCase()
    return logs.filter((log) => {
      if (!term) return true
      const meta = JSON.stringify(log.metadata ?? {})
      const haystack = [
        log.action,
        log.provider?.name ?? '',
        log.provider?.code ?? '',
        log.providerId ?? '',
        log.actorAdmin?.email ?? '',
        log.actorAdmin?.username ?? '',
        log.actorAdminId ?? '',
        meta,
      ].join(' ').toLowerCase()
      return haystack.includes(term)
    })
  }, [logs, search])

  const summary = useMemo(() => summarize(visibleLogs), [visibleLogs])

  const refresh = async () => {
    await load()
  }

  const resetFilters = () => {
    setSearch('')
    setActionFilter('')
    setProviderFilter('')
    setActorFilter('')
    setDatePreset('all')
    setPageSize(25)
  }

  const actionOptions = useMemo(() => {
    const values = new Set<string>()
    logs.forEach((log) => values.add(log.action))
    return Array.from(values).sort()
  }, [logs])

  const actors = useMemo(() => {
    const map = new Map<string, string>()
    logs.forEach((log) => {
      const label = log.actorAdmin ? `${log.actorAdmin.email ?? log.actorAdmin.username ?? log.actorAdmin.id}` : 'System'
      const key = log.actorAdminId ?? 'system'
      if (!map.has(key)) map.set(key, label)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [logs])

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Provider Audit Logs</h4>
          <p className="text-muted mb-0 fs-13">Read-only audit viewer for communication provider lifecycle, tests, retries, and delivery safety events.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-secondary" size="sm" onClick={refresh} disabled={loading}>
            <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16 me-1' : 'fs-16 me-1'} />
            Refresh
          </Button>
          <Button variant="outline-primary" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {[
          { label: 'Total logs', value: totalCount, icon: 'solar:document-text-bold-duotone', tone: 'primary' },
          { label: 'Provider tests', value: summary.providerTests, icon: 'solar:test-tube-bold-duotone', tone: 'warning' },
          { label: 'Blocked / retried', value: summary.deliveryBlockedRetried, icon: 'solar:refresh-circle-bold-duotone', tone: 'info' },
          { label: 'Failed actions', value: summary.failedActions, icon: 'solar:danger-triangle-bold-duotone', tone: 'danger' },
        ].map((card) => (
          <Col lg={3} md={6} key={card.label}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted fs-12">{card.label}</div>
                  <div className="fs-3 fw-bold text-dark">{card.value}</div>
                </div>
                <div className={`avatar-md bg-soft-${card.tone} text-${card.tone} rounded-circle d-flex align-items-center justify-content-center`}>
                  <IconifyIcon icon={card.icon} className="fs-20" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {pageError ? (
        <ApiErrorState message={pageError.message} status={pageError.status} onRetry={load} />
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-end mb-3">
              <Col lg={4} md={6}>
                <Form.Label className="fw-semibold fs-13">Search</Form.Label>
                <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Action, provider, actor, metadata" />
              </Col>
              <Col lg={2} md={6}>
                <Form.Label className="fw-semibold fs-13">Action</Form.Label>
                <Form.Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                  <option value="">All actions</option>
                  {actionOptions.map((action) => (
                    <option key={action} value={action}>{actionLabel(action)}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={2} md={6}>
                <Form.Label className="fw-semibold fs-13">Provider</Form.Label>
                <Form.Select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
                  <option value="">All providers</option>
                  {providerOptions.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.name} ({provider.code})</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={2} md={6}>
                <Form.Label className="fw-semibold fs-13">Actor</Form.Label>
                <Form.Select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
                  <option value="">All actors</option>
                  {actors.map((actor) => (
                    <option key={actor.value} value={actor.value}>{actor.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={2} md={6}>
                <Form.Label className="fw-semibold fs-13">Date range</Form.Label>
                <Form.Select value={datePreset} onChange={(e) => setDatePreset(e.target.value as DatePreset)}>
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </Form.Select>
              </Col>
              <Col lg={2} md={6}>
                <Form.Label className="fw-semibold fs-13">Page size</Form.Label>
                <Form.Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </Form.Select>
              </Col>
            </Row>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button variant="outline-secondary" size="sm" onClick={refresh} disabled={loading}>Refresh</Button>
              <Button variant="outline-primary" size="sm" onClick={resetFilters}>Reset filters</Button>
            </div>

            {loading ? (
              <div className="py-5 text-center"><Spinner animation="border" variant="primary" /></div>
            ) : visibleLogs.length === 0 ? (
              <EmptyState message="No provider audit logs match the current filters." icon="solar:document-text-bold-duotone" />
            ) : (
              <>
                <Table responsive hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '18%' }}>Action</th>
                      <th style={{ width: '22%' }}>Provider</th>
                      <th style={{ width: '18%' }}>Actor</th>
                      <th>Metadata</th>
                      <th style={{ width: '15%' }}>Created</th>
                      <th className="text-end" style={{ width: '10%' }}>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLogs.map((log) => {
                      const tone = actionTone(log.action)
                      const provider = log.provider
                      const actor = log.actorAdmin
                      const metadata = redactMetadata(log.metadata ?? {})
                      return (
                        <tr key={log.id}>
                          <td>
                            <Badge bg={tone.bg} className={`text-${tone.text}`}>{actionLabel(log.action)}</Badge>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{provider?.name ?? 'Unknown provider'}</div>
                            <div className="text-muted fs-12">{provider?.code ?? log.providerId ?? '—'}</div>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{actor ? (actor.displayName ?? actor.username ?? actor.email ?? 'System') : 'System'}</div>
                            <div className="text-muted fs-12">{actor?.email ?? actor?.username ?? log.actorAdminId ?? 'System'}</div>
                          </td>
                          <td>
                            <div className="text-truncate text-muted fs-12" style={{ maxWidth: 420 }}>
                              {metadata ? JSON.stringify(metadata).slice(0, 180) : '—'}
                              {metadata ? '…' : ''}
                            </div>
                          </td>
                          <td className="text-secondary fs-13">{formatDateTime(log.createdAt)}</td>
                          <td className="text-end">
                            <Button size="sm" variant="outline-secondary" onClick={() => setSelectedLog(log)}>
                              View metadata
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
                <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3">
                  <div className="text-muted fs-13">
                    Showing {visibleLogs.length} of {totalCount} log entries
                  </div>
                  <Button variant="outline-primary" size="sm" disabled={!hasNextPage || loadingMore} onClick={() => void load(true)}>
                    {loadingMore ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                    Load more
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={Boolean(selectedLog)} onHide={() => setSelectedLog(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Metadata</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap gap-2">
                <Badge bg={actionTone(selectedLog.action).bg} className={`text-${actionTone(selectedLog.action).text}`}>{actionLabel(selectedLog.action)}</Badge>
                <Badge bg="soft-secondary" className="text-secondary">{selectedLog.provider?.name ?? selectedLog.providerId ?? 'Unknown provider'}</Badge>
              </div>
              <div><strong>Actor:</strong> {selectedLog.actorAdmin ? (selectedLog.actorAdmin.displayName ?? selectedLog.actorAdmin.username ?? selectedLog.actorAdmin.email ?? 'System') : 'System'}</div>
              <div><strong>Created:</strong> {formatDateTime(selectedLog.createdAt)}</div>
              <pre className="bg-light border rounded p-3 mb-0 fs-12" style={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(redactMetadata(selectedLog.metadata ?? {}), null, 2)}
              </pre>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
