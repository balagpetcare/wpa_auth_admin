'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'

type StatCard = {
  title: string
  value: number | string
  icon: string
  color: string
  bgColor: string
  trend?: string
  trendUp?: boolean
}

export default function DashboardStats() {
  const [stats, setStats] = useState<StatCard[]>([
    {
      title: 'Total Users',
      value: '-',
      icon: '👥',
      color: '#3498db',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Active Sessions',
      value: '-',
      icon: '💾',
      color: '#27ae60',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Security Events',
      value: '-',
      icon: '🛡️',
      color: '#e74c3c',
      bgColor: '#ffebee',
    },
    {
      title: 'API Requests (24h)',
      value: '-',
      icon: '📊',
      color: '#f39c12',
      bgColor: '#fff3e0',
    },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setLoading(false)
          return
        }

        // Try to fetch real stats from the backend
        try {
          const response = await apiClient(token).get<any>('/admin/dashboard/stats')
          if (response) {
            setStats(prev => [
              { ...prev[0], value: response.totalUsers || '-' },
              { ...prev[1], value: response.activeSessions || '-' },
              { ...prev[2], value: response.securityEvents || '-' },
              { ...prev[3], value: response.apiRequests || '-' },
            ])
          }
        } catch (apiError) {
          // API endpoint doesn't exist yet, show placeholder values
          setStats(prev => [
            { ...prev[0], value: '0' },
            { ...prev[1], value: '0' },
            { ...prev[2], value: '0' },
            { ...prev[3], value: '0' },
          ])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {Array(4).fill(null).map((_, i) => (
          <div
            key={i}
            style={{
              height: '120px',
              backgroundColor: '#e9ecef',
              borderRadius: '8px',
              animation: 'pulse 2s infinite',
            }}
          />
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '40px',
    }}>
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            transition: 'all 0.2s ease',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
            el.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#7f8c8d', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.title}
              </p>
              <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: stat.color }}>
                {stat.value}
              </h3>
              {stat.trend && (
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: stat.trendUp ? '#27ae60' : '#e74c3c' }}>
                  {stat.trendUp ? '↑' : '↓'} {stat.trend}
                </p>
              )}
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: stat.bgColor,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
