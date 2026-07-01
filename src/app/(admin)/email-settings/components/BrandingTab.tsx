'use client'

import { useEffect, useState } from 'react'
import { Form, Button, Spinner, Alert, Card, Row, Col, Badge } from 'react-bootstrap'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationContext } from '@/context/useNotificationContext'
import styles from '../tabs/BrandingTab.module.scss'

interface BrandingTabProps {
  clientId?: string | null
}

interface BrandingData {
  organizationName: string
  brandColor: string
  accentColor: string
  logoUrl: string
  logoAltText: string
  faviconUrl: string
  supportEmail: string
  supportPhone?: string
  supportUrl?: string
  contactEmail?: string
  contactPhone?: string
  contactUrl?: string
  websiteUrl?: string
  helpUrl?: string
  privacyUrl?: string
  termsUrl?: string
  securityUrl?: string
  statusPageUrl?: string
  linkedinUrl?: string
  twitterUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  youtubeUrl?: string
  footerText?: string
  legalDisclaimer?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

const BrandingTab = ({ clientId }: BrandingTabProps) => {
  const auth = useAuth()
  const token = auth?.accessToken
  const notificationContext = useNotificationContext() as any
  const addNotification = notificationContext?.addNotification || (() => {}

  const [loading, setLoading] = useState(true
  const [saving, setSaving] = useState(false
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<BrandingData>>({}
  const [globalBranding, setGlobalBranding] = useState<Partial<BrandingData>>({}

  useEffect(() => {
    const loadBranding = async () => {
      try {
        setLoading(true
        // Load global branding first (for fallback indicators
        const globalResponse = (await apiClient(token).get('/admin/email-branding')) as any
        if (globalResponse?.success && globalResponse?.data) {
          setGlobalBranding(globalResponse.data
        }

        // Load client-specific or global branding
        const endpoint = clientId
          ? `/admin/clients/${clientId}/branding`
          : '/admin/email-branding'

        const response = (await apiClient(token).get(endpoint)) as any
        if (response?.success && response?.data) {
          setFormData(response.data
          if (response.data.logoUrl) {
            setLogoPreview(response.data.logoUrl
          }
        }
      } catch (error: any) {
        addNotification({
          type: 'danger',
          title: 'Error',
          message: error?.message || 'Failed to load branding settings',
        }
      } finally {
        setLoading(false
      }
    }

    if (token) loadBranding()
  }, [token, clientId]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setLogoPreview(result
        setFormData((prev) => ({
          ...prev,
          logoUrl: result,
        }
      }
      reader.readAsDataURL(file
    }
  }

  const handleSaveBranding = async () => {
    if (!token) return

    try {
      setSaving(true
      const endpoint = clientId
        ? `/admin/clients/${clientId}/branding`
        : '/admin/email-branding'

      const response = (await apiClient(token).patch(endpoint, formData)) as any
      if (response?.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Branding settings updated successfully',
        }
      }
    } catch (error: any) {
      addNotification({
        type: 'danger',
        title: 'Error',
        message: error?.message || 'Failed to save branding settings',
      }
    } finally {
      setSaving(false
    }
  }

  const getFallbackBadge = (value: any, globalValue: any) => {
    if (!clientId) return null // Don't show fallback badge for global
    if (!value && globalValue) {
      return <Badge bg="info" style={{ marginLeft: '8px' }}>Uses global default</Badge>
    }
    return null
  }

  if (loading) {
    return ()
      <div className={styles.loadingContainer}>
        <Spinner animation="border" variant="primary" />
        <p>Loading branding settings...</p>
      </div>
    
  }

  return ()
    <div className={styles.container}>
      {clientId && ()
        <Alert variant="info" style={{ marginBottom: '20px' }}>
          📝 <strong>Editing client-specific branding.</strong> Fields left empty will fall back to the global default settings.
        </Alert>
      )}
      <Form>
        {/* Logo & Images */}
        <Card className={styles.section}>
          <Card.Header>
            <Card.Title className={styles.sectionTitle}>🖼️ Logo & Images</Card.Title>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Organization Logo</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={handleLogoChange} disabled={saving} />
                  <Form.Text className="text-muted">PNG or JPG, max 2MB</Form.Text>
                </Form.Group>
                {logoPreview && ()
                  <div className={styles.logoPreview}>
                    <img src={logoPreview} alt="Logo preview" />
                  </div>
                )}
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Logo Alt Text</Form.Label>
                  <Form.Control
                    type="text"
                    name="logoAltText"
                    value={formData.logoAltText || ''}
                    onChange={handleInputChange}
                    placeholder="Company logo"
                    disabled={saving}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Favicon URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="faviconUrl"
                    value={formData.faviconUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com/favicon.ico"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Branding Colors */}
        <Card className={styles.section}>
          <Card.Header>
            <Card.Title className={styles.sectionTitle}>🎨 Branding Colors</Card.Title>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Organization Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="organizationName"
                    value={formData.organizationName || ''}
                    onChange={handleInputChange}
                    placeholder="Your Company"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Primary Brand Color</Form.Label>
                  <Form.Control
                    type="color"
                    name="brandColor"
                    value={formData.brandColor || '#0f3a7d'}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Accent Color</Form.Label>
                  <Form.Control
                    type="color"
                    name="accentColor"
                    value={formData.accentColor || '#ff6c2f'}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Contact & Support */}
        <Card className={styles.section}>
          <Card.Header>
            <Card.Title className={styles.sectionTitle}>📞 Contact & Support</Card.Title>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Support Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="supportEmail"
                    value={formData.supportEmail || ''}
                    onChange={handleInputChange}
                    placeholder="support@example.com"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Support Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="supportPhone"
                    value={formData.supportPhone || ''}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail || ''}
                    onChange={handleInputChange}
                    placeholder="contact@example.com"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone || ''}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 987-6543"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Links */}
        <Card className={styles.section}>
          <Card.Header>
            <Card.Title className={styles.sectionTitle}>🔗 Links</Card.Title>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Website URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Help Center URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="helpUrl"
                    value={formData.helpUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://help.example.com"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Privacy Policy URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="privacyUrl"
                    value={formData.privacyUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com/privacy"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Terms of Service URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="termsUrl"
                    value={formData.termsUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com/terms"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Security Page URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="securityUrl"
                    value={formData.securityUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com/security"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status Page URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="statusPageUrl"
                    value={formData.statusPageUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://status.example.com"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Form URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="contactUrl"
                    value={formData.contactUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://example.com/contact"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Support URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="supportUrl"
                    value={formData.supportUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://support.example.com"
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Social Media */}
        <Card className={styles.section}>
          <Card.Header>
            <Card.Title className={styles.sectionTitle}>📱 Social Media</Card.Title>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>LinkedIn URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/company/..."
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Twitter URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="twitterUrl"
                    value={formData.twitterUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/..."
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Facebook URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="facebookUrl"
                    value={formData.facebookUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/..."
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Instagram URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="instagramUrl"
                    value={formData.instagramUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/..."
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
              <Col lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>YouTube URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="youtubeUrl"
                    value={formData.youtubeUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://youtube.com/..."
                    disabled={saving}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Footer & Legal */}
        <Card className={styles.section}>
          <Card.Header>
            <Card.Title className={styles.sectionTitle}>⚖️ Footer & Legal</Card.Title>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Footer Text</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="footerText"
                value={formData.footerText || ''}
                onChange={handleInputChange}
                placeholder="Footer text for all emails"
                disabled={saving}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Legal Disclaimer</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="legalDisclaimer"
                value={formData.legalDisclaimer || ''}
                onChange={handleInputChange}
                placeholder="Legal disclaimer text"
                disabled={saving}
              />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Save Button */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleSaveBranding}
            disabled={saving}
            size="lg"
          >
            {saving ? ()
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : ()
              '💾 Save Branding Settings'
            )}
          </Button>
        </div>
      </Form>
    </div>
  
}

export default BrandingTab
