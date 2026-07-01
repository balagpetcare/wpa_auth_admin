'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'

type Client = {
  id: string
  clientId: string
  name: string
  slug: string
}

interface ClientSelectorProps {
  selectedClientId: string | null
  selectedLocale: string
  onClientChange: (id: string | null) => void
  onLocaleChange: (locale: string) => void
}

const LOCALES = [
  { code: 'en', label: 'English (en)' },
  { code: 'bn', label: 'Bengali / বাংলা (bn)' },
  { code: 'es', label: 'Spanish / Español (es)' },
  { code: 'fr', label: 'French / Français (fr)' },
]

export default function ClientSelector({
  selectedClientId,
  selectedLocale,
  onClientChange,
  onLocaleChange,
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setLoading(false)
          return
        }

        try {
          const response = await apiClient(token).get<any>('/admin/clients')
          if (response?.data?.items) {
            setClients(response.data.items)
          }
        } catch (apiError) {
          // Endpoint not available, show placeholder
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '30px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
      }}>
        {/* Client Selector */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50',
          }}>
            Select Client/App
          </label>
          {loading && (
            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              color: '#7f8c8d',
              fontSize: '13px',
            }}>
              Loading clients...
            </div>
          )}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fff3e0',
              borderRadius: '6px',
              color: '#e65100',
              fontSize: '13px',
            }}>
              Failed to load clients
            </div>
          )}
          {!loading && !error && (
            <select
              value={selectedClientId || ''}
              onChange={(e) => onClientChange(e.target.value || null)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="">Global Default (WPA)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.slug})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Locale Selector */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50',
          }}>
            Template Locale
          </label>
          <select
            value={selectedLocale}
            onChange={(e) => onLocaleChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            {LOCALES.map((locale) => (
              <option key={locale.code} value={locale.code}>
                {locale.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
