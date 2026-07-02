'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { Badge, Button, Card, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { getMediaUrl } from '@/lib/mediaUrl'
import { accountApi } from '@/features/account/api'
import { AccountProfile } from '@/features/account/types'
import { StatusBadge } from '@/components/dashboard/DashboardComponents'

interface ProfileHeroCardProps {
  account: AccountProfile
  onAvatarChange: (avatarUrl: string | null) => void
}

const ProfileHeroCard = ({ account, onAvatarChange }: ProfileHeroCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [imgError, setImgError] = useState(false)

  const displayName = account.fullName || account.username
  const initials = (account.fullName || account.username || account.email || 'AD').slice(0, 2).toUpperCase()
  const avatarSrc = getMediaUrl(account.avatarUrl)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await accountApi.updateMyAvatar(file)
      onAvatarChange(res.data.avatarUrl)
      setImgError(false)
      toast.success(res.message || 'Profile picture updated successfully.')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload profile picture.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    setUploading(true)
    try {
      const res = await accountApi.removeMyAvatar()
      onAvatarChange(res.data.avatarUrl)
      setImgError(false)
      toast.success(res.message || 'Profile picture removed successfully.')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove profile picture.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      <Card.Body className="p-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center gap-4">
          <div className="position-relative" style={{ width: 88, height: 88 }}>
            {account.avatarUrl && !imgError ? (
              <Image
                src={avatarSrc}
                alt={displayName || 'Admin avatar'}
                width={88}
                height={88}
                unoptimized
                className="rounded-circle"
                style={{ objectFit: 'cover', width: 88, height: 88 }}
                onError={() => setImgError(true)}
              />
            ) : (
              <span
                className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center fw-bold fs-24"
                style={{ width: 88, height: 88 }}
              >
                {initials}
              </span>
            )}
            {uploading && (
              <div
                className="position-absolute top-0 start-0 d-flex align-items-center justify-content-center rounded-circle bg-dark bg-opacity-50"
                style={{ width: 88, height: 88 }}
              >
                <Spinner animation="border" size="sm" variant="light" />
              </div>
            )}
          </div>

          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h4 className="fw-bold text-dark mb-0">{displayName}</h4>
              <StatusBadge status={account.status} />
            </div>
            <p className="text-muted mb-2 fs-14">{account.email}</p>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {account.roles.map((role) => (
                <Badge key={role.id} bg="soft-primary" className="text-primary text-uppercase fs-11 px-2 py-1">
                  {role.name.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
            <div className="d-flex flex-wrap gap-3 fs-12 text-muted">
              {account.lastLoginAt && (
                <span>
                  <IconifyIcon icon="solar:login-2-bold-duotone" className="align-middle me-1" />
                  Last login {new Date(account.lastLoginAt).toLocaleString()}
                </span>
              )}
              <span>
                <IconifyIcon icon="solar:calendar-bold-duotone" className="align-middle me-1" />
                Member since {new Date(account.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="d-none" onChange={handleFileSelect} />
            <Button variant="outline-primary" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              <IconifyIcon icon="solar:camera-bold-duotone" className="me-1 align-middle" />
              Change Photo
            </Button>
            {account.avatarUrl && (
              <Button variant="outline-danger" size="sm" disabled={uploading} onClick={handleRemove}>
                <IconifyIcon icon="solar:trash-bin-trash-bold-duotone" className="me-1 align-middle" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default ProfileHeroCard
