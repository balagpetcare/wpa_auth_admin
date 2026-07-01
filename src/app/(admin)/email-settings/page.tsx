'use client'

import { useState, useEffect } from 'react'
import BrandingTab from './components/BrandingTab'
import TemplatesTab from './components/TemplatesTab'
import PreviewTab from './components/PreviewTab'
import SendTestTab from './components/SendTestTab'
import LogsTab from './components/LogsTab'
import ClientSelector from './components/ClientSelector'

type TabType = 'branding' | 'templates' | 'preview' | 'send-test' | 'logs'

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'branding', label: 'Branding', icon: '🎨' },
  { key: 'templates', label: 'Templates', icon: '📧' },
  { key: 'preview', label: 'Preview', icon: '👁️' },
  { key: 'send-test', label: 'Send Test', icon: '✉️' },
  { key: 'logs', label: 'Logs', icon: '📋' },
]

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('branding')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedLocale, setSelectedLocale] = useState('en')

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
          Email Settings
        </h1>
        <p style={{ margin: '0', fontSize: '16px', color: '#7f8c8d' }}>
          Manage email branding, templates, and delivery settings
        </p>
      </div>

      {/* Client & Locale Selector */}
      <ClientSelector
        selectedClientId={selectedClientId}
        selectedLocale={selectedLocale}
        onClientChange={setSelectedClientId}
        onLocaleChange={setSelectedLocale}
      />

      {/* Tabs */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        overflow: 'hidden',
        marginBottom: '30px',
      }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e9ecef',
          backgroundColor: '#f8f9fa',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '16px 20px',
                backgroundColor: activeTab === tab.key ? '#fff' : 'transparent',
                color: activeTab === tab.key ? '#3498db' : '#7f8c8d',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '3px solid #3498db' : 'none',
                fontWeight: activeTab === tab.key ? '600' : '500',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                if (activeTab !== tab.key) {
                  el.style.backgroundColor = '#f0f0f0'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                if (activeTab !== tab.key) {
                  el.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '30px' }}>
          {activeTab === 'branding' && <BrandingTab clientId={selectedClientId} />}
          {activeTab === 'templates' && <TemplatesTab clientId={selectedClientId} locale={selectedLocale} />}
          {activeTab === 'preview' && <PreviewTab clientId={selectedClientId} locale={selectedLocale} />}
          {activeTab === 'send-test' && <SendTestTab clientId={selectedClientId} locale={selectedLocale} />}
          {activeTab === 'logs' && <LogsTab clientId={selectedClientId} locale={selectedLocale} />}
        </div>
      </div>
    </div>
  )
}
