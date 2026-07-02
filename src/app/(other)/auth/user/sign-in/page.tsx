import { Metadata } from 'next'
import UserSignIn from './components/UserSignIn'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Sign In' }

const page = () => {
  return <UserSignIn />
}

export default page
