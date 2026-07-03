'use client'
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import { DEFAULT_PAGE_TITLE } from '@/context/constants'
import { ChildrenType } from '@/types/component-props'
import dynamic from 'next/dynamic'
const LayoutProvider = dynamic(() => import('@/context/useLayoutContext').then((mod) => mod.LayoutProvider), {
  ssr: false,
})
import { NotificationProvider } from '@/context/useNotificationContext'
import { TitleProvider } from '@/context/useTitleContext'

import { AuthProvider } from '@/context/useAuthContext'

const AppProvidersWrapper = ({ children }: ChildrenType) => {
  const handleChangeTitle = () => {
    if (document.visibilityState == 'hidden') document.title = 'Please come back 🥺'
    else document.title = DEFAULT_PAGE_TITLE
  }

  useEffect(() => {
    if (document) {
      const e = document.querySelector<HTMLDivElement>('#__next_splash')
      if (e?.hasChildNodes()) {
        document.querySelector('#splash-screen')?.classList.add('remove')
      }
      e?.addEventListener('DOMNodeInserted', () => {
        document.querySelector('#splash-screen')?.classList.add('remove')
      })
    }

    document.addEventListener('visibilitychange', handleChangeTitle)
    return () => {
      document.removeEventListener('visibilitychange', handleChangeTitle)
    }
  }, [])

  return (
    <SessionProvider>
      <AuthProvider>
        <LayoutProvider>
          <TitleProvider>
            <NotificationProvider>
              {children}
              <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
                theme="light"
                closeButton
                className="admin-toast-container"
              />
            </NotificationProvider>
          </TitleProvider>
        </LayoutProvider>
      </AuthProvider>
    </SessionProvider>
  )
}
export default AppProvidersWrapper
