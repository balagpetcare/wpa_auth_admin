'use client'

import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Spinner,
  Alert
} from 'react-bootstrap'
import { systemApi } from '@/features/system/api'
import { SystemSettings } from '@/features/system/types'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { ErrorState } from '@/components/dashboard/DashboardComponents'

export default function EnvironmentPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await systemApi.getSettings()
      if (response.success && response.settings) {
        setSettings(response.settings)
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err)
      setError(err?.message || 'Access Denied: Missing permissions to query environment variables.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const isProduction = settings?.environment?.toLowerCase() === 'production'
  const usesLocalhost = 
    settings?.publicAuthDomain?.includes('localhost') || 
    settings?.issuerUrl?.includes('localhost') ||
    settings?.apiBaseUrl?.includes('localhost')

  return (
    <div className="container-fluid py-4">
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Environment Profile</h4>
          <p className="text-muted mb-0 fs-13">Inspect server host parameters, environment flags, and connection variables safely.</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadData} />}

      {/* LOCALHOST IN PRODUCTION WARNING */}
      {settings && isProduction && usesLocalhost && (
        <Alert variant="danger" className="d-flex align-items-start gap-3 mb-4 shadow-sm" style={{ borderLeftWidth: '5px' }}>
          <div className="bg-soft-danger p-2 rounded">
            <IconifyIcon icon="solar:danger-triangle-bold" className="text-danger fs-28" />
          </div>
          <div>
            <h5 className="alert-heading fw-bold fs-16 mb-1 text-danger-emphasis">Unsafe Production Configuration</h5>
            <p className="fs-13 text-danger-emphasis mb-0">
              The environment is flagged as <strong>production</strong>, but public authority domain endpoints point to <strong>localhost</strong>. 
              Client logins, callback redirects, and service validation will fail outside of local machine contexts.
            </p>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : settings ? (
        <Card className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
          <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
            <h5 className="fw-bold text-dark mb-0">System Variables Profile</h5>
          </Card.Header>
          <Card.Body className="p-4 mt-2">
            <div className="d-flex flex-column gap-3 font-monospace fs-13">
              <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                <div>
                  <strong className="text-dark d-block">NODE_ENV</strong>
                  <span className="text-muted fs-11 font-sans">Active operational run profile.</span>
                </div>
                <strong className="text-primary">{settings.environment?.toUpperCase() || 'DEVELOPMENT'}</strong>
              </div>

              <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                <div>
                  <strong className="text-dark d-block">PUBLIC_AUTH_DOMAIN</strong>
                  <span className="text-muted fs-11 font-sans">Base url endpoint for authorization flows.</span>
                </div>
                <strong className="text-dark text-break">{settings.publicAuthDomain}</strong>
              </div>

              <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                <div>
                  <strong className="text-dark d-block">ADMIN_PANEL_URL</strong>
                  <span className="text-muted fs-11 font-sans">Origin endpoint of this administrative dashboard.</span>
                </div>
                <strong className="text-dark text-break">{settings.adminPanelUrl}</strong>
              </div>

              <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                <div>
                  <strong className="text-dark d-block">ISSUER_URL</strong>
                  <span className="text-muted fs-11 font-sans">Public security authority issuer URL.</span>
                </div>
                <strong className="text-dark text-break">{settings.issuerUrl}</strong>
              </div>

              <div className="p-3 bg-light rounded d-flex justify-content-between align-items-center">
                <div>
                  <strong className="text-dark d-block">API_BASE_URL</strong>
                  <span className="text-muted fs-11 font-sans">Express REST routing endpoint.</span>
                </div>
                <strong className="text-dark text-break">{settings.apiBaseUrl}</strong>
              </div>
            </div>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  )
}
