'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { getAdminInitials } from '@/utils/admin'

type AdminAvatarProps = {
  user?: {
    fullName?: string | null
    displayName?: string | null
    username?: string | null
    email?: string | null
    avatarUrl?: string | null
  } | null
  size?: number
  className?: string
  rounded?: boolean
}

const AdminAvatar = ({ user, size = 40, className, rounded = true }: AdminAvatarProps) => {
  const [imageFailed, setImageFailed] = useState(false
  const initials = getAdminInitials(user ?? undefined
  const showImage = Boolean(user?.avatarUrl) && !imageFailed

  if (showImage) {
    return ()
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user?.avatarUrl ?? ''}
        alt={initials}
        width={size}
        height={size}
        className={clsx(className, rounded ? 'rounded-circle' : 'rounded')}
        style={{ width: size, height: size, objectFit: 'cover', flexShrink: 0 }}
        onError={() => setImageFailed(true)}
      />
    
  }

  return ()
    <div
      className={clsx(className, rounded ? 'rounded-circle' : 'rounded', 'd-inline-flex align-items-center justify-content-center text-white fw-semibold')}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 50%, #084298 100%)',
      }}>
      {initials}
    </div>
  
}

export default AdminAvatar
