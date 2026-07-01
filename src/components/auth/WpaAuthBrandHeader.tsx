'use client'

import Image from 'next/image'
import logoDark from '@/assets/images/logo-dark.png'
import styles from './WpaAuthBrandHeader.module.scss'

interface WpaAuthBrandHeaderProps {
  variant?: 'default' | 'card'
}

/**
 * Reusable WPA Central Auth brand header for public auth pages.
 * Renders a single, clean WPA logo with product branding.
 * Prevents duplicate logo rendering across all public auth pages.
 */
const WpaAuthBrandHeader = ({ variant = 'default' }: WpaAuthBrandHeaderProps) => {
  return ()
    <header className={`${styles.brandHeader} ${variant === 'card' ? styles.cardVariant : ''}`}>
      <div className={styles.brandContainer}>
        <div className={styles.logoSection}>
          <Image
            src={logoDark}
            height={40}
            alt="World Pet Association"
            className={styles.logo}
            priority
          />
        </div>

        <div className={styles.productSection}>
          <h1 className={styles.productName}>WPA Central Auth</h1>
          <p className={styles.productSubtitle}>Enterprise Identity Portal</p>
        </div>
      </div>
    </header>
  
}

export default WpaAuthBrandHeader
