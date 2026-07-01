import 'next-auth'
import 'next-auth/jwt'
import type { AdminUser } from './auth'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    refreshToken: string
    user: AdminUser
    error?: string
  }

  interface User extends AdminUser {
    accessToken: string
    refreshToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    refreshToken: string
    user: AdminUser
    error?: string
  }
}
