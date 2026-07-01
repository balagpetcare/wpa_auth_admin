'use client'

import { useEffect, useState } from 'react'
import { Nav, Row, Col, Card, Form, Spinner } from 'react-bootstrap'
import styles from './EmailSettings.module.scss'
import BrandingTab from './components/BrandingTab'
import TemplatesTab from './components/TemplatesTab'
import PreviewTab from './components/PreviewTab'
import SendTestTab from './components/SendTestTab'
import LogsTab from './components/LogsTab'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'

type TabType = 'branding' | 'templates' | 'preview' | 'send-test' | 'logs'

interface Client {
  id: string
  clientId: string
  name: string
  slug: string
}

const EmailSettingsPage = () => {
  const auth = useAuth()
  const token = auth?.accessToken

  const [activeTab, setActiveTab] = useState<TabType>('branding'
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedLocale, setSelectedLocale] = useState<string>('en'
  const [clients, setClients] = useState<Client[]>([]
  const [loadingClients, setLoadingClients] = useState(true

  // Load available clients
  useEffect(() => {
    const loadClients = async () => {
      if (!token) return
      try {
        setLoadingClients(true
        const response = (await apiClient(token).get('/admin/clients')) as any
        if (response?.success && response?.data?.items) {
          setClients(response.data.items
        }
      } catch (error) {
        console.error('Failed to load clients:', error
      } finally {
        setLoadingClients(false
      }
    }

    loadClients()
  }, [token]

  return ()
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <h1>Email Settings</h1>
        <p>Manage email branding, templates, and delivery</p>
      </div>

      {/* Client & Locale Selector */}
      <Card className={styles.card} style={{ marginBottom: '20px' }}>
        <Card.Body>
          <Row className="align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label><strong>Select Client/App</strong></Form.Label>
                {loadingClients ? ()
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Spinner animation="border" size="sm" />
                    <span>Loading clients...</span>
                  </div>
                ) : ()
                  <Form.Select
                    value={selectedClientId || ''}
                    onChange={(e) => setSelectedClientId(e.target.value || null)}
                  >
                    <option value="">Global Default (WPA)</option>
                    {clients.map((client) => ()
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.slug}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label><strong>Template Locale</strong></Form.Label>
                <Form.Select
                  value={selectedLocale}
                  onChange={(e) => setSelectedLocale(e.target.value)}
                >
                  <option value="en">English (en)</option>
                  <option value="bn">Bengali / বাংলা (bn)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Card className={styles.card}>
        <div className={styles.tabsWrapper}>
          <Nav variant="tabs" className={styles.tabs} activeKey={activeTab} onSelect={(k) => setActiveTab(k as TabType)}>
            <Nav.Item>
              <Nav.Link eventKey="branding" className={styles.tabLink}>
                <span className={styles.tabIcon}>🎨</span>
                Branding
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="templates" className={styles.tabLink}>
                <span className={styles.tabIcon}>📧</span>
                Templates
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="preview" className={styles.tabLink}>
                <span className={styles.tabIcon}>👁️</span>
                Preview
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="send-test" className={styles.tabLink}>
                <span className={styles.tabIcon}>✉️</span>
                Send Test
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="logs" className={styles.tabLink}>
                <span className={styles.tabIcon}>📋</span>
                Logs
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'branding' && <BrandingTab clientId={selectedClientId} />}
          {activeTab === 'templates' && <TemplatesTab clientId={selectedClientId} locale={selectedLocale} />}
          {activeTab === 'preview' && <PreviewTab clientId={selectedClientId} locale={selectedLocale} />}
          {activeTab === 'send-test' && <SendTestTab clientId={selectedClientId} locale={selectedLocale} />}
          {activeTab === 'logs' && <LogsTab clientId={selectedClientId} locale={selectedLocale} />}
        </div>
      </Card>
    </div>
  
}

export default EmailSettingsPage
