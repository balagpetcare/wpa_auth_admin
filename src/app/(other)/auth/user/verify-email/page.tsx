import { Metadata } from 'next'
import UserVerifyEmail from './components/UserVerifyEmail'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Verify Email' }

const page = () => {
  return <UserVerifyEmail />
}

export default page
