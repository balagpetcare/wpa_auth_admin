'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Spinner } from 'react-bootstrap'
import { communicationApi } from '@/features/communication/api'
import { CommProviderDetail } from '@/features/communication/types'
import GatewayProviderEditor from '@/components/communication/GatewayProviderEditor'
import ApiErrorState from '@/components/common/ApiErrorState'

export default function EditSmsGatewayPage() {
  const params = useParams<{ id: string }>()
  const [provider, setProvider] = useState<CommProviderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  if (error || !provider) return <ApiErrorState message={error || 'Provider not found.'} onRetry={load} />

  return <GatewayProviderEditor providerType="SMS" mode="edit" provider={provider} />
}
