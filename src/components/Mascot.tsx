import { assetUrl } from '../lib/assetUrl'
import { useTheme } from '../lib/theme'

type MascotProps = {
  className?: string
  /** Circular badge (official black/white discs) vs the transparent mark. */
  badge?: boolean
}

export function Mascot({ className = 'h-10 w-10', badge = false }: MascotProps) {
  const { isDark } = useTheme()
  const src = badge
    ? assetUrl(isDark ? 'brand/cc-mascot-white.svg' : 'brand/cc-mascot-black.svg')
    : assetUrl('brand/cc-mascot-mark.svg')

  return (
    <img
      src={src}
      alt="CC the chinchilla"
      className={className}
      style={{
        imageRendering: 'pixelated',
        filter: !badge && isDark ? 'invert(1)' : undefined,
      }}
    />
  )
}
