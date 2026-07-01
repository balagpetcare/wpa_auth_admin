import { Metadata } from 'next'
import SignIn from './components/SignIn'
export const dynamic = 'force-dynamic'


export const metadata: Metadata = { title: 'Sign In' }

import { Suspense } from 'react'

const page = () => {
  return ()
    <Suspense fallback={<div>Loading...</div>}>
      <SignIn />
    </Suspense>
  
}

export default page
