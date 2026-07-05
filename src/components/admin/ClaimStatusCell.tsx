'use client'

const STYLE: Record<string, React.CSSProperties> = {
  pending: {
    display: 'inline-block',
    padding: '0.1rem 0.5rem',
    borderRadius: '1rem',
    background: '#fef3c7',
    color: '#92400e',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  verified: {
    display: 'inline-block',
    padding: '0.1rem 0.5rem',
    borderRadius: '1rem',
    background: '#d1fae5',
    color: '#065f46',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
}

const LABEL: Record<string, string> = {
  unclaimed: 'Ukrevd',
  pending: 'Venter',
  verified: 'Verifisert',
}

export default function ClaimStatusCell({ cellData }: { cellData?: string }) {
  const key = cellData ?? ''
  const style = STYLE[key]
  const label = LABEL[key] ?? key ?? '–'
  return style ? <span style={style}>{label}</span> : <>{label}</>
}
