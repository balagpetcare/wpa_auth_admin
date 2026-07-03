'use client'

import { useEffect } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import { accountApi } from '@/features/account/api'
import { AccountProfile } from '@/features/account/types'
import adminToast from '@/lib/adminToast'
import { getAdminErrorMessage } from '@/lib/adminErrorMessage'

interface PersonalInfoFormValues {
  fullName: string
  phone: string
  jobTitle: string
  department: string
  bio: string
}

// fullName is optional client-side (matches the backend, which only writes it
// when present) so admins who haven't set a display name yet aren't blocked
// from saving other fields like phone/jobTitle/bio.
const schema = yup.object({
  fullName: yup
    .string()
    .max(80, 'Must be under 80 characters')
    .test('min-if-present', 'Must be at least 2 characters', (v) => !v || v.length >= 2)
    .default(''),
  phone: yup.string().max(30, 'Must be under 30 characters').default(''),
  jobTitle: yup.string().max(100, 'Must be under 100 characters').default(''),
  department: yup.string().max(100, 'Must be under 100 characters').default(''),
  bio: yup.string().max(500, 'Must be under 500 characters').default(''),
})

interface PersonalInfoCardProps {
  account: AccountProfile
  onUpdated: (account: AccountProfile) => void
}

const toFormValues = (account: AccountProfile): PersonalInfoFormValues => ({
  fullName: account.fullName ?? '',
  phone: account.phone ?? '',
  jobTitle: account.jobTitle ?? '',
  department: account.department ?? '',
  bio: account.bio ?? '',
})

const PersonalInfoCard = ({ account, onUpdated }: PersonalInfoCardProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<PersonalInfoFormValues>({
    resolver: yupResolver(schema),
    defaultValues: toFormValues(account),
  })

  useEffect(() => {
    reset(toFormValues(account))
  }, [account, reset])

  const onSubmit = async (values: PersonalInfoFormValues) => {
    try {
      const res = await accountApi.updateMyAccount(values)
      onUpdated(res.account)
      adminToast.success('Profile updated successfully.', 'Your profile changes were saved successfully.')
    } catch (err: any) {
      adminToast.error('Failed to update profile.', getAdminErrorMessage(err, 'Please try again.'))
    }
  }

  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
        <div className="d-flex align-items-center gap-2 mb-1">
          <IconifyIcon icon="solar:user-id-bold-duotone" className="text-primary fs-20" />
          <h5 className="fw-bold text-dark mb-0">Personal Information</h5>
        </div>
        <span className="text-muted fs-12">Update the details shown across the admin panel.</span>
      </Card.Header>
      <Card.Body className="px-4 pb-4 mt-3">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Row>
            <Col md={6}>
              <TextFormInput control={control} name="fullName" label="Full Name" id="fullName" containerClassName="mb-3" placeholder="Enter your full name" />
            </Col>
            <Col md={6}>
              <TextFormInput control={control} name="phone" label="Phone" id="phone" containerClassName="mb-3" placeholder="e.g. +8801XXXXXXXXX" />
            </Col>
            <Col md={6}>
              <TextFormInput control={control} name="jobTitle" label="Job Title" id="jobTitle" containerClassName="mb-3" placeholder="e.g. Platform Administrator" />
            </Col>
            <Col md={6}>
              <TextFormInput control={control} name="department" label="Department" id="department" containerClassName="mb-3" placeholder="e.g. Engineering" />
            </Col>
            <Col md={12}>
              <TextAreaFormInput control={control} name="bio" label="Bio" id="bio" rows={3} containerClassName="mb-3" placeholder="A short professional summary" />
            </Col>
          </Row>
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty} className="d-flex align-items-center gap-2">
              {isSubmitting && <Spinner animation="border" size="sm" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline-secondary" disabled={isSubmitting || !isDirty} onClick={() => reset(toFormValues(account))}>
              Cancel
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}

export default PersonalInfoCard
