'use client'

import { useCallback, useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import PageTItle from '@/components/PageTItle'
import { ErrorState } from '@/components/dashboard/DashboardComponents'
import { accountApi } from '@/features/account/api'
import { AccountProfile } from '@/features/account/types'
import ProfileHeroCard from './components/ProfileHeroCard'
import ProfileCompletionCard from './components/ProfileCompletionCard'
import PersonalInfoCard from './components/PersonalInfoCard'
import AccountInfoCard from './components/AccountInfoCard'
import PreferencesCard from './components/PreferencesCard'
import SecurityCard from './components/SecurityCard'
import RecentActivityCard from './components/RecentActivityCard'

const ProfileSkeleton = () => (
  <Row>
    <Col lg={8}>
      <div className="bg-white rounded shadow-sm mb-4" style={{ height: 140 }} />
      <div className="bg-white rounded shadow-sm mb-4" style={{ height: 260 }} />
      <div className="bg-white rounded shadow-sm mb-4" style={{ height: 200 }} />
    </Col>
    <Col lg={4}>
      <div className="bg-white rounded shadow-sm mb-4" style={{ height: 160 }} />
      <div className="bg-white rounded shadow-sm mb-4" style={{ height: 260 }} />
    </Col>
  </Row>
)

const ProfilePage = () => {
  const [account, setAccount] = useState<AccountProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAccount = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await accountApi.getMyAccount()
      setAccount(res.account)
    } catch (err: any) {
      setError(err?.message || 'Failed to load your profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccount()
  }, [loadAccount])

  return (
    <>
      <PageTItle title="ADMIN PROFILE" />

      {loading && <ProfileSkeleton />}

      {!loading && error && <ErrorState message={error} onRetry={loadAccount} />}

      {!loading && account && (
        <Row>
          <Col lg={8}>
            <ProfileHeroCard account={account} onAvatarChange={(avatarUrl) => setAccount((current) => (current ? { ...current, avatarUrl } : current))} />
            <PersonalInfoCard account={account} onUpdated={setAccount} />
            <PreferencesCard account={account} onUpdated={setAccount} />
            <SecurityCard account={account} />
          </Col>
          <Col lg={4}>
            <ProfileCompletionCard account={account} />
            <AccountInfoCard account={account} />
            <RecentActivityCard userId={account.id} />
          </Col>
        </Row>
      )}
    </>
  )
}

export default ProfilePage
