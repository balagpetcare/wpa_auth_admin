'use client'

import { useEffect, useRef, useState } from 'react'
import { Form, Button, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { publicApi } from '@/lib/apiClient'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import WpaAuthBrandHeader from '@/components/auth/WpaAuthBrandHeader'
import styles from './AcceptInvite.module.scss'

const AcceptInvite = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token'
  const fetchedRef = useRef(false

  const [loading, setLoading] = useState(true
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<{
    email: string
    expiresAt: string
    status: string
    roles: string[]
  } | null>(null

  // Form fields
  const [fullName, setFullName] = useState(''
  const [username, setUsername] = useState(''
  const [password, setPassword] = useState(''
  const [confirmPassword, setConfirmPassword] = useState(''
  const [showPassword, setShowPassword] = useState(false
  const [showConfirmPassword, setShowConfirmPassword] = useState(false
  const [submitting, setSubmitting] = useState(false
  const [success, setSuccess] = useState(false
  const [formError, setFormError] = useState<string | null>(null)

  // Password requirements tracking
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=\[\]{};:'",.<>?\/\\|`~]/.test(password
  }

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token in URL.'
      setErrorCode('INVALID_TOKEN'
      setLoading(false
      return
    }

    if (fetchedRef.current) return
    fetchedRef.current = true

    publicApi.get(`/auth/admin-invitations/verify?token=${encodeURIComponent(token)}`
      .then((res: any) => {
        if (res.success && res.data?.isValid) {
          setInviteData(res.data
        } else {
          const reason = res.data?.reason
          if (reason === 'EXPIRED') {
            setError('This invitation has expired. Please contact your administrator for a new invitation.'
            setErrorCode('EXPIRED'
          } else if (reason === 'ALREADY_USED') {
            setError('This invitation has already been used. Please sign in or contact support if you need help.'
            setErrorCode('ALREADY_USED'
          } else {
            setError('This invitation link is invalid or malformed.'
            setErrorCode('INVALID_TOKEN'
          }
        }
      }
      .catch((err: any) => {
        setError('This invitation link is invalid or malformed.'
        setErrorCode('INVALID_TOKEN'
      }
      .finally(() => {
        setLoading(false
      }
  }, [token]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null

    if (!fullName.trim()) {
      setFormError('Full name is required.'
      return
    }

    if (!username.trim()) {
      setFormError('Username is required.'
      return
    }

    if (!allRequirementsMet) {
      setFormError('Password does not meet all requirements.'
      return
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.'
      return
    }

    setSubmitting(true
    try {
      const res: any = await publicApi.post('/auth/admin-invitations/accept', {
        token,
        fullName,
        username,
        password,
        confirmPassword
      }
      if (res.success) {
        setSuccess(true
      } else {
        setFormError(res.message || 'Failed to complete registration.'
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please try again.'
    } finally {
      setSubmitting(false
    }
  }

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => ()
    <div className={`${styles.requirementItem} ${met ? styles.met : ''}`}>
      <IconifyIcon icon={met ? 'bx:check-circle' : 'bx:circle'} className={styles.icon} />
      <span>{text}</span>
    </div>
  

  const ErrorState = () => {
    const isExpired = errorCode === 'EXPIRED'
    const isAlreadyUsed = errorCode === 'ALREADY_USED'

    return ()
      <div className={styles.card}>
        {/* Header */}
        <WpaAuthBrandHeader variant="card" />

        {/* Content */}
        <div className={styles.cardContent}>
          <div className="text-center">
            <div className={`${styles.errorIconBg} mx-auto mb-4`}>
              <IconifyIcon icon="bx:error-circle" className={styles.errorIcon} />
            </div>
            <h4 className={`${styles.stateTitle} mb-3`}>
              {isExpired
                ? 'Invitation expired'
                : isAlreadyUsed
                  ? 'Invitation already used'
                  : 'Invitation link is invalid'}
            </h4>
            <p className={styles.stateMessage}>{error}</p>
            <Link href="/auth/sign-in" className={`btn ${styles.primaryButton} mt-4`}>
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    
  }

  const LoadingState = () => ()
    <div className={styles.card}>
      <WpaAuthBrandHeader variant="card" />

      <div className={`${styles.cardContent} text-center`}>
        <Spinner animation="border" variant="primary" className="mb-3" />
        <p className="text-muted">Verifying invitation...</p>
      </div>
    </div>
  

  const SuccessState = () => ()
    <div className={styles.card}>
      <WpaAuthBrandHeader variant="card" />

      <div className={`${styles.cardContent} text-center`}>
        <div className={`${styles.successIconBg} mx-auto mb-4`}>
          <IconifyIcon icon="bx:check-circle" className={styles.successIcon} />
        </div>
        <h4 className={`${styles.stateTitle} mb-3`}>Account setup complete</h4>
        <p className={styles.stateMessage}>Your admin account has been created successfully. You can now sign in.</p>
        <Link href="/auth/sign-in" className={`btn ${styles.primaryButton} mt-4`}>
          Go to Sign In
        </Link>
      </div>
    </div>
  

  const SetupForm = () => ()
    <Form onSubmit={handleSubmit}>
      {formError && ()
        <Alert variant="danger" className={`d-flex align-items-start mb-4 ${styles.errorAlert}`}>
          <IconifyIcon icon="bx:error-circle" className={`me-3 mt-1 ${styles.alertIcon}`} />
          <span>{formError}</span>
        </Alert>
      )}

      <Form.Group className="mb-4">
        <Form.Label className={`fw-semibold ${styles.label}`}>Full Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={styles.input}
          required
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className={`fw-semibold ${styles.label}`}>Username</Form.Label>
        <Form.Control
          type="text"
          placeholder="johndoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          required
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className={`fw-semibold ${styles.label}`}>Password</Form.Label>
        <div className={styles.passwordInputWrapper}>
          <Form.Control
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            <IconifyIcon icon={showPassword ? 'bx:hide' : 'bx:show'} />
          </button>
        </div>
      </Form.Group>

      <div className={styles.passwordRequirements}>
        <p className={styles.requirementsTitle}>Password Requirements:</p>
        <PasswordRequirement met={passwordRequirements.minLength} text="At least 8 characters" />
        <PasswordRequirement met={passwordRequirements.hasUpperCase} text="At least one uppercase letter" />
        <PasswordRequirement met={passwordRequirements.hasLowerCase} text="At least one lowercase letter" />
        <PasswordRequirement
          met={passwordRequirements.hasNumberOrSpecial}
          text="At least one number or special character"
        />
      </div>

      <Form.Group className="mb-4">
        <Form.Label className={`fw-semibold ${styles.label}`}>Confirm Password</Form.Label>
        <div className={styles.passwordInputWrapper}>
          <Form.Control
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            aria-pressed={showConfirmPassword}
            title={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            <IconifyIcon icon={showConfirmPassword ? 'bx:hide' : 'bx:show'} />
          </button>
        </div>
        {password && confirmPassword && password === confirmPassword && ()
          <small className={`d-block ${styles.matchIndicator}`}>
            <IconifyIcon icon="bx:check-circle" className="me-1 align-middle" />
            Passwords match
          </small>
        )}
      </Form.Group>

      <Button
        type="submit"
        className={`w-100 fw-semibold ${styles.submitBtn}`}
        disabled={submitting || !allRequirementsMet}
      >
        {submitting ? ()
          <>
            <Spinner size="sm" animation="border" className="me-2" />
            Completing Setup...
          </>
        ) : ()
          'Complete Setup'
        )}
      </Button>

      <p className={styles.securityNote}>
        <IconifyIcon icon="bx:lock" className="me-1" />
        Your information is encrypted and securely protected.
      </p>
    </Form>
  

  if (loading) {
    return ()
      <div className={styles.pageContainer}>
        <LoadingState />
      </div>
    
  }

  if (error) {
    return ()
      <div className={styles.pageContainer}>
        <ErrorState />
      </div>
    
  }

  if (success) {
    return ()
      <div className={styles.pageContainer}>
        <SuccessState />
      </div>
    
  }

  return ()
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        {/* Header */}
        <WpaAuthBrandHeader variant="card" />

        {/* Two-Column Layout */}
        <div className={styles.cardBody}>
          {/* Left Panel */}
          <div className={styles.leftPanel}>
            <h4 className={styles.panelTitle}>Complete your admin account setup</h4>
            <p className={styles.panelText}>
              You have been invited to access the WPA Central Auth admin portal. Create your secure account to continue.
            </p>

            {/* Security Cards */}
            <div className={styles.securityCardsContainer}>
              <div className={styles.securityCard}>
                <IconifyIcon icon="bx:lock" className={styles.securityCardIcon} />
                <p className={styles.securityCardTitle}>Secure & trusted</p>
              </div>
              <div className={styles.securityCard}>
                <IconifyIcon icon="bx:link" className={styles.securityCardIcon} />
                <p className={styles.securityCardTitle}>Single-use invitation link</p>
              </div>
              <div className={styles.securityCard}>
                <IconifyIcon icon="bx:shield" className={styles.securityCardIcon} />
                <p className={styles.securityCardTitle}>Encrypted account setup</p>
              </div>
              <div className={styles.securityCard}>
                <IconifyIcon icon="bx:network-chart" className={styles.securityCardIcon} />
                <p className={styles.securityCardTitle}>Enterprise access control</p>
              </div>
            </div>

            {/* Validity Notice */}
            <div className={styles.validityNotice}>
              <IconifyIcon icon="bx:info-circle" className={styles.noticeIcon} />
              <p className={styles.noticeText}>
                This invitation link may expire or become invalid after it is used. Do not share it with anyone.
              </p>
            </div>
          </div>

          {/* Right Panel */}
          <div className={styles.rightPanel}>
            {/* Invitation Summary */}
            <div className={styles.invitationSummary}>
              <div className={styles.invitationItem}>
                <div className={styles.inviteIcon}>
                  <IconifyIcon icon="bx:envelope" />
                </div>
                <div className={styles.inviteContent}>
                  <span className={styles.inviteLabel}>Invited email</span>
                  <p className={styles.inviteValue}>{inviteData?.email}</p>
                </div>
              </div>

              <div className={styles.invitationDivider} />

              <div className={styles.invitationItem}>
                <span className={styles.inviteLabel}>Assigned role</span>
                <div className={styles.roleBadgesContainer}>
                  {inviteData?.roles?.map((role) => ()
                    <span key={role} className={`badge ${styles.roleBadge}`}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <SetupForm />

            {/* Footer */}
            <div className={styles.cardFooter}>
              <p className={styles.footerText}>Protected by WPA Central Auth</p>
              <p className={styles.footerText}>
                Need help?{' '}
                <Link href="mailto:support@worldpetassociation.org" className={styles.supportLink}>
                  Contact support@worldpetassociation.org
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  
}

export default AcceptInvite
