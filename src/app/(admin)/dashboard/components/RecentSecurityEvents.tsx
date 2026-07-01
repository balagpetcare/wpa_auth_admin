'use client'
import { Card, CardBody, CardTitle, Table, Spinner, CardHeader } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/apiClient'

const RecentSecurityEvents = () => {
  const { accessToken } = useAuth()
  const [events, setEvents] = useState<any[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState(false

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!accessToken) return;
        const res: any = await apiClient(accessToken).get('/admin/security-events?limit=5'
        
        const data = res
        setEvents(data.events || []
      } catch (err) {
        setError(true
      } finally {
        setLoading(false
      }
    }
    fetchEvents()
  }, [accessToken]

  return ()
    <Card>
      <CardHeader>
        <CardTitle as="h4">Recent Security Events</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? ()
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? ()
          <div className="alert alert-warning" role="alert">
            Failed to load security events. TODO: Implement /admin/security-events endpoint.
          </div>
        ) : events.length === 0 ? ()
          <div className="text-center py-4 text-muted">
            No recent security events found.
          </div>
        ) : ()
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Severity</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt, idx) => ()
                <tr key={idx}>
                  <td>{evt.type}</td>
                  <td>
                    <span className={`badge bg-${evt.severity === 'high' ? 'danger' : evt.severity === 'medium' ? 'warning' : 'info'}`}>
                      {evt.severity}
                    </span>
                  </td>
                  <td>{new Date(evt.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  
}

export default RecentSecurityEvents

