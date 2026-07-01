import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { LoginResponse } from '@/types/auth'

const API_BASE = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:5010/api/v1'

export const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrUsername || !credentials?.password) {
          throw new Error('Email and password are required.')
        }

        const res = await fetch(`${API_BASE}/admin/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailOrUsername: credentials.emailOrUsername,
            password: credentials.password,
          }),
        }

        const data: LoginResponse = await res.json().catch(() => null

        if (!res.ok || !data?.success) {
          throw new Error(data?.['message' as keyof typeof data] as string ?? 'Invalid credentials.')
        }

        // Return shape must match next-auth User — we attach tokens here
        return {
          ...data.user,
          id: data.user.id,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }
      },
    }),
  ],

  secret: process.env['NEXTAUTH_SECRET'] ?? 'change-me-in-production',

  pages: {
    signIn: '/auth/sign-in',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in `user` is populated
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.user = {
          id: user.id,
          email: user.email ?? null,
          phone: user.phone ?? null,
          username: user.username ?? null,
          displayName: user.displayName ?? null,
          avatarUrl: user.avatarUrl ?? null,
          status: user.status,
          roles: user.roles,
          emailVerifiedAt: user.emailVerifiedAt ?? null,
          phoneVerifiedAt: user.phoneVerifiedAt ?? null,
          createdAt: user.createdAt,
        }
      }
      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.user = token.user
      if (token.error) session.error = token.error
      return session
    },
  },
}
