'use client'

import { ReactNode } from 'react'
import VerticalNavigationBar from '@/components/layout/VerticalNavigationBar'
import TopNavigationBar from '@/components/layout/TopNavigationBar'
import AuthProtection from '@/components/layout/AuthProtection'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthProtection>
      <div className="wrapper">
        <VerticalNavigationBar />
        <div className="page-content">
          <TopNavigationBar />
          <main className="container-fluid py-4">
            {children}
          </main>
        </div>
      </div>
    </AuthProtection>
  )
}
