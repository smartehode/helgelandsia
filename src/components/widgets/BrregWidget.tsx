import Link from 'next/link'
import type { WidgetVariant } from './PowerPriceWidget'
import { KOMMUNENUMRE_STR } from '@/lib/helgeland/kommuner'

interface Props {
  title?: string
  count?: number
  variant?: WidgetVariant
}

interface Enhet {
  navn: string
  organisasjonsnummer: string
  forretningsadresse?: { kommune?: string }
  registreringsdatoEnhetsregisteret?: string
  organisasjonsform?: { beskrivelse?: string }
}

// Hentes fra src/lib/helgeland/kommuner.ts — énkildes sannhet.
const KOMMUNENUMMER = KOMMUNENUMRE_STR

function fmtDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function titleCase(s?: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

async function fetchEnheter(count: number): Promise<Enhet[]> {
  const url =
    `https://data.brreg.no/enhetsregisteret/api/enheter` +
    `?size=${count}&kommunenummer=${KOMMUNENUMMER}&sort=registreringsdatoEnhetsregisteret,desc`
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 21600 },
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data._embedded?.enheter ?? []
  } catch {
    return []
  }
}

export async function BrregWidget({ title, count = 5, variant = 'full' }: Props) {
  const enheter = await fetchEnheter(count)
  const heading = title ?? 'Nyregistrerte bedrifter på Helgeland'

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <h2 className="font-serif text-xl font-semibold text-fjord">{heading}</h2>

      {enheter.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Kunne ikke hente data fra Brønnøysundregistrene.</p>
      ) : (
        <div className="mt-4 divide-y divide-ink/5">
          {enheter.map(e => (
            <div key={e.organisasjonsnummer} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`https://virksomhet.brreg.no/nb/oppslag/enheter/${e.organisasjonsnummer}`}
                target="_blank" rel="noopener"
                className="font-medium text-ink leading-snug hover:text-sea"
              >
                {e.navn}
              </Link>
              {variant === 'full' && (
                <p className="mt-0.5 text-xs text-muted">
                  {[
                    titleCase(e.forretningsadresse?.kommune),
                    e.organisasjonsform?.beskrivelse,
                    fmtDate(e.registreringsdatoEnhetsregisteret),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {variant === 'kompakt' && (
                <p className="mt-0.5 text-xs text-muted">
                  {titleCase(e.forretningsadresse?.kommune)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted">Kilde: Brønnøysundregistrene</p>
    </div>
  )
}
