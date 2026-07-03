'use client'

import GatewayProviderEditor from '@/components/communication/GatewayProviderEditor'

export default function NewSmsGatewayPage() {
  return <GatewayProviderEditor providerType="SMS" mode="create" />
}
