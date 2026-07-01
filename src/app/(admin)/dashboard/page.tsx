import { Metadata } from 'next'
import DashboardHeader from './components/DashboardHeader'
import DashboardStats from './components/DashboardStats'
import RecentSecurityEvents from './components/RecentSecurityEvents'
import RecentAuditLogs from './components/RecentAuditLogs'
import QuickActions from './components/QuickActions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'WPA Central Auth Dashboard' }

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader />
      <DashboardStats />
      <QuickActions />
      <div className="row g-4">
        <div className="col-12 col-xxl-6">
          <RecentSecurityEvents />
        </div>
        <div className="col-12 col-xxl-6">
          <RecentAuditLogs />
        </div>
      </div>
    </>
  )
}
