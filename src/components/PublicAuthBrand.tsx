import IconifyIcon from '@/components/wrappers/IconifyIcon'

// Phase 2.5 (docs/phase-2-5-public-auth-rs256-oidc.md): shared branding
// header for all public-facing pages (end-user sign-in/register/password
// reset/verify-email, and the OAuth consent screen) — same icon-badge +
// title + subtitle pattern already used in the sidebar (LogoBox.tsx) and
// the admin sign-in page, kept in one place so all public pages stay
// visually consistent without duplicating markup five times.
const PublicAuthBrand = () => {
  return (
    <div className="mb-4 d-flex align-items-center gap-2 justify-content-center">
      <span
        className="d-inline-flex align-items-center justify-content-center rounded"
        style={{ width: 40, height: 40, background: 'rgba(var(--bs-primary-rgb), 0.15)' }}
      >
        <IconifyIcon icon="solar:shield-check-bold-duotone" className="fs-24 text-primary" />
      </span>
      <div className="d-flex flex-column lh-1">
        <span className="fw-bold fs-18">WPA Central Auth</span>
        <small className="text-muted fw-semibold">Central Identity Platform</small>
      </div>
    </div>
  )
}

export default PublicAuthBrand
