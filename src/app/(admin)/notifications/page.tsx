import { Metadata } from 'next'
import NotificationsPageContent from './components/NotificationsPageContent'

export const metadata: Metadata = { title: 'Notifications' }

const NotificationsPage = () => {
  return <NotificationsPageContent />
}

export default NotificationsPage
