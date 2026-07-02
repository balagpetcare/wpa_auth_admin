'use client'

import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { Button, Card, Spinner } from 'react-bootstrap'
import { toast } from 'react-toastify'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PasswordFormInput from '@/components/form/PasswordFormInput'
import { accountApi } from '@/features/account/api'
import { ChangePasswordPayload } from '@/features/account/types'

interface ChangePasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const schema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your new password'),
})

interface ChangePasswordCardProps {
  lastPasswordChangedAt?: string | null
}

const ChangePasswordCard = ({ lastPasswordChangedAt }: ChangePasswordCardProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ChangePasswordFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      const payload: ChangePasswordPayload = values
      await accountApi.changeMyPassword(payload)
      toast.success('Password changed successfully. Other active sessions have been signed out.')
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password.')
    }
  }

  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
        <div className="d-flex align-items-center gap-2 mb-1">
          <IconifyIcon icon="solar:lock-password-bold-duotone" className="text-primary fs-20" />
          <h5 className="fw-bold text-dark mb-0">Change Password</h5>
        </div>
        <span className="text-muted fs-12">
          {lastPasswordChangedAt
            ? `Last changed on ${new Date(lastPasswordChangedAt).toLocaleString()}`
            : 'Password has not been changed since account creation.'}
        </span>
      </Card.Header>
      <Card.Body className="px-4 pb-4 mt-3">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <PasswordFormInput
            control={control}
            name="currentPassword"
            label="Current Password"
            id="currentPassword"
            containerClassName="mb-3"
            placeholder="Enter current password"
          />
          <PasswordFormInput
            control={control}
            name="newPassword"
            label="New Password"
            id="newPassword"
            containerClassName="mb-3"
            placeholder="At least 8 characters"
          />
          <PasswordFormInput
            control={control}
            name="confirmPassword"
            label="Confirm New Password"
            id="confirmPassword"
            containerClassName="mb-3"
            placeholder="Re-enter new password"
          />
          <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty} className="d-flex align-items-center gap-2">
            {isSubmitting && <Spinner animation="border" size="sm" />}
            Change Password
          </Button>
        </form>
      </Card.Body>
    </Card>
  )
}

export default ChangePasswordCard
