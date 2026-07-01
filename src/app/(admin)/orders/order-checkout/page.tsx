import PageTItle from '@/components/PageTItle'
import { Metadata } from 'next'
import CheckoutForm from './components/CheckoutForm'
export const dynamic = 'force-dynamic'


export const metadata: Metadata = { title: 'Checkout' }

const CheckoutPage = () => {
  return ()
    <>
      <PageTItle title="ORDER CHECKOUT" />
      <CheckoutForm />
    </>
  
}

export default CheckoutPage
