import { Metadata } from 'next'
import UserRegister from './components/UserRegister'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Create Account' }

const page = () => {
  return <UserRegister />
}

export default page
