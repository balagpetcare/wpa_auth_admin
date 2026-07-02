import { Metadata } from 'next'
import UserResetPassword from './components/UserResetPassword'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Reset Password' }

const page = () => {
  return <UserResetPassword />
}

export default page
