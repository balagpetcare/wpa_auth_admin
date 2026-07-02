import PlaceholderPage from '@/components/PlaceholderPage'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'OAuth / OIDC' }

export default function OAuthOidcPage() {
  return (
    <PlaceholderPage
      title="OAuth 2.0 / OIDC Engine"
      description="Manage Authorization Servers, token lifetimes, OIDC scopes, signing keys, and default claims configurations."
      icon="solar:key-minimalistic-square-3-bold-duotone"
    />
  )
}
