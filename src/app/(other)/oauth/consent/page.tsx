import { Metadata } from 'next'
import OAuthConsent from './components/OAuthConsent'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Authorize Application' }

const page = () => {
  return <OAuthConsent />
}

export default page
