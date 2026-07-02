import Link from 'next/link'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

// UI polish fix (docs/admin-panel-shell-ui-polish.md): the two variants below
// (.logo-dark for light theme, .logo-light for dark theme) are shown/hidden
// via scoped CSS in src/assets/scss/structure/_vertical.scss, not Bootstrap's
// `d-flex` utility — this project has `$enable-important-utilities: true`, so
// `d-flex` compiles to `display: flex !important` and was permanently
// overriding the `display: none` toggle on the hidden variant, causing both
// to render stacked at once (the "duplicated branding" bug). Layout for both
// variants now lives entirely in the scoped `.logo-dark`/`.logo-light` rules.
const LogoBox = () => {
  return (
    <div className="logo-box">
      <Link href="/" className="logo-dark text-decoration-none">
        <span className="logo-icon">
          <IconifyIcon icon="solar:shield-check-bold-duotone" className="fs-22 text-white" />
        </span>
        <span className="logo-text">
          <span className="logo-title text-white">WPA Central Auth</span>
          <small className="logo-subtitle text-white-50">Identity Platform</small>
        </span>
      </Link>
      <Link href="/" className="logo-light text-decoration-none">
        <span className="logo-icon">
          <IconifyIcon icon="solar:shield-check-bold-duotone" className="fs-22 text-primary" />
        </span>
        <span className="logo-text">
          <span className="logo-title text-body">WPA Central Auth</span>
          <small className="logo-subtitle text-muted">Identity Platform</small>
        </span>
      </Link>
    </div>
  )
}

export default LogoBox
