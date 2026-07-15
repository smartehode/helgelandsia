import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { WidgetVariant } from './PowerPriceWidget'
import { fetchKunngjoringer } from '@/lib/kunngjoringer'

interface Props {
  title?: string
  kommuner?: string[]   // undefined = alle tilgjengelige
  count?: number
  variant?: WidgetVariant
}

const KOMMUNE_CLS: Record<string, string> = {
  Rana:       'bg-sea/15 text-sea',
  Hemnes:     'bg-fjord/15 text-fjord',
  Alstahaug:  'bg-sun/25 text-amber-800',
}

export async function KunngjoringerWidget({
  title = 'Kunngjøringer og høringer',
  kommuner,
  count = 8,
  variant = 'full',
}: Props) {
  const saker = await fetchKunngjoringer(kommuner, count)
  if (!saker.length) return null

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      {/* ─── Topprad ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span className="text-[11px] text-muted">Frister og detaljer hos kommunen</span>
      </div>

      {variant === 'kompakt' ? (
        // ── KOMPAKT: én linje per sak ────────────────────────────
        <ul className="divide-y divide-ink/5 px-3">
          {saker.map((s, i) => (
            <li key={i} className="flex items-center gap-2 py-1.5">
              <span className="shrink-0 tabular-nums text-[11px] text-muted">
                {format(s.dato, 'd. MMM', { locale: nb })}
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${KOMMUNE_CLS[s.kommune] ?? 'bg-fog text-muted'}`}
              >
                {s.kommune}
              </span>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-xs text-ink transition hover:text-sea"
              >
                {s.tittel}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        // ── FULL: dato + kommune-badge + tittel + kilde ──────────
        <ul className="divide-y divide-ink/5">
          {saker.map((s, i) => (
            <li key={i} className="px-4 py-3 transition hover:bg-fog/40">
              <div className="mb-1 flex items-center gap-2">
                <span className="tabular-nums text-xs text-muted">
                  {format(s.dato, 'd. MMMM yyyy', { locale: nb })}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${KOMMUNE_CLS[s.kommune] ?? 'bg-fog text-muted'}`}
                >
                  {s.kommune}
                </span>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-ink transition hover:text-sea"
              >
                {s.tittel} ↗
              </a>
              <p className="mt-0.5 text-[11px] text-muted">{s.kilde}</p>
            </li>
          ))}
        </ul>
      )}

      {/* ─── Bunntekst ───────────────────────────────────────────── */}
      <div className="border-t border-ink/5 px-4 py-2">
        <p className="text-[11px] text-muted">
          Kilder: Rana, Hemnes og Alstahaug kommune · Oppdateres hver time
        </p>
      </div>
    </div>
  )
}
