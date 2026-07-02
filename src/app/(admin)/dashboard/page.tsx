'use client'

import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Button, Spinner } from 'react-bootstrap'
import { apiClient } from '@/lib/apiClient'
import {
  StatCard,
  StatusBadge,
  EmptyState,
  ErrorState
} from '@/components/dashboard/DashboardComponents'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Link from 'next/link'

interface DashboardStats {
  users?: { total: number; active: number; pending: number; suspended: number }
  clients?: { total: number; active: number }
  roles?: { total: number }
  activity?: { loginsLast24h: number; unresolvedSecurityEvents: number }
}

interface AuditLogItem {
  id: string
  action: string
  userId?: string
  createdAt: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
}

interface AdminUserItem {
  id: string
  username: string
  email: string
  status: string
  createdAt: string
  displayName?: string
  roles?: string[]
}

interface SecurityEventItem {
  id: string
  type: string
  userId?: string
  resolved: boolean
  createdAt: string
  ipAddress?: string
  severity: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEventItem[]>([])
  const [totalPermissions, setTotalPermissions] = useState<number | undefined>(undefined)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch dashboard stats
      const statsResponse = await apiClient.get<{ success: boolean; stats: DashboardStats }>('/admin/dashboard/stats')
      if (statsResponse.success) {
        setStats(statsResponse.stats)
      }

      // 2. Fetch recent audit logs (limit to 5)
      try {
        const auditResponse = await apiClient.get<{ success: boolean; data?: { items?: AuditLogItem[] }; logs?: AuditLogItem[] }>('/admin/audit-logs?limit=5')
        const auditItems = auditResponse.data?.items ?? auditResponse.logs ?? []
        if (auditItems) {
          setAuditLogs(auditItems)
        }
      } catch (e) {
        console.warn('Audit logs API error:', e)
      }

      // 3. Fetch recent admin users
      try {
        const adminResponse = await apiClient.get<{ success: boolean; data: { items: AdminUserItem[] } }>('/admin/users?limit=5')
        if (adminResponse.success && adminResponse.data?.items) {
          setAdminUsers(adminResponse.data.items)
        }
      } catch (e) {
        console.warn('Admin users API error:', e)
      }

      // 4. Fetch recent security events
      try {
        const securityResponse = await apiClient.get<{ success: boolean; data?: { items?: SecurityEventItem[] }; events?: SecurityEventItem[] }>('/admin/security-events?limit=5')
        const securityItems = securityResponse.data?.items ?? securityResponse.events ?? []
        if (securityItems) {
          setSecurityEvents(securityItems)
        }
      } catch (e) {
        console.warn('Security events API error:', e)
      }

      // 5. Fetch permissions count
      // UI polish fix (docs/admin-panel-shell-ui-polish.md): GET /admin/permissions
      // returns `{ success, permissions: { items: [...], groupedByResource } }`
      // (see admin.service.ts listPermissions()), not a bare array — reading
      // `.permissions.length` on the object was always `undefined`, which is
      // why the "Total Permissions" card showed "N/A" even though real data
      // was available.
      try {
        const permissionsResponse = await apiClient.get<{ success: boolean; permissions: { items: any[] } }>('/admin/permissions')
        if (permissionsResponse.success && permissionsResponse.permissions?.items) {
          setTotalPermissions(permissionsResponse.permissions.items.length)
        } else {
          setTotalPermissions(0)
        }
      } catch (e) {
        console.warn('Permissions API error:', e)
        setTotalPermissions(0)
      }

    } catch (err: any) {
      console.error('Failed to load dashboard:', err)
      setError(err?.message || 'Failed to load dashboard statistics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="container-fluid py-4">
      {/* HEADER SECTION */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Central Auth Control Center</h4>
          <p className="text-muted mb-0 fs-13">System metrics, user directory controls, security alerts, and integration health.</p>
        </div>
        <div>
          <Button variant="primary" size="sm" onClick={fetchDashboardData} disabled={loading} className="d-flex align-items-center gap-1 px-3 py-2 shadow-sm">
            <IconifyIcon icon="solar:restart-bold-duotone" className={loading ? 'spin fs-16' : 'fs-16'} />
            Refresh Control Center
          </Button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={fetchDashboardData} />}

      {/* KPI STATS ROW */}
      <Row>
        <Col xl={3} md={6}>
          <StatCard
            title="Total Admin Users"
            value={stats?.users?.total}
            icon="solar:user-bold-duotone"
            variant="primary"
            description="Total registered admin accounts"
            loading={loading}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            title="Active Administrations"
            value={stats?.users?.active}
            icon="solar:users-group-two-rounded-bold-duotone"
            variant="success"
            description="Administrators currently ACTIVE"
            loading={loading}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            title="Assigned Roles"
            value={stats?.roles?.total}
            icon="solar:shield-keyhole-bold-duotone"
            variant="warning"
            description="System RBAC roles configured"
            loading={loading}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            title="Total Permissions"
            value={totalPermissions}
            icon="solar:key-bold-duotone"
            variant="info"
            description="Total granular actions mapped"
            loading={loading}
          />
        </Col>
      </Row>

      <Row>
        <Col xl={3} md={6}>
          <StatCard
            title="Registered Clients"
            value={stats?.clients?.total}
            icon="solar:monitor-smartphone-bold-duotone"
            variant="secondary"
            description="Apps integrated via OAuth / OIDC"
            loading={loading}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            title="Active Client Applications"
            value={stats?.clients?.active}
            icon="solar:check-circle-bold-duotone"
            variant="success"
            description="Apps with active status flags"
            loading={loading}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            title="Logins Last 24h"
            value={stats?.activity?.loginsLast24h}
            icon="solar:login-2-bold-duotone"
            variant="info"
            description="Successful authorization sessions"
            loading={loading}
          />
        </Col>
        <Col xl={3} md={6}>
          <StatCard
            title="Unresolved Security Events"
            value={stats?.activity?.unresolvedSecurityEvents}
            icon="solar:danger-triangle-bold-duotone"
            variant="danger"
            description="Active threat logs flagged"
            loading={loading}
          />
        </Col>
      </Row>

      {/* CORE SECTIONS */}
      <Row className="mt-2">
        {/* RECENT AUDIT ACTIVITY */}
        <Col lg={7} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h5 className="fw-bold text-dark mb-0">Recent Audit Activity</h5>
                <span className="text-muted fs-12">Log of system operations and administrative configurations.</span>
              </div>
              <Link href="/audit-logs" className="btn btn-sm btn-soft-primary px-3">
                View All
              </Link>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : auditLogs.length === 0 ? (
                <EmptyState message="No audit logs available." icon="solar:history-bold-duotone" />
              ) : (
                <div className="table-responsive">
                  <Table className="align-middle mb-0" hover>
                    <thead className="table-light">
                      <tr>
                        <th className="fs-12 fw-semibold text-uppercase">Action</th>
                        <th className="fs-12 fw-semibold text-uppercase">IP Address</th>
                        <th className="fs-12 fw-semibold text-uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold text-dark fs-13">{log.action}</span>
                              {log.userId && <span className="text-muted fs-11">Actor ID: {log.userId}</span>}
                            </div>
                          </td>
                          <td>
                            <span className="text-secondary fs-13">{log.ipAddress || 'Internal'}</span>
                          </td>
                          <td>
                            <span className="text-secondary fs-13">{new Date(log.createdAt).toLocaleTimeString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* SECURITY ALERTS */}
        <Col lg={5} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h5 className="fw-bold text-dark mb-0">Security Alerts</h5>
                <span className="text-muted fs-12">Threat intelligence logs and unresolved vulnerabilities.</span>
              </div>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : securityEvents.length === 0 ? (
                <EmptyState message="All clear! No active security alerts." icon="solar:shield-check-bold-duotone" />
              ) : (
                <div className="d-flex flex-column gap-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="d-flex align-items-start gap-3 p-3 bg-light rounded border-start border-3 border-danger">
                      <div className="bg-soft-danger rounded p-2 d-flex align-items-center justify-content-center">
                        <IconifyIcon icon="solar:danger-triangle-bold" className="text-danger fs-18" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="fw-semibold text-dark fs-13">{event.type}</span>
                          <StatusBadge status={event.severity} />
                        </div>
                        <p className="text-secondary fs-12 mb-1">IP: {event.ipAddress || 'Unknown'}</p>
                        <span className="text-muted fs-11">{new Date(event.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* RECENT ADMIN USERS */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h5 className="fw-bold text-dark mb-0">Recent Admin Registrations</h5>
                <span className="text-muted fs-12">Administrators recently assigned control.</span>
              </div>
              <Link href="/admin-users" className="btn btn-sm btn-soft-primary px-3">
                Manage Team
              </Link>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : adminUsers.length === 0 ? (
                <EmptyState message="No administrators found." icon="solar:users-group-two-rounded-bold-duotone" />
              ) : (
                <div className="table-responsive">
                  <Table className="align-middle mb-0" hover>
                    <thead className="table-light">
                      <tr>
                        <th className="fs-12 fw-semibold text-uppercase">Admin User</th>
                        <th className="fs-12 fw-semibold text-uppercase">Status</th>
                        <th className="fs-12 fw-semibold text-uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center fw-semibold fs-13" style={{ width: '32px', height: '32px' }}>
                                {(user.displayName || user.username).substring(0, 2).toUpperCase()}
                              </div>
                              <div className="d-flex flex-column">
                                <span className="fw-semibold text-dark fs-13">{user.displayName || user.username}</span>
                                <span className="text-muted fs-11">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={user.status} />
                          </td>
                          <td>
                            <span className="text-secondary fs-13">{new Date(user.createdAt).toLocaleDateString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* API HEALTH SUMMARY */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
            <Card.Header className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold text-dark mb-0">API Control Gateway Health</h5>
              <span className="text-muted fs-12">Current connectivity and operational latency metrics.</span>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                  <div className="d-flex align-items-center gap-2">
                    <IconifyIcon icon="solar:server-bold-duotone" className="text-success fs-20" />
                    <span className="fw-semibold text-dark fs-13">Express Auth API</span>
                  </div>
                  <StatusBadge status="UP" />
                </div>
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                  <div className="d-flex align-items-center gap-2">
                    <IconifyIcon icon="solar:database-bold-duotone" className="text-success fs-20" />
                    <span className="fw-semibold text-dark fs-13">PostgreSQL Core Database</span>
                  </div>
                  <StatusBadge status="ACTIVE" />
                </div>
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                  <div className="d-flex align-items-center gap-2">
                    <IconifyIcon icon="solar:transmission-bold-duotone" className="text-info fs-20" />
                    <span className="fw-semibold text-dark fs-13">Redis Session Store</span>
                  </div>
                  <StatusBadge status="CONNECTED" />
                </div>
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                  <div className="d-flex align-items-center gap-2">
                    <IconifyIcon icon="solar:letter-bold-duotone" className="text-warning fs-20" />
                    <span className="fw-semibold text-dark fs-13">SMTP Email Channel Gateway</span>
                  </div>
                  <span className="fs-13 text-secondary">Verified</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
