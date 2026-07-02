'use client'

import { Card, ProgressBar } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { AccountProfile } from '@/features/account/types'

interface ChecklistItem {
  label: string
  done: boolean
}

const buildChecklist = (account: AccountProfile): ChecklistItem[] => [
  { label: 'Full name', done: Boolean(account.fullName?.trim()) },
  { label: 'Phone number', done: Boolean(account.phone?.trim()) },
  { label: 'Job title or department', done: Boolean(account.jobTitle?.trim() || account.department?.trim()) },
  { label: 'Bio', done: Boolean(account.bio?.trim()) },
  { label: 'Profile photo', done: Boolean(account.avatarUrl) },
  { label: 'Timezone preference', done: Boolean(account.interfacePreferences?.timezone) },
]

const ProfileCompletionCard = ({ account }: { account: AccountProfile }) => {
  const checklist = buildChecklist(account)
  const completed = checklist.filter((i) => i.done).length
  const percent = Math.round((completed / checklist.length) * 100)
  const missing = checklist.filter((i) => !i.done)

  return (
    <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '10px' }}>
      <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
        <div className="d-flex align-items-center gap-2 mb-1">
          <IconifyIcon icon="solar:checklist-minimalistic-bold-duotone" className="text-primary fs-20" />
          <h5 className="fw-bold text-dark mb-0">Profile Completion</h5>
        </div>
        <span className="text-muted fs-12">Keep your admin profile up to date and complete.</span>
      </Card.Header>
      <Card.Body className="px-4 pb-4 mt-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="fw-semibold text-dark fs-14">{percent}% complete</span>
        </div>
        <ProgressBar now={percent} variant={percent === 100 ? 'success' : 'primary'} className="mb-3" style={{ height: 8 }} />
        {missing.length > 0 ? (
          <div className="d-flex flex-column gap-1">
            {missing.map((item) => (
              <span key={item.label} className="fs-13 text-muted">
                <IconifyIcon icon="solar:close-circle-bold" className="text-warning align-middle me-1" />
                {item.label}
              </span>
            ))}
          </div>
        ) : (
          <span className="fs-13 text-success">
            <IconifyIcon icon="solar:check-circle-bold" className="align-middle me-1" />
            Your profile is fully complete.
          </span>
        )}
      </Card.Body>
    </Card>
  )
}

export default ProfileCompletionCard
