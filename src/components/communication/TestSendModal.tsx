'use client'

import React, { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'

export type TestSendModalProps = {
  show: boolean
  onHide: () => void
  providerType: 'EMAIL' | 'SMS'
  providerName: string
  onSend: (data: { recipient: string; subject?: string; message: string }) => Promise<void>
}

export default function TestSendModal({ show, onHide, providerType, providerName, onSend }: TestSendModalProps) {
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('WPA Central Auth provider test')
  const [message, setMessage] = useState('This is a WPA Central Auth provider test.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!show) return
    setRecipient('')
    setSubject('WPA Central Auth provider test')
    setMessage('This is a WPA Central Auth provider test.')
    setError(null)
  }, [show])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient.trim()) {
      setError(providerType === 'EMAIL' ? 'Recipient email is required.' : 'Recipient phone number is required.')
      return
    }
    if (providerType === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())) {
      setError('Enter a valid recipient email address.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSend({
        recipient: recipient.trim(),
        subject: providerType === 'EMAIL' ? subject.trim() : undefined,
        message: message.trim(),
      })
      onHide()
    } catch (err: any) {
      setError(err?.message || 'Test send failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal show={show} onHide={loading ? undefined : onHide} centered>
      <Form onSubmit={handleSend}>
        <Modal.Header closeButton={!loading}>
          <Modal.Title className="fw-bold">Send test {providerType === 'EMAIL' ? 'email' : 'SMS'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-muted fs-12 mb-3">{providerName}</div>
          {error ? <Alert variant="danger" className="py-2">{error}</Alert> : null}
          <Form.Group className="mb-3">
            <Form.Label>{providerType === 'EMAIL' ? 'Recipient email' : 'Recipient phone number'}</Form.Label>
            <Form.Control
              type={providerType === 'EMAIL' ? 'email' : 'text'}
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={providerType === 'EMAIL' ? 'you@example.com' : '+8801XXXXXXXXX'}
            />
          </Form.Group>
          {providerType === 'EMAIL' ? (
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Form.Group>
          ) : null}
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control as="textarea" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="light" onClick={onHide} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Send Test
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
