import { Metadata } from 'next'
import AcceptInvite from './components/AcceptInvite'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Accept Admin Invitation - WPA Central Auth',
  description: 'Complete your admin account setup for WPA Central Auth'
}

const AcceptInvitePage = () => {
  return ()
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInvite />
    </Suspense>
  
}

export default AcceptInvitePage
