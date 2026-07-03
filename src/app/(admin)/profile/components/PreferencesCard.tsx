'use client'

import { useEffect } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { Button, Card, Col, FormCheck, Row, Spinner } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import TextFormInput from '@/components/form/TextFormInput'
import SelectFormInput from '@/components/form/SelectFormInput'
import { accountApi } from '@/features/account/api'
import { AccountProfile } from '@/features/account/types'
import adminToast from '@/lib/adminToast'
import { getAdminErrorMessage } from '@/lib/adminErrorMessage'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'Bengali (বাংলা)' },
]

const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const schema = yup.object({
  language: yup.string().oneOf(['en', 'bn']).default('en'),
  timezone: yup.string().required('Timezone is required'),
  dateFormat: yup.string().oneOf(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
  compactTableMode: yup.boolean().default(false),
})

type PreferencesFormValues = yup.InferType<typeof schema>

const toFormValues = (account: AccountProfile): PreferencesFormValues => {
  const language = account.interfacePreferences.language
  const dateFormat = account.interfacePreferences.dateFormat
  return {
    language: language === 'bn' ? 'bn' : 'en',
    timezone: account.interfacePreferences.timezone,
    dateFormat: dateFormat === 'MM/DD/YYYY' || dateFormat === 'YYYY-MM-DD' ? dateFormat : 'DD/MM/YYYY',
    compactTableMode: account.interfacePreferences.compactTableMode,
  }
}

interface PreferencesCardProps {
  account: AccountProfile
  onUpdated: (account: AccountProfile) => void
}

const PreferencesCard = ({ account, onUpdated }: PreferencesCardProps) => {
  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { isSubmitting, isDirty },
  } = useForm<PreferencesFormValues>({
    resolver: yupResolver(schema),
    defaultValues: toFormValues(account),
  })

  useEffect(() => {
    reset(toFormValues(account))
  }, [account, reset])

  const onSubmit = async (values: PreferencesFormValues) => {
    try {
      const res = await accountApi.updateMyAccount({ interfacePreferences: values })
      onUpdated(res.account)
      adminToast.success('Preferences updated successfully.', 'Your display preferences were saved successfully.')
    } catch (err: any) {
      adminToast.error('Failed to update preferences.', getAdminErrorMessage(err, 'Please try again.'))
    }
  }

  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
        <div className="d-flex align-items-center gap-2 mb-1">
          <IconifyIcon icon="solar:settings-bold-duotone" className="text-primary fs-20" />
          <h5 className="fw-bold text-dark mb-0">Preferences</h5>
        </div>
        <span className="text-muted fs-12">Locale, timezone, and display preferences for this account.</span>
      </Card.Header>
      <Card.Body className="px-4 pb-4 mt-3">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Row>
            <Col md={6}>
              <SelectFormInput control={control} name="language" label="Preferred Language" id="language" containerClassName="mb-3" options={LANGUAGE_OPTIONS} />
            </Col>
            <Col md={6}>
              <TextFormInput control={control} name="timezone" label="Timezone" id="timezone" containerClassName="mb-3" placeholder="e.g. Asia/Dhaka" />
            </Col>
            <Col md={6}>
              <SelectFormInput control={control} name="dateFormat" label="Date Format" id="dateFormat" containerClassName="mb-3" options={DATE_FORMAT_OPTIONS} />
            </Col>
            <Col md={6} className="d-flex align-items-center">
              <FormCheck type="switch" id="compactTableMode" label="Compact table mode" {...register('compactTableMode')} />
            </Col>
          </Row>
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty} className="d-flex align-items-center gap-2">
              {isSubmitting && <Spinner animation="border" size="sm" />}
              Save Preferences
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

export default PreferencesCard
