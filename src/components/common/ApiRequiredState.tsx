'use client'

import React from 'react'
import { Card, ListGroup } from 'react-bootstrap'

type Props = {
  title: string
  description: string
  requiredEndpoints: string[]
  docsPath?: string
}

export default function ApiRequiredState({ title, description, requiredEndpoints, docsPath }: Props) {
  return (
    <Card className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
      <Card.Body className="p-4">
        <div className="d-flex flex-column gap-3">
          <div>
            <h5 className="fw-bold text-dark mb-2">{title}</h5>
            <p className="text-muted mb-0 fs-13">{description}</p>
          </div>

          <div>
            <h6 className="text-secondary text-uppercase fs-11 fw-semibold mb-2">Required Endpoints</h6>
            <ListGroup variant="flush">
              {requiredEndpoints.map((endpoint) => (
                <ListGroup.Item key={endpoint} className="px-0 py-2 border-0 bg-transparent font-monospace fs-13">
                  {endpoint}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>

          {docsPath && (
            <div className="text-muted fs-12">
              Audit notes: <span className="font-monospace">{docsPath}</span>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}
