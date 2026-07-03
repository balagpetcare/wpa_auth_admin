import { createContext, useContext } from 'react'
import type { ChildrenType } from '@/types/component-props'
import adminToast from '@/lib/adminToast'

type ShowNotificationType = {
  title?: string
  message: string
  variant?: 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark' | 'primary'
}

type NotificationContextType = {
  showNotification: ({ title, message, variant }: ShowNotificationType) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: ChildrenType) {
  const showNotification = ({ title, message, variant }: ShowNotificationType) => {
    const resolvedTitle = title || (variant === 'error' ? 'Error' : variant === 'warning' ? 'Warning' : variant === 'info' ? 'Info' : 'Success')
    if (variant === 'error' || variant === 'dark') adminToast.error(resolvedTitle, message)
    else if (variant === 'warning') adminToast.warning(resolvedTitle, message)
    else if (variant === 'info' || variant === 'primary') adminToast.info(resolvedTitle, message)
    else adminToast.success(resolvedTitle, message)
  }

  return <NotificationContext.Provider value={{ showNotification }}>{children}</NotificationContext.Provider>
}
