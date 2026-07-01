'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
import { emailApi, type EmailClient } from './emailSettingsApi'

interface ClientSelectorProps {
  selectedClientId: string | null
  selectedLocale: 'en' | 'bn'
  onClientChange: (id: string | null) => void
  onLocaleChange: (locale: 'en' | 'bn') => void
}

const DEFAULT_CLIENTS: EmailClient[] = [
  { id: 'global', name: 'Global default' },
  { id: 'wpa', name: 'World Pet Association' },
  { id: 'bangladesh', name: 'Bangladesh Pet Association' },
  { id: 'furtail', name: 'Furtail' },
]

export default function ClientSelector({ selectedClientId, selectedLocale, onClientChange, onLocaleChange }: ClientSelectorProps) {
  const [clients, setClients] = useState<EmailClient[]>(DEFAULT_CLIENTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await emailApi.clients()
        const list = response.data?.data?.items || response.data?.items || response.data?.clients || []
        if (list.length) {
          setClients([
            { id: 'global', name: 'Global default' },
            ...list.map((client: EmailClient) => ({
              id: client.id,
              name: client.name,
              slug: client.slug,
              clientId: client.clientId,
            })),
          ])
        }
      } catch (e: any) {
        setError(e?.message || 'Unable to load clients')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedName = useMemo(() => clients.find((client) => client.id === (selectedClientId || 'global'))?.name || 'Global default', [clients, selectedClientId])

  return (
    <Card className="border-0 shadow-sm mb-4">
      <CardBody className="p-4">
        <Row className="g-3 align-items-end">
          <Col md={8}>
            <Form.Label className="fw-semibold">Client / App</Form.Label>
            {loading ? (
              <div className="text-muted d-flex align-items-center gap-2">
                <Spinner animation="border" size="sm" /> Loading clients...
              </div>
            ) : (
              <Form.Select value={selectedClientId || 'global'} onChange={(e) => onClientChange(e.target.value === 'global' ? null : e.target.value)}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.slug ? ` (${client.slug})` : ''}
                  </option>
                ))}
              </Form.Select>
            )}
            {error && <div className="text-warning small mt-2">Client list endpoint unavailable. Showing built-in defaults.</div>}
            <div className="small text-muted mt-2">Selected: {selectedName}</div>
          </Col>

          <Col md={4}>
            <Form.Label className="fw-semibold">Locale</Form.Label>
            <Form.Select value={selectedLocale} onChange={(e) => onLocaleChange(e.target.value as 'en' | 'bn')}>
              <option value="en">English</option>
              <option value="bn">Bangla</option>
            </Form.Select>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
