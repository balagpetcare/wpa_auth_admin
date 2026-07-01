'use client'

import { useEffect, useState } from 'react'
import { Button, Table, Spinner, Alert, Modal, Form, Row, Col, Card, Badge } from 'react-bootstrap'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationContext } from '@/context/useNotificationContext'
import styles from '../tabs/TemplatesTab.module.scss'

interface TemplatesTabProps {
  clientId?: string | null
  locale?: string
}

interface Template {
  id: string
  key: string
  name: string
  subject: string
  preheader?: string
  isActive: boolean
  updatedAt: string
}

interface TemplateDetail extends Template {
  htmlBody: string
  textBody?: string
  variables?: {
    required?: string[]
    optional?: string[]
  }
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

const TemplatesTab = ({ clientId, locale = 'en' }: TemplatesTabProps) => {
  const auth = useAuth()
  const token = auth?.accessToken
  const notificationContext = useNotificationContext() as any
  const addNotification = notificationContext?.addNotification || (() => {}

  const [loading, setLoading] = useState(true
  const [templates, setTemplates] = useState<Template[]>([]
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null)
  const [showEditModal, setShowEditModal] = useState(false
  const [showResetModal, setShowResetModal] = useState(false
  const [resetting, setResetting] = useState(false
  const [saving, setSaving] = useState(false
  const [formData, setFormData] = useState<Partial<TemplateDetail>>({}

  // Load templates list
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

  const handleEditTemplate = async (templateId: string) => {
    try {
      const response = (await apiClient(token).get(`/admin/email-templates/${templateId}`)) as any
      if (response?.success && response?.data) {
        setSelectedTemplate(response.data
        setFormData(response.data
        setShowEditModal(true
      }
    } catch (error: any) {
      addNotification({
        type: 'danger',
        title: 'Error',
        message: error?.message || 'Failed to load template',
      }
    }
  }

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setSaving(true
      const response = (await apiClient(token).patch()
        `/admin/email-templates/${selectedTemplate.id}`,
        {
          name: formData.name,
          subject: formData.subject,
          preheader: formData.preheader,
          htmlBody: formData.htmlBody,
          textBody: formData.textBody,
        }
      )) as any
      if (response?.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Template updated successfully',
        }
        setShowEditModal(false
        // Reload templates
        const listResponse = (await apiClient(token).get('/admin/email-templates')) as any
        if (listResponse?.success && listResponse?.data?.items) {
          setTemplates(listResponse.data.items
        }
      }
    } catch (error: any) {
      addNotification({
        type: 'danger',
        title: 'Error',
        message: error?.message || 'Failed to save template',
      }
    } finally {
      setSaving(false
    }
  }

  const handleResetTemplate = async () => {
    if (!selectedTemplate) return

    try {
      setResetting(true
      const response = (await apiClient(token).post()
        `/admin/email-templates/${selectedTemplate.id}/reset-default`
      )) as any
      if (response?.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Template reset to default successfully',
        }
        setShowResetModal(false
        setShowEditModal(false
        // Reload templates
        const listResponse = (await apiClient(token).get('/admin/email-templates')) as any
        if (listResponse?.success && listResponse?.data?.items) {
          setTemplates(listResponse.data.items
        }
      }
    } catch (error: any) {
      addNotification({
        type: 'danger',
        title: 'Error',
        message: error?.message || 'Failed to reset template',
      }
    } finally {
      setResetting(false
    }
  }

  const handleInputChange = ()
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      <div className={styles.header}>
        <h5>Email Templates ({templates.length})</h5>
        <p className={styles.subtitle}>
          Click on a template to edit subject, body, and content
        </p>
      </div>

      {templates.length === 0 ? ()
        <Alert variant="info">No templates found. Templates are created during setup.</Alert>
      ) : ()
        <Table hover responsive className={styles.table}>
          <thead>
            <tr>
              <th>Template Name</th>
              <th>Key</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => ()
              <tr key={template.id}>
                <td className={styles.nameCell}>
                  <strong>{template.name}</strong>
                </td>
                <td>
                  <code className={styles.keyCode}>{template.key}</code>
                </td>
                <td className={styles.subjectCell}>{template.subject}</td>
                <td>
                  {template.isActive ? ()
                    <span className={styles.badgeActive}>Active</span>
                  ) : ()
                    <span className={styles.badgeInactive}>Inactive</span>
                  )}
                </td>
                <td className={styles.dateCell}>
                  {new Date(template.updatedAt).toLocaleDateString()}
                </td>
                <td className={styles.actionsCell}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleEditTemplate(template.id)}
                    className={styles.editBtn}
                  >
                    ✏️ Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Edit Template: {selectedTemplate?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles.modalBody}>
          <Row>
            <Col lg={8}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Template Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Subject Line</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={formData.subject || ''}
                    onChange={handleInputChange}
                    placeholder="Email subject line"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Preheader Text</Form.Label>
                  <Form.Control
                    type="text"
                    name="preheader"
                    value={formData.preheader || ''}
                    onChange={handleInputChange}
                    placeholder="Email preview text"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>HTML Body</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    name="htmlBody"
                    value={formData.htmlBody || ''}
                    onChange={handleInputChange}
                    className={styles.codeEditor}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Text Body (Fallback)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="textBody"
                    value={formData.textBody || ''}
                    onChange={handleInputChange}
                    className={styles.codeEditor}
                  />
                </Form.Group>
              </Form>
            </Col>

            <Col lg={4}>
              <Card className={styles.variablesPanel}>
                <Card.Header>
                  <Card.Title className={styles.panelTitle}>Available Variables</Card.Title>
                </Card.Header>
                <Card.Body>
                  {selectedTemplate?.variables?.required && ()
                    <div className={styles.variablesGroup}>
                      <h6 className={styles.groupTitle}>Required</h6>
                      {selectedTemplate.variables.required.map((v) => ()
                        <code key={v} className={styles.variable}>
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                  )}

                  {selectedTemplate?.variables?.optional && ()
                    <div className={styles.variablesGroup}>
                      <h6 className={styles.groupTitle}>Optional</h6>
                      {selectedTemplate.variables.optional.map((v) => ()
                        <code key={v} className={styles.variable}>
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="danger"
            onClick={() => setShowResetModal(true)}
            disabled={saving || resetting}
          >
            ↺ Reset to Default
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveTemplate}
            disabled={saving}
          >
            {saving ? ()
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : ()
              '💾 Save Template'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Template to Default?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>⚠️ This cannot be undone!</strong>
            <p className="mb-0">
              All changes to <strong>{selectedTemplate?.name}</strong> will be lost and replaced
              with the default template content.
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowResetModal(false)}
            disabled={resetting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleResetTemplate}
            disabled={resetting}
          >
            {resetting ? ()
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Resetting...
              </>
            ) : ()
              '↺ Reset to Default'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  
}

export default TemplatesTab
