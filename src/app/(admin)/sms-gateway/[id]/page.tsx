'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Spinner } from 'react-bootstrap'
import { communicationApi } from '@/features/communication/api'
import { CommProviderDetail } from '@/features/communication/types'
import GatewayProviderDetails from '@/components/communication/GatewayProviderDetails'
import ApiErrorState from '@/components/common/ApiErrorState'
import TestSendModal from '@/components/communication/TestSendModal'
import adminToast from '@/lib/adminToast'

export default function SmsGatewayDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [provider, setProvider] = useState<CommProviderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await communicationApi.getProvider(params.id)
      if (res.success) setProvider(res.data)
    } catch (e: any) {
      setError(e?.message || 'Unable to load provider.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [params.id])
  useEffect(() => {
    setShowTestModal(searchParams.get('panel') === 'test')
  }, [searchParams])

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  if (error || !provider) return <ApiErrorState message={error || 'Provider not found.'} onRetry={load} />

  return (
    <>
      <GatewayProviderDetails
        provider={provider}
        providerType="SMS"
        onTest={() => setShowTestModal(true)}
        onHealthCheck={async () => {
          await communicationApi.healthCheckProvider(provider.id)
          adminToast.success('Health check refreshed', 'The provider health snapshot was updated.')
          await load()
        }}
        onToggleActive={async () => {
          if (provider.status === 'ACTIVE') await communicationApi.deactivateProvider(provider.id)
          else await communicationApi.activateProvider(provider.id)
          adminToast.success('Provider status updated', 'The provider active state changed successfully.')
          await load()
        }}
      />
      <TestSendModal
        show={showTestModal}
        onHide={() => setShowTestModal(false)}
        providerType="SMS"
        providerName={provider.name}
        onSend={async ({ recipient, message }) => {
          const res = await communicationApi.testSmsProvider(provider.id, recipient, message)
          adminToast.success('Test SMS sent', res.message || 'The provider test was completed successfully.')
          await load()
        }}
      />
    </>
  )
}
