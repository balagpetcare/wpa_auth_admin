'use client'
import TextFormInput from '@/components/form/TextFormInput'
import Link from 'next/link'
import { Alert, Button, FormCheck } from 'react-bootstrap'
import useSignIn from './useSignIn'
import PasswordFormInput from '@/components/form/PasswordFormInput'

const LoginFrom = () => {
  const { loading, login, control, authError, localError, resetAuthSession } = useSignIn()
  const authIssue = authError || localError
  return (
    <form className="authentication-form" onSubmit={login}>
      {authIssue && (
        <Alert variant="warning" className="mb-3">
          <div className="d-flex flex-column gap-2">
            <span>{authIssue}</span>
            <Button variant="outline-secondary" size="sm" onClick={resetAuthSession} className="align-self-start">
              Reset Auth Session
            </Button>
          </div>
        </Alert>
      )}
      <TextFormInput control={control} name="emailOrUsername" containerClassName="mb-3" label="Email or Username" id="email-or-username-id" placeholder="Enter your email or username" />

      <PasswordFormInput
        control={control}
        name="password"
        containerClassName="mb-3"
        placeholder="Enter your password"
        id="password-id"
        label={
          <>
            <Link href="/auth/reset-pass" className="float-end text-muted text-unline-dashed ms-1">
              Reset password
            </Link>
            <label className="form-label" htmlFor="example-password">
              Password
            </label>
          </>
        }
      />
      <div className="mb-3">
        <FormCheck label="Remember me" id="sign-in" />
      </div>
      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          Sign In
        </Button>
      </div>
    </form>
  )
}

export default LoginFrom
