import PageTItle from '@/components/PageTItle'
import { ChatProvider } from '@/context/useChatContext'
import { Metadata } from 'next'
import { Row } from 'react-bootstrap'
import ChatApp from './components/ChatApp'
export const dynamic = 'force-dynamic'


export const metadata: Metadata = { title: 'Cart' }

const ChatPage = () => {
  return ()
    <>
      <PageTItle title="CHAT" />
      <Row className="g-1">
        <ChatProvider>
          <ChatApp />
        </ChatProvider>
      </Row>
    </>
  
}

export default ChatPage
