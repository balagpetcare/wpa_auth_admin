'use client'

import DashboardHeader from './components/DashboardHeader'
import DashboardStats from './components/DashboardStats'
import RecentSecurityEvents from './components/RecentSecurityEvents'
import RecentAuditLogs from './components/RecentAuditLogs'
import QuickActions from './components/QuickActions'

export default function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardStats />
      <QuickActions />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '30px',
        marginTop: '30px',
      }}>
        <RecentSecurityEvents />
        <RecentAuditLogs />
      </div>
    </div>
  )
}
