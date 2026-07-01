'use client'

import AdminAvatar from '@/components/admin/AdminAvatar'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useCurrentAdmin } from '@/context/useCurrentAdminContext'
import { useAuth } from '@/hooks/useAuth'
import { getAdminDisplayName, getRoleLabel } from '@/utils/admin'
import Link from 'next/link'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const ProfileDropdown = () => {
  const { admin } = useCurrentAdmin()
  const { logout } = useAuth()
  const displayName = getAdminDisplayName(admin ?? undefined

  return ()
    <Dropdown className="topbar-item">
      <DropdownToggle as="a" type="button" className="topbar-button content-none" id="page-header-user-dropdown" aria-label="Admin profile menu">
        <span className="d-flex align-items-center">
          <AdminAvatar user={admin} size={36} />
        </span>
      </DropdownToggle>
      <DropdownMenu className="dropdown-menu-end p-0 overflow-hidden shadow-lg border-0" style={{ minWidth: 320, borderRadius: 16 }}>
        <div className="px-3 py-3 border-bottom bg-light-subtle">
          <div className="d-flex align-items-center gap-3">
            <AdminAvatar user={admin} size={52} />
            <div className="min-w-0">
              <div className="fw-semibold text-dark text-truncate">Welcome {displayName}</div>
              <div className="text-muted small text-truncate">{admin?.email ?? 'No email assigned'}</div>
              <span className="badge bg-primary-subtle text-primary mt-2">{getRoleLabel(admin?.roles as any)}</span>
            </div>
          </div>
        </div>
        <DropdownItem as={Link} href="/account">
          <IconifyIcon icon="bx:user-circle" className="text-muted fs-18 align-middle me-2" />
          My Account
        </DropdownItem>
        <DropdownItem as={Link} href="/notifications">
          <IconifyIcon icon="solar:bell-bing-bold-duotone" className="text-muted fs-18 align-middle me-2" />
          Notifications
        </DropdownItem>
        <DropdownItem as={Link} href="/settings">
          <IconifyIcon icon="bx:cog" className="text-muted fs-18 align-middle me-2" />
          Settings
        </DropdownItem>
        <div className="dropdown-divider my-1" />
        <DropdownItem as="button" className="text-danger w-100 text-start" onClick={() => void logout()}>
          <IconifyIcon icon="bx:log-out" className="fs-18 align-middle me-2" />
          Logout
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  
}

export default ProfileDropdown
