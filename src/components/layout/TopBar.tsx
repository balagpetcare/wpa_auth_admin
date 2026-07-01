'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AdminData = {
  id?: string
  username?: string
  email?: string
  fullName?: string
  displayName?: string
}

export default function TopBar() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('adminData')
    if (!raw) return
    try {
      setAdminData(JSON.parse(raw))
    } catch {
      setAdminData(null)
    }
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 991) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('.profile-button, .profile-dropdown')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.menuSize = sidebarOpen ? 'hidden' : 'default'
    document.body.classList.toggle('sidebar-enable', sidebarOpen)
    return () => {
      document.body.classList.remove('sidebar-enable')
    }
  }, [sidebarOpen])

  const displayName = useMemo(
    () => adminData?.displayName || adminData?.fullName || adminData?.username || 'Admin',
    [adminData],
  )

  const email = adminData?.email || ''

  const handleLogout = async () => {
    setMenuOpen(false)
    try {
      await fetch('/auth/logout', { method: 'GET' }).catch(() => undefined)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('adminData')
      localStorage.removeItem('accessTokenExpiresAt')
      router.push('/auth/sign-in')
    }
  }

  return (
    <header className="topbar">
      <div className="container-fluid">
        <div className="navbar-header">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="button-toggle-menu topbar-button"
              onClick={() => setSidebarOpen((value) => !value)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <div className="topbar-title">
              <div className="topbar-title-kicker">World Pet Association</div>
              <div className="topbar-title-main">WPA Central Auth Admin</div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 position-relative">
            <button
              type="button"
              className="topbar-button profile-button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="profile-avatar">{displayName.charAt(0).toUpperCase()}</span>
              <span className="profile-copy d-none d-md-inline">
                <span className="profile-name">{displayName}</span>
                {email ? <span className="profile-email">{email}</span> : null}
              </span>
            </button>

            {menuOpen ? (
              <div className="dropdown-menu dropdown-menu-end show profile-dropdown">
                <div className="dropdown-header">
                  <div className="fw-semibold">{displayName}</div>
                  {email ? <div className="text-muted small">{email}</div> : null}
                </div>
                <Link href="/my-account" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                  My Account
                </Link>
                <button type="button" className="dropdown-item text-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
