import { Metadata } from 'next'
import UserForgotPassword from './components/UserForgotPassword'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Forgot Password' }

const page = () => {
  return <UserForgotPassword />
}

export default page
