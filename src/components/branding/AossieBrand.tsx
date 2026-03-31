export const AOSSIE_LOGO_SRC = '/branding/aossie-logo.png'

export interface AossieLogoMarkProps {
  height?: number
  maxWidth?: number
  square?: boolean
}

export function AossieLogoMark({ height = 56, maxWidth = 220, square = false }: AossieLogoMarkProps) {
  const compact = !square && maxWidth <= 52 && height <= 50
  const fixedSide = square ? height : compact ? maxWidth : undefined
  return (
    <div
      style={{
        height,
        width: fixedSide ?? 'auto',
        maxWidth: square ? height : maxWidth,
        borderRadius: compact ? 10 : square ? 14 : 12,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '3px 4px' : square ? '5px 6px' : '6px 10px',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <img
        src={AOSSIE_LOGO_SRC}
        alt="AOSSIE — Australian Open Source Software Innovation and Education"
        style={{
          maxHeight: '100%',
          maxWidth: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          objectPosition: square ? 'left center' : 'center',
          display: 'block',
        }}
      />
    </div>
  )
}

export function AossieWordmark({ large, subtitle = true }: { large?: boolean; subtitle?: boolean }) {
  const letters: { ch: string; color: string }[] = [
    { ch: 'A', color: 'var(--aossie-yellow)' },
    { ch: 'O', color: 'var(--aossie-green)' },
    { ch: 'S', color: 'var(--aossie-green)' },
    { ch: 'S', color: 'var(--aossie-green)' },
    { ch: 'I', color: 'var(--aossie-yellow)' },
    { ch: 'E', color: 'var(--aossie-yellow)' },
  ]
  return (
    <div>
      <div
        style={{
          fontSize: large ? 'clamp(1.25rem, 3vw, 1.55rem)' : '1.02rem',
          fontWeight: 800,
          letterSpacing: '0.02em',
          lineHeight: 1.05,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {letters.map(({ ch, color }, i) => (
          <span key={`${ch}-${i}`} style={{ color }}>
            {ch}
          </span>
        ))}
      </div>
      {subtitle ? (
        <div
          style={{
            fontSize: large ? '0.58rem' : '0.58rem',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            marginTop: 5,
            fontWeight: 600,
            lineHeight: 1.35,
            maxWidth: '28rem',
          }}
        >
          AUSTRALIAN OPEN SOURCE SOFTWARE INNOVATION AND EDUCATION
        </div>
      ) : null}
    </div>
  )
}
