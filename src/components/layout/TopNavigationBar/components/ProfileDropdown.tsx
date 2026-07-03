'use client'

import React from 'react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Image from 'next/image'
import Link from 'next/link'
import { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { useAuth } from '@/context/useAuthContext'
import { resolveAvatarUrl } from '@/lib/avatarUrl'

const ProfileDropdown = () => {
  const { admin, logout } = useAuth()
  const displayName = admin?.displayName || admin?.username || 'Admin'
  const avatarSrc = resolveAvatarUrl(admin?.avatarUrl)
  const initials = (admin?.displayName || admin?.username || admin?.email || 'AD').slice(0, 2).toUpperCase()
  const [imgError, setImgError] = React.useState(false)
  const primaryRole = admin?.roles?.[0]

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    await logout()
  }

  return (
    <Dropdown className="topbar-item">
      <DropdownToggle
        as={'a'}
        type="button"
        className="topbar-button content-none"
        id="page-header-user-dropdown"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <span className="d-flex align-items-center">
          {avatarSrc && !imgError ? (
            <Image
              className="rounded-circle"
              width={32}
              height={32}
              src={avatarSrc}
              alt="avatar"
              style={{ objectFit: 'cover', width: 32, height: 32, flexShrink: 0 }}
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <span
              className="rounded-circle bg-soft-primary text-primary d-inline-flex align-items-center justify-content-center fw-semibold"
              style={{ width: 32, height: 32 }}
            >
              {initials}
            </span>
          )}
        </span>
      </DropdownToggle>
      <DropdownMenu className="dropdown-menu-end">
        <DropdownHeader as={'h6'} className="dropdown-header pb-1">
          {displayName}
        </DropdownHeader>
        {admin?.email && <p className="px-3 mb-1 text-muted fs-12 text-truncate">{admin.email}</p>}
        {primaryRole && (
          <p className="px-3 mb-2">
            <span className="badge bg-soft-primary text-primary text-uppercase fs-11">{primaryRole.replace(/_/g, ' ')}</span>
          </p>
        )}
        <div className="dropdown-divider my-1" />
        <DropdownItem as={Link} href="/profile">
          <IconifyIcon icon="solar:user-circle-bold-duotone" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">My Profile</span>
        </DropdownItem>
        <DropdownItem as={Link} href="/security-settings">
          <IconifyIcon icon="solar:shield-keyhole-bold-duotone" className="text-muted fs-18 align-middle me-1" />
          <span className="align-middle">Security Settings</span>
        </DropdownItem>
        <div className="dropdown-divider my-1" />
        <DropdownItem as="button" className="text-danger d-flex align-items-center w-100 border-0 bg-transparent" onClick={handleLogout}>
          <IconifyIcon icon="solar:logout-2-bold-duotone" className="fs-18 align-middle me-1" />
          <span className="align-middle">Logout</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

export default ProfileDropdown
