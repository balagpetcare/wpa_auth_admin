'use client'

import React from 'react'
import { Alert, Button } from 'react-bootstrap'

type Props = {
  title?: string
  message: string
  status?: number
  onRetry?: () => void
}

export default function ApiErrorState({ title = 'Unable to load data', message, status, onRetry }: Props) {
  return (
    <Alert variant="danger" className="shadow-sm">
      <div className="d-flex flex-column gap-2">
        <div>
          <strong className="d-block mb-1">{title}</strong>
          <span className="fs-13">{message}</span>
          {status ? <div className="fs-12 mt-1 text-muted">Status code: {status}</div> : null}
        </div>
        {onRetry ? (
          <div>
            <Button variant="outline-danger" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    </Alert>
  )
}
