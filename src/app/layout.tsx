import type { Metadata } from 'next'
import '@/assets/scss/app.scss'

export const metadata: Metadata = {
  title: 'WPA Central Auth Admin',
  description: 'Admin dashboard for WPA Central Auth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
