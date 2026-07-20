'use client'
import smallImg from '@/assets/images/small/img-10.jpg'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Image from 'next/image'
import LoginFrom from './LoginFrom'
import { Alert, Card, Col, Row } from 'react-bootstrap'
import Link from 'next/link'
import useQueryParams from '@/hooks/useQueryParams'

// Stage 2 (Central Auth SSO): generic, non-leaking copy for every failure
// mode the callback route can redirect back with (see ssoError values in
// src/app/api/auth/callback/central-auth/route.ts and
// src/app/api/auth/central-auth/start/route.ts) - deliberately does not
// distinguish reasons in the UI beyond "try again".
const SSO_ERROR_MESSAGE = 'Unable to sign in with WPA Central Auth. Please try again, or sign in with your password below.'

const SignIn = () => {
  const query = useQueryParams()
  const ssoError = query['ssoError']

  return (
    <div className="d-flex flex-column vh-100 p-3">
      <div className="d-flex flex-column flex-grow-1">
        <Row className="h-100">
          <Col xxl={7}>
            <Row className="justify-content-center h-100">
              <Col lg={6} className="py-lg-5">
                <div className="d-flex flex-column h-100 justify-content-center">
                  {/* Phase 2 fix (docs/phase-2-core-identity-admin-modules.md):
                      replaced the unbranded template logo images
                      (logo-dark.png / logo-light.png, a "Larkon" shopping-
                      basket mark) with WPA Central Auth branding, matching
                      the icon-badge + title + subtitle style already used in
                      the admin sidebar (see LogoBox.tsx). Uses plain
                      display:flex/none toggling (no Bootstrap utility
                      classes on the toggled elements) so it isn't subject to
                      the `!important` utility conflict fixed in the sidebar
                      logo. */}
                  <div className="auth-logo mb-4">
                    <Link href="/dashboard" className="logo-dark">
                      <span className="auth-logo-icon">
                        <IconifyIcon icon="solar:shield-check-bold-duotone" className="fs-24 text-white" />
                      </span>
                      <span className="auth-logo-text">
                        <span className="auth-logo-title text-white">WPA Central Auth</span>
                        <small className="auth-logo-subtitle text-white-50">Central Identity Platform</small>
                      </span>
                    </Link>
                    <Link href="/dashboard" className="logo-light">
                      <span className="auth-logo-icon">
                        <IconifyIcon icon="solar:shield-check-bold-duotone" className="fs-24 text-primary" />
                      </span>
                      <span className="auth-logo-text">
                        <span className="auth-logo-title text-body">WPA Central Auth</span>
                        <small className="auth-logo-subtitle text-muted">Central Identity Platform</small>
                      </span>
                    </Link>
                  </div>
                  <h2 className="fw-bold fs-24">Sign In</h2>
                  <p className="text-muted mt-1 mb-4">Enter your email address and password to access admin panel.</p>
                  {ssoError && (
                    <Alert variant="warning" className="fs-13">
                      {SSO_ERROR_MESSAGE}
                    </Alert>
                  )}
                  <div className="mb-5">
                    <LoginFrom />
                    <p className="mt-3 fw-semibold no-span">OR sign with</p>
                    <div className="d-grid gap-2">
                      {/* Plain <a>, not next/link's <Link>: this route redirects
                          off-origin (to Central Auth's login page), and the
                          client-side router's RSC-fetch interception isn't
                          appropriate for that - a full browser navigation is
                          required. */}
                      <a href="/api/auth/central-auth/start" className="btn btn-soft-primary">
                        <IconifyIcon icon="solar:shield-check-bold-duotone" className="fs-20 me-1" /> Sign in with WPA Central Auth
                      </a>
                      <Link href="" className="btn btn-soft-dark">
                        <IconifyIcon icon="bxl:google" className="fs-20 me-1" /> Sign in with Google
                      </Link>
                      <Link href="" className="btn btn-soft-primary">
                        <IconifyIcon icon="bxl:facebook" className="fs-20 me-1" /> Sign in with Facebook
                      </Link>
                    </div>
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
  )
}

export default SignIn
