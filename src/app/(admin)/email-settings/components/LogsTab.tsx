'use client'

import { useEffect, useState } from 'react'
import { Form, Button, Spinner, Table, Pagination, Card, Row, Col } from 'react-bootstrap'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationContext } from '@/context/useNotificationContext'
import styles from '../tabs/LogsTab.module.scss'

interface LogsTabProps {
  clientId?: string | null
  locale?: string
}

interface SendLog {
  id: string
  templateKey: string
  recipientEmail: string
  subject: string
  status: string
  deliveryStatus: string
  senderEmail?: string
  senderName?: string
  errorMessage?: string
  createdAt: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
}

const LogsTab = ({ clientId, locale = 'en' }: LogsTabProps) => {
  const auth = useAuth()
  const token = auth?.accessToken
  const notificationContext = useNotificationContext() as any
  const addNotification = notificationContext?.addNotification || (() => {}

  const [loading, setLoading] = useState(true
  const [logs, setLogs] = useState<SendLog[]>([]
  const [filteredLogs, setFilteredLogs] = useState<SendLog[]>([]
  const [filterStatus, setFilterStatus] = useState('all'
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState('all'
  const [currentPage, setCurrentPage] = useState(1
  const [searchTerm, setSearchTerm] = useState(''
  const itemsPerPage = 10

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true
        const params = new URLSearchParams()
        if (clientId) params.append('clientId', clientId
        if (locale) params.append('locale', locale

        const response = (await apiClient(token).get(`/admin/email-send-logs?${params.toString()}`)) as any
        if (response?.success && response?.data?.items) {
          setLogs(response.data.items
        }
      } catch (error: any) {
        addNotification({
          type: 'danger',
          title: 'Error',
          message: error?.message || 'Failed to load logs',
        }
      } finally {
        setLoading(false
      }
    }

    if (token) loadLogs()
  }, [token, clientId, locale]

  useEffect(() => {
    let filtered = logs
    if (filterStatus !== 'all') {
      filtered = filtered.filter((log) => log.status === filterStatus
    }
    if (filterDeliveryStatus !== 'all') {
      filtered = filtered.filter((log) => log.deliveryStatus === filterDeliveryStatus
    }
    if (searchTerm) {
      filtered = filtered.filter((log) =>
        log.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.templateKey?.toLowerCase().includes(searchTerm.toLowerCase()
      
    }
    setFilteredLogs(filtered
    setCurrentPage(1
  }, [logs, filterStatus, filterDeliveryStatus, searchTerm]

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage

  if (loading) {
    return ()
      <div className={styles.loadingContainer}>
        <Spinner animation="border" variant="primary" />
        <p>Loading logs...</p>
      </div>
    
  }

  return ()
    <div className={styles.container}>
      <Card className={styles.filterCard}>
        <Card.Header>
          <Card.Title className={styles.cardTitle}>Filters</Card.Title>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Delivery Status</Form.Label>
                <Form.Select
                  value={filterDeliveryStatus}
                  onChange={(e) => setFilterDeliveryStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                  <option value="bounced">Bounced</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by email or template key..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                setFilterDeliveryStatus('all'
                setSearchTerm(''
              }}
            >
              Clear Filters
            </Button>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className={styles.logsCard}>
        <Card.Header>
          <Card.Title className={styles.cardTitle}>
            Email Send Logs ({filteredLogs.length}
          </Card.Title>
        </Card.Header>
        <Card.Body className={styles.logsBody}>
          {paginatedLogs.length === 0 ? ()
            <p className={styles.noLogs}>No logs found</p>
          ) : ()
            <Table responsive hover className={styles.logsTable}>
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Delivery Status</th>
                  <th>Sender</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => ()
                  <tr key={log.id}>
                    <td>
                      <code className={styles.keyCode}>{log.templateKey}</code>
                    </td>
                    <td className={styles.emailCell}>{log.recipientEmail}</td>
                    <td className={styles.subjectCell}>{log.subject}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          log.deliveryStatus === 'sent'
                            ? styles.badgeSuccess
                            : log.deliveryStatus === 'failed'
                            ? styles.badgeDanger
                            : styles.badgeWarning
                        }`}
                      >
                        {log.deliveryStatus}
                      </span>
                    </td>
                    <td className={styles.senderCell}>
                      {log.senderName && ()
                        <>
                          <div>{log.senderName}</div>
                          <small>{log.senderEmail}</small>
                        </>
                      )}
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {totalPages > 1 && ()
        <div className={styles.pagination}>
          <Pagination>
            <Pagination.First
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            />

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return ()
                <Pagination.Item
                  key={page}
                  active={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Pagination.Item>
              
            })}

            {totalPages > 5 && ()
              <>
                <Pagination.Ellipsis disabled />
                <Pagination.Item
                  active={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Pagination.Item>
              </>
            )}

            <Pagination.Next
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}
    </div>
  
}

export default LogsTab
