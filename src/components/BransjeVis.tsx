// Bransjesammenligning — horisontale skalalinjer med prikk etter percentil.
// Ingen 'use client' — ren presentasjonskomponent.

export interface ScaleItem {
  label: string
  pct: number  // 1–100: lavere = bedre (færre bedrifter har høyere verdi)
}

interface BransjeVisProps {
  kategorinavn: string
  groupSize: number
  items: ScaleItem[]
}

function toScaleLabel(pct: number): string {
  if (pct <= 5) return 'Topp 5 %'
  if (pct <= 10) return 'Topp 10 %'
  if (pct <= 25) return 'Topp 25 %'
  if (pct <= 50) return 'Over snittet'
  return 'Under snittet'
}

function ScaleRow({ label, pct }: ScaleItem) {
  // Klem til 3–97 % for å unngå at prikken klipper mot kanten
  const pos = Math.max(3, Math.min(97, 100 - pct))
  const isGood = pct <= 50

  const dotColor = pct <= 25 ? '#0C2733' : isGood ? '#3f93a6' : '#8a9fa6'
  const fillColor = isGood ? 'rgba(63,147,166,0.22)' : 'rgba(0,0,0,0.05)'

  return (
    <div className="grid items-center gap-3" style={{ gridTemplateColumns: '90px 1fr 102px' }}>
      <span className="text-xs text-muted">{label}</span>

      {/* Skalabar */}
      <div className="relative h-2 rounded-full bg-ink/10">
        {/* Fylling fra venstre til prikken */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pos}%`, backgroundColor: fillColor }}
        />
        {/* Prikk */}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
          style={{ left: `${pos}%`, backgroundColor: dotColor }}
        />
        {/* Median-merke (50 % fra venstre) */}
        <div
          className="absolute top-0 h-full w-px bg-ink/20"
          style={{ left: '50%' }}
          aria-hidden="true"
        />
      </div>

      {/* Etikettekst */}
      <span
        className="text-right text-xs font-medium"
        style={{ color: isGood ? '#3f93a6' : '#8a9fa6' }}
      >
        {toScaleLabel(pct)}
      </span>
    </div>
  )
}

export function BransjeVis({ kategorinavn, groupSize, items }: BransjeVisProps) {
  if (items.length === 0) return null
  return (
    <div className="mt-4 border-t border-ink/10 pt-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-eyebrow text-muted">
        Sammenlignet med bransjen
      </p>
      <p className="mb-4 text-[11px] text-muted">
        {kategorinavn} · {groupSize} bedrifter på Helgeland
        <span className="ml-2 text-muted/60">◀ Lavest · Median · Høyest ▶</span>
      </p>
      <div className="space-y-4">
        {items.map(item => (
          <ScaleRow key={item.label} {...item} />
        ))}
      </div>
    </div>
  )
}
