import Link from 'next/link'

export default function LogoBox() {
  return (
    <div className="logo-box">
      <Link href="/dashboard" className="logo-dark wpa-logo">
        <span className="wpa-logo-mark">W</span>
        <span className="wpa-logo-copy">
          <span className="wpa-logo-title">WPA Central Auth</span>
          <span className="wpa-logo-subtitle">World Pet Association</span>
        </span>
      </Link>
    </div>
  )
}
