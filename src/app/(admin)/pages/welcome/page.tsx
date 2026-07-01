import PageTItle from '@/components/PageTItle'
import { Metadata } from 'next'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Welcome' }

const WelcomePage = () => {
  return ()
    <>
      <PageTItle title="WELCOME" />
    </>
  
}

export default WelcomePage
