import { assetUrl } from '../lib/assetUrl'
import { useTheme } from '../lib/theme'

interface BrandMarkProps {
  size?: 'sm' | 'lg'
  as?: 'div' | 'h1'
  /** Header mode: hide the product name on narrow screens */
  compact?: boolean
  /** Kept for callers; both variants use the official dearCC lockup. */
  variant?: 'field' | 'dearcc'
}

export function BrandMark({
  size = 'sm',
  as: Tag = 'div',
  compact = false,
}: BrandMarkProps) {
  const { isDark } = useTheme()
  const isLg = size === 'lg'
  const wordmark = assetUrl(isDark ? 'brand/dearcc-white-coral.svg' : 'brand/dearcc-black-coral.svg')

  return (
    <Tag
      className={`inline-flex items-center no-underline text-ink ${
        isLg ? 'justify-center' : ''
      }`}
    >
      <img
        src={wordmark}
        alt="dearCC"
        className={isLg ? 'h-8 sm:h-11 w-auto' : 'h-5 sm:h-[22px] w-auto'}
      />
      <span
        className={`${compact ? 'hidden sm:block' : ''} mx-2.5 sm:mx-3 h-[0.85em] w-px shrink-0 bg-ink`}
        aria-hidden
      />
      <span
        className={`${compact ? 'hidden sm:inline' : ''} font-semibold tracking-tight ${
          isLg ? 'text-sm sm:text-base' : 'text-[11.5px] sm:text-sm'
        }`}
      >
        field report
      </span>
    </Tag>
  )
}
