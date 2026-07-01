export type AdminUser = {
  id: string
  email: string | null
  phone: string | null
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  status: string
  roles: string[]
  emailVerifiedAt: string | null
  phoneVerifiedAt: string | null
  createdAt: string
}

export type LoginResponse = {
  success: boolean
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: AdminUser
}

// Legacy alias kept for any remaining references
export type UserType = {
  id: string
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  token: string
}
