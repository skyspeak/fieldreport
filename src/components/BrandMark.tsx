interface BrandMarkProps {
  size?: 'sm' | 'lg'
  as?: 'div' | 'h1'
  /** Header mode: shorter label on narrow screens */
  compact?: boolean
  /** Live Field Report mark vs dear[CC] (v3). */
  variant?: 'field' | 'dearcc'
}

export function BrandMark({
  size = 'sm',
  as: Tag = 'div',
  compact = false,
  variant = 'field',
}: BrandMarkProps) {
  const isLg = size === 'lg'

  if (variant === 'dearcc') {
    const logoClass = isLg ? 'h-9 w-9 sm:h-16 sm:w-16' : 'h-7 w-7 shrink-0'
    return (
      <Tag
        className={`inline-flex items-center gap-2 sm:gap-3 font-serif font-medium tracking-tight text-ink ${
          isLg
            ? 'text-[1.65rem] leading-tight sm:text-7xl justify-center flex-wrap text-balance'
            : compact
              ? 'text-base sm:text-xl'
              : 'text-lg sm:text-xl'
        }`}
      >
        <img
          src={`${import.meta.env.BASE_URL}chinchilla.png`}
          alt=""
          aria-hidden="true"
          className={`${logoClass} shrink-0 rounded-sm [image-rendering:pixelated]`}
        />
        <span className={isLg ? 'min-w-0' : 'min-w-0 truncate sm:overflow-visible sm:whitespace-normal'}>
          <span>dear</span>
          <span className="text-primary">[</span>
          <span className="text-primary">CC</span>
          <span className="text-primary">]</span>
          {compact ? (
            <span className="hidden sm:inline"> Field report</span>
          ) : (
            <span> Field report</span>
          )}
        </span>
      </Tag>
    )
  }

  if (isLg) {
    return (
      <Tag className="font-serif text-4xl sm:text-7xl font-light tracking-tight text-ink mb-2 text-balance">
        <span className="text-muted font-light mr-2">[</span>
        Field{' '}
        <span className="text-primary font-semibold italic">Report</span>
        <span className="text-muted font-light ml-2">]</span>
      </Tag>
    )
  }

  return (
    <Tag className="flex items-baseline gap-2 no-underline font-serif">
      <span className="text-muted text-lg font-light">[</span>
      <span className="text-lg font-light tracking-tight text-ink">Field</span>
      <span className="text-lg font-semibold tracking-tight text-primary">Report</span>
      <span className="text-muted text-lg font-light">]</span>
    </Tag>
  )
}
