'use client'

import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
import { emailApi, type EmailLog } from './emailSettingsApi'

interface LogsTabProps {
  clientId: string | null
  locale: 'en' | 'bn'
}

export default function LogsTab({ clientId, locale }: LogsTabProps) {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [filters, setFilters] = useState({ templateKey: '', status: '', date: '' })
  const [retryMessage, setRetryMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await emailApi.logs(clientId, locale, filters.templateKey || undefined, filters.status || undefined, filters.date || undefined)
        setLogs(response.data?.logs || response.data?.items || [])
        setAvailable(response.available)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId, locale, filters])

  const retryFailed = async (log: EmailLog) => {
    setRetryMessage(null)
    const response = await emailApi.retryLog({ logId: log.id, clientId: clientId || 'global', locale })
    setRetryMessage(response.available ? 'Retry request submitted.' : 'Retry endpoint is unavailable.')
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardBody className="p-4">
        <Row className="g-3 mb-4">
          <Col md={3}><Form.Control placeholder="Template key" value={filters.templateKey} onChange={(e) => setFilters((current) => ({ ...current, templateKey: e.target.value }))} /></Col>
          <Col md={3}>
            <Form.Select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
            </Form.Select>
          </Col>
          <Col md={3}><Form.Control type="date" value={filters.date} onChange={(e) => setFilters((current) => ({ ...current, date: e.target.value }))} /></Col>
          <Col md={3}><Button variant="light" className="w-100" onClick={() => setFilters({ templateKey: '', status: '', date: '' })}>Clear filters</Button></Col>
        </Row>

        {retryMessage && <Alert variant="info">{retryMessage}</Alert>}
        {loading ? (
          <div className="py-5 text-center text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading logs...</div>
        ) : !available ? (
          <Alert variant="warning">Email logs endpoint is unavailable.</Alert>
        ) : logs.length === 0 ? (
          <div className="alert alert-soft-secondary mb-0">No email delivery logs were returned.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-centered table-hover mb-0">
              <thead className="bg-light bg-opacity-50">
                <tr>
                  <th>Status</th>
                  <th>Client</th>
                  <th>Locale</th>
                  <th>Template</th>
                  <th>Recipient</th>
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td><Badge bg={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'danger' : 'warning'}>{log.status || 'unknown'}</Badge></td>
                    <td>{log.clientName || 'Global default'}</td>
                    <td>{log.locale || locale}</td>
                    <td>{log.templateKey || 'Unavailable'}</td>
                    <td>{log.recipient || 'Unavailable'}</td>
                    <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unavailable'}</td>
                    <td className="text-end">
                      {log.status === 'failed' ? (
                        <Button size="sm" variant="light" onClick={() => retryFailed(log)}>Retry</Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
