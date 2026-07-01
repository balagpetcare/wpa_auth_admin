'use client'
import logoDark from '@/assets/images/logo-dark.png'
import smallImg from '@/assets/images/small/img-10.jpg'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import LoginFrom from './LoginFrom'
import { Card, Col, Row } from 'react-bootstrap'
import Link from 'next/link'
import { publicApi, apiClient } from '@/lib/apiClient'
import { useSearchParams, useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'

const SignIn = () => {
  const [providers, setProviders] = useState<any[]>([]
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id'
  const redirectUri = searchParams.get('redirect_uri'
  const fetchedRef = useRef(false
  const router = useRouter()

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    // Check social providers
    publicApi.get('/admin/social-providers'
      .then((res: any) => {
        if (res.success && res.providers) {
          setProviders(res.providers
        }
      }
      .catch((err) => {
        console.warn('Could not fetch social providers:', err.message
      }

    // Check if user is already authenticated
    getSession().then((session: any) => {
      const token = session?.accessToken
      if (token) {
        apiClient(token).get('/admin/auth/me'
          .then(() => {
            router.replace('/dashboard'
          }
          .catch((err) => {
            console.warn('Previous session invalid or network error:', err.message
          }
      }
    }
  }, [router]

  const handleSocialLogin = (provider: string) => {
    // If we have clientId and redirectUri from an external app, pass them.
    // Otherwise fallback to admin panel login logic if applicable, but for this generic SSO page we assume query params exist.
    if (!clientId || !redirectUri) {
      alert("Missing client_id or redirect_uri for SSO"
      return
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/social/${provider}/start?client_id=${clientId}&redirect_uri=${redirectUri}`
  }

  return ()
    <div className="d-flex flex-column vh-100 p-3">
      <div className="d-flex flex-column flex-grow-1">
        <Row className="h-100">
          <Col xxl={7}>
            <Row className="justify-content-center h-100">
              <Col lg={6} className="py-lg-5">
                <div className="d-flex flex-column h-100 justify-content-center">
                  <div className="auth-logo mb-4">
                    <Link href="/dashboard">
                      <Image src={logoDark} height={32} alt="World Pet Association" priority />
                    </Link>
                  </div>
                  <h2 className="fw-bold fs-24">Sign In</h2>
                  <p className="text-muted mt-1 mb-4">Enter your email address and password to access admin panel.</p>
                  <div className="mb-5">
                    <LoginFrom />
                    
                    {providers.length > 0 && ()
                      <>
                        <p className="mt-3 fw-semibold no-span">OR sign with</p>
                        <div className="d-grid gap-2">
                          {providers.map((p: any) => {
                            let icon = 'bx:globe'
                            if (p.provider === 'GOOGLE') icon = 'bxl:google'
                            if (p.provider === 'FACEBOOK') icon = 'bxl:facebook'
                            if (p.provider === 'APPLE') icon = 'bxl:apple'
                            if (p.provider === 'TWITTER') icon = 'bxl:twitter'
                            if (p.provider === 'INSTAGRAM') icon = 'bxl:instagram'

                            return ()
                              <button 
                                key={p.provider} 
                                className="btn btn-soft-dark text-start d-flex align-items-center justify-content-center"
                                onClick={() => handleSocialLogin(p.provider)}
                                type="button"
                              >
                                <IconifyIcon icon={icon} className="fs-20 me-2" /> Sign in with {p.displayName}
                              </button>
                            
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-danger text-center">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/sign-up" className="text-dark fw-bold ms-1">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </Col>
            </Row>
          </Col>
          <Col xxl={5} className="d-none d-xxl-flex">
            <Card className="h-100 mb-0 overflow-hidden">
              <div className="d-flex flex-column h-100">
                <Image src={smallImg} alt="small-img" className="w-100 h-100" />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  
}

export default SignIn
