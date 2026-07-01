'use client'

import { useMemo, useState } from 'react'
import { Card, CardBody, Nav, NavItem, NavLink } from 'react-bootstrap'
import ClientSelector from './components/ClientSelector'
import BrandingTab from './components/BrandingTab'
import TemplatesTab from './components/TemplatesTab'
import PreviewTab from './components/PreviewTab'
import SendTestTab from './components/SendTestTab'
import LogsTab from './components/LogsTab'

type TabType = 'branding' | 'templates' | 'preview' | 'send-test' | 'logs'

const TABS: { key: TabType; label: string }[] = [
  { key: 'branding', label: 'Branding' },
  { key: 'templates', label: 'Templates' },
  { key: 'preview', label: 'Preview' },
  { key: 'send-test', label: 'Send Test' },
  { key: 'logs', label: 'Logs' },
]

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('branding')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedLocale, setSelectedLocale] = useState<'en' | 'bn'>('en')

  const activeLabel = useMemo(() => TABS.find((tab) => tab.key === activeTab)?.label, [activeTab])

  return (
    <>
      <div className="page-title-box">
        <div>
          <h1 className="mb-1">Email Branding & Templates</h1>
          <p className="text-muted mb-0">Manage branding, templates, previews, test sends, and delivery logs.</p>
        </div>
      </div>

      <ClientSelector
        selectedClientId={selectedClientId}
        selectedLocale={selectedLocale}
        onClientChange={setSelectedClientId}
        onLocaleChange={setSelectedLocale}
      />

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardBody className="p-0">
          <Nav variant="tabs" className="nav-tabs-custom border-bottom bg-light-subtle px-3 pt-3">
            {TABS.map((tab) => (
              <NavItem key={tab.key}>
                <NavLink
                  href="#"
                  active={activeTab === tab.key}
                  onClick={(e) => {
                    e.preventDefault()
                    setActiveTab(tab.key)
                  }}
                  className="px-3 py-3"
                >
                  {tab.label}
                </NavLink>
              </NavItem>
            ))}
          </Nav>

          <div className="p-4 p-lg-5">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
              <div>
                <h4 className="mb-1">{activeLabel}</h4>
                <p className="text-muted mb-0">
                  {selectedClientId ? `Client: ${selectedClientId}` : 'Global default'} | Locale: {selectedLocale === 'bn' ? 'Bangla' : 'English'}
                </p>
              </div>
              <span className="badge text-bg-primary-subtle text-primary">Larkon admin style</span>
            </div>

            {activeTab === 'branding' && <BrandingTab clientId={selectedClientId} locale={selectedLocale} />}
            {activeTab === 'templates' && <TemplatesTab clientId={selectedClientId} locale={selectedLocale} />}
            {activeTab === 'preview' && <PreviewTab clientId={selectedClientId} locale={selectedLocale} />}
            {activeTab === 'send-test' && <SendTestTab clientId={selectedClientId} locale={selectedLocale} />}
            {activeTab === 'logs' && <LogsTab clientId={selectedClientId} locale={selectedLocale} />}
          </div>
        </CardBody>
      </Card>
    </>
  )
}
