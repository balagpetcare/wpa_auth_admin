'use client'

import { useEffect, useState } from 'react'
import { Form, Button, Spinner, Alert, Row, Col, Card } from 'react-bootstrap'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationContext } from '@/context/useNotificationContext'
import styles from '../tabs/PreviewTab.module.scss'

interface PreviewTabProps {
  clientId?: string | null
  locale?: string
}

interface Template {
  id: string
  key: string
  name: string
}

interface PreviewResult {
  subject: string
  preheader: string
  html: string
  text: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
}

const PreviewTab = ({ clientId, locale = 'en' }: PreviewTabProps) => {
  const auth = useAuth()
  const token = auth?.accessToken
  const notificationContext = useNotificationContext() as any
  const addNotification = notificationContext?.addNotification || (() => {}

  const [loading, setLoading] = useState(true
  const [templates, setTemplates] = useState<Template[]>([]
  const [selectedTemplate, setSelectedTemplate] = useState<string>(''
  const [variables, setVariables] = useState<string>('{}'
  const [previewing, setPreviewing] = useState(false
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop'

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

  const handlePreview = async () => {
    if (!selectedTemplate) {
      addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Please select a template',
      }
      return
    }

    try {
      setPreviewing(true
      let parsedVariables = {}
      try {
        parsedVariables = JSON.parse(variables
      } catch (e) {
        throw new Error('Invalid JSON in variables')
      }

      const params = new URLSearchParams()
      if (clientId) params.append('clientId', clientId
      if (locale) params.append('locale', locale

      const response = (await apiClient(token).post()
        `/admin/email-templates/${selectedTemplate}/preview?${params.toString()}`,
        { variables: parsedVariables }
      )) as any

      if (response?.success && response?.data?.rendered) {
        setPreview(response.data.rendered
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Preview loaded successfully',
        }
      }
    } catch (error: any) {
      addNotification({
        type: 'danger',
        title: 'Error',
        message: error?.message || 'Failed to preview template',
      }
    } finally {
      setPreviewing(false
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
        <Col lg={4}>
          <Card className={styles.configCard}>
            <Card.Header>
              <Card.Title className={styles.cardTitle}>Configuration</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Select Template</Form.Label>
                <Form.Select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
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
                <Form.Label>Variables (JSON)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={variables}
                  onChange={(e) => setVariables(e.target.value)}
                  className={styles.jsonInput}
                />
                <Form.Text className="text-muted">
                  Enter variables as JSON object
                </Form.Text>
              </Form.Group>

              <Button
                variant="primary"
                className="w-100"
                onClick={handlePreview}
                disabled={previewing || !selectedTemplate}
              >
                {previewing ? ()
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading...
                  </>
                ) : ()
                  '👁️ Generate Preview'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {!preview ? ()
            <Alert variant="info">Select a template and click "Generate Preview" to see the rendered output</Alert>
          ) : ()
            <>
              <div className={styles.viewToggle}>
                <Button
                  variant={viewMode === 'desktop' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('desktop')}
                >
                  💻 Desktop
                </Button>
                <Button
                  variant={viewMode === 'mobile' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('mobile')}
                >
                  📱 Mobile
                </Button>
              </div>

              <div className={`${styles.previewContainer} ${styles[viewMode]}`}>
                <div className={styles.previewFrame}>
                  <div className={styles.emailHeader}>
                    <p className={styles.subject}>{preview.subject}</p>
                    <p className={styles.preheader}>{preview.preheader}</p>
                  </div>
                  <div className={styles.emailContent}>
                    <iframe
                      srcDoc={preview.html}
                      className={styles.htmlFrame}
                      title="Email Preview"
                      sandbox=""
                    />
                  </div>
                </div>
              </div>

              <Card className={styles.textCard}>
                <Card.Header>
                  <Card.Title className={styles.cardTitle}>Plain Text Version</Card.Title>
                </Card.Header>
                <Card.Body className={styles.textBody}>
                  <pre>{preview.text}</pre>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </div>
  
}

export default PreviewTab
