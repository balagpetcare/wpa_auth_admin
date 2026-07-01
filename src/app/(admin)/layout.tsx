'use client'

import { ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import AuthProtection from '@/components/layout/AuthProtection'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProtection>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          <main style={{
            flex: 1,
            padding: '30px 40px',
            overflowY: 'auto',
            backgroundColor: '#f8f9fa',
          }}>
            {children}
          </main>
        </div>
      </div>
    </AuthProtection>
  )
}
