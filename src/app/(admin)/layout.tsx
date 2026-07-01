import { ReactNode } from 'react'

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */})
      <aside style={{
        width: '250px',
        backgroundColor: '#2c3e50',
        color: '#fff',
        padding: '20px',
        overflowY: 'auto',
      }}>
        <h1 style={{ fontSize: '20px', marginBottom: '30px' }}>
          WPA Central Auth
        </h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/dashboard" style={{
            color: '#fff',
            padding: '10px',
            borderRadius: '4px',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            Dashboard
          </a>
          <a href="/email-settings" style={{
            color: '#fff',
            padding: '10px',
            borderRadius: '4px',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            Email Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */})
      <main style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
      }}>
        {children})
      </main>
    </div>
  )
}
