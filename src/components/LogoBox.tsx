import Link from 'next/link'
import Image from 'next/image'
import logoWhite from '@/assets/images/300-80-white.png'
import logoDark from '@/assets/images/300-80-dark.png'
import logoSm from '@/assets/images/logo-sm.jpg'

const LogoBox = () => {
  return (
    <div className="logo-box">
      <Link href="/" className="logo-full logo-full-dark text-decoration-none" aria-label="WPA Central Auth">
        <span className="logo-image-wrap logo-full-wrap">
          <Image
            src={logoWhite}
            alt="WPA Central Auth"
            width={150}
            height={40}
            priority
            className="logo-image logo-full-image"
          />
        </span>
      </Link>
      <Link href="/" className="logo-full logo-full-light text-decoration-none" aria-label="WPA Central Auth">
        <span className="logo-image-wrap logo-full-wrap">
          <Image
            src={logoDark}
            alt="WPA Central Auth"
            width={150}
            height={40}
            priority
            className="logo-image logo-full-image"
          />
        </span>
      </Link>
      <Link href="/" className="logo-sm text-decoration-none" aria-label="WPA Central Auth">
        <span className="logo-image-wrap logo-sm-wrap">
          <Image
            src={logoSm}
            alt="WPA Central Auth"
            width={40}
            height={40}
            priority
            className="logo-image logo-sm-image"
          />
        </span>
      </Link>
    </div>
  )
}

export default LogoBox
