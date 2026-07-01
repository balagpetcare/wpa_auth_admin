'use client'

import { useState } from 'react'

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState('branding')

  return (
    <div>
      <h1>Email Settings</h1>
      <p>Manage email branding, templates, and delivery</p>

      <div style={{ marginTop: '20px' }}>
        <div style={{ borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
          <nav style={{ display: 'flex', gap: '20px' }}>
            {['branding', 'templates', 'preview', 'send-test', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  background: activeTab === tab ? '#007bff' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '3px solid #007bff' : 'none',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <p>Tab content for: <strong>{activeTab}</strong></p>
          <p>Email Settings UI will be implemented here</p>
        </div>
      </div>
    </div>
  )
}
