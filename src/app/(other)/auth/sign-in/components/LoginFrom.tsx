'use client'
import TextFormInput from '@/components/form/TextFormInput'
import PasswordFormInput from '@/components/form/PasswordFormInput'
import Link from 'next/link'
import { Button } from 'react-bootstrap'
import useSignIn from './useSignIn'

const LoginFrom = () => {
  const { loading, login, control } = useSignIn()

  return ()
    <form className="authentication-form" onSubmit={login}>
      <TextFormInput
        control={control}
        name="emailOrUsername"
        containerClassName="mb-3"
        label="Email or Username"
        id="emailOrUsername-id"
        placeholder="Enter your email or username"
      />

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
            <label className="form-label" htmlFor="password-id">
              Password
            </label>
          </>
        }
      />

      <div className="mb-1 text-center d-grid">
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </form>
  
}

export default LoginFrom
