'use client'

import { useEffect, useState } from 'react'
import { Form, Button, Spinner, Alert, Card, Row, Col } from 'react-bootstrap'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationContext } from '@/context/useNotificationContext'
import styles from '../tabs/SendTestTab.module.scss'

interface SendTestTabProps {
  clientId?: string | null
  locale?: string
}

interface Template {
  id: string
  key: string
  name: string
}

interface SendHistory {
  timestamp: string
  template: string
  email: string
  status: 'success' | 'failed'
  message?: string
  senderName?: string
  senderEmail?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

const SendTestTab = ({ clientId, locale = 'en' }: SendTestTabProps) => {
  const auth = useAuth()
  const token = auth?.accessToken
  const notificationContext = useNotificationContext() as any
  const addNotification = notificationContext?.addNotification || (() => {}

  const [loading, setLoading] = useState(true
  const [templates, setTemplates] = useState<Template[]>([]
  const [selectedTemplate, setSelectedTemplate] = useState<string>(''
  const [recipientEmail, setRecipientEmail] = useState(''
  const [variables, setVariables] = useState<string>('{}'
  const [sending, setSending] = useState(false
  const [sendHistory, setSendHistory] = useState<SendHistory[]>([]

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true
        const params = new URLSearchParams()
        if (clientId) params.append('clientId', clientId
        if (locale) params.append('locale', locale

        const response = (await apiClient(token).get(`/admin/email-templates?${params.toString()}`)) as any
        if (response?.success && response?.data?.items) {
          setTemplates(response.data.items
          if (response.data.items.length > 0) {
            setSelectedTemplate(response.data.items[0].id
          }
        }
      } catch (error: any) {
        addNotification({
          type: 'danger',
          title: 'Error',
          message: error?.message || 'Failed to load templates',
        }
      } finally {
        setLoading(false
      }
    }

    if (token) loadTemplates()
  }, [token, clientId, locale]

  const handleSendTest = async () => {
    if (!selectedTemplate) {
      addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Please select a template',
      }
      return
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Please enter a valid email address',
      }
      return
    }

    try {
      setSending(true
      let parsedVariables = {}
      try {
        parsedVariables = JSON.parse(variables
      } catch (e) {
        throw new Error('Invalid JSON in variables')
      }

      const template = templates.find((t) => t.id === selectedTemplate
      const params = new URLSearchParams()
      if (clientId) params.append('clientId', clientId
      if (locale) params.append('locale', locale

      const response = (await apiClient(token).post()
        `/admin/email-templates/${selectedTemplate}/send-test?${params.toString()}`,
        {
          recipientEmail,
          variables: parsedVariables,
        }
      )) as any

      if (response?.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Test email sent successfully',
        }

        setSendHistory((prev) => [
          {
            timestamp: new Date().toLocaleString(),
            template: template?.name || selectedTemplate,
            email: recipientEmail,
            status: 'success',
            message: 'Email sent',
            senderName: response?.data?.senderName,
            senderEmail: response?.data?.senderEmail,
          },
          ...prev,
        ]

        setRecipientEmail(''
        setVariables('{}'
      } else {
        throw new Error(response?.message || 'Failed to send test email')
      }
    } catch (error: any) {
      addNotification({
        type: 'danger',
        title: 'Error',
        message: error?.message || 'Failed to send test email',
      }

      const template = templates.find((t) => t.id === selectedTemplate
      setSendHistory((prev) => [
        {
          timestamp: new Date().toLocaleString(),
          template: template?.name || selectedTemplate,
          email: recipientEmail,
          status: 'failed',
          message: error?.message || 'Failed to send',
        },
        ...prev,
      ]
    } finally {
      setSending(false
    }
  }

  if (loading) {
    return ()
      <div className={styles.loadingContainer}>
        <Spinner animation="border" variant="primary" />
        <p>Loading templates...</p>
      </div>
    
  }

  return ()
    <div className={styles.container}>
      <Row>
        <Col lg={6}>
          <Card className={styles.formCard}>
            <Card.Header>
              <Card.Title className={styles.cardTitle}>Send Test Email</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Select Template</Form.Label>
                <Form.Select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  disabled={sending}
                >
                  <option value="">-- Choose a template --</option>
                  {templates.map((t) => ()
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Recipient Email</Form.Label>
                <Form.Control
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="test@example.com"
                  disabled={sending}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Variables (JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  className={styles.jsonInput}
                  disabled={sending}
                />
                <Form.Text className="text-muted">
                  Optional: variables to use in the template
                </Form.Text>
              </Form.Group>

              <Alert variant="info" style={{ marginTop: '15px' }}>
                <strong>ℹ️ Sender Info</strong>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  {clientId ? ()
                    <>Name: Client-Specific Sender</>
                  ) : ()
                    <>Name: Global Default Sender</>
                  )}
                  <br />
                  Email will be sent using the configured sender address for the selected client.
                </div>
              </Alert>

              <Button
                variant="primary"
                className="w-100"
                onClick={handleSendTest}
                disabled={sending || !selectedTemplate || !recipientEmail}
              >
                {sending ? ()
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Sending...
                  </>
                ) : ()
                  '📧 Send Test Email'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className={styles.historyCard}>
            <Card.Header>
              <Card.Title className={styles.cardTitle}>
                Recent Sends ({sendHistory.length}
              </Card.Title>
            </Card.Header>
            <Card.Body className={styles.historyBody}>
              {sendHistory.length === 0 ? ()
                <p className={styles.emptyMessage}>No test emails sent yet</p>
              ) : ()
                <div className={styles.historyList}>
                  {sendHistory.map((entry, index) => ()
                    <div key={index} className={styles.historyEntry}>
                      <div className={styles.entryHeader}>
                        <span className={styles.template}>{entry.template}</span>
                        <span
                          className={`${styles.badge} ${
                            entry.status === 'success'
                              ? styles.badgeSuccess
                              : styles.badgeFailure
                          }`}
                        >
                          {entry.status === 'success' ? '✓' : '✕'} {entry.status}
                        </span>
                      </div>
                      <p className={styles.email}>{entry.email}</p>
                      {entry.message && ()
                        <p className={styles.message}>{entry.message}</p>
                      )}
                      <p className={styles.timestamp}>{entry.timestamp}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  
}

export default SendTestTab
