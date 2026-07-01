'use client'

import { useEffect, useState } from 'react'

type AdminData = {
  id?: string
  username?: string
  email?: string
  fullName?: string
  displayName?: string
}

export default function DashboardHeader() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('adminData')
      if (data) {
        try {
          setAdminData(JSON.parse(data))
        } catch (e) {
          console.error('Failed to parse admin data:', e)
        }
      }
    }
  }, [])

  const displayName = adminData?.displayName || adminData?.fullName || adminData?.username || 'Administrator'
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div style={{ marginBottom: '40px' }}>
      <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
        {greeting}, {displayName}
      </h1>
      <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#7f8c8d' }}>
        Here's what's happening in your WPA Central Auth system today.
      </p>
    </div>
  )
}
