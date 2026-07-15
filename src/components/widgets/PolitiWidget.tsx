import type { WidgetVariant } from './PowerPriceWidget'
import { KOMMUNENAVN_LC } from '@/lib/helgeland/kommuner'
import { PolitiList } from './PolitiList'
import type { PoliceMsg, PoliceThread } from './PolitiList'

interface Props {
  title?: string
  count?: number
  variant?: WidgetVariant
}

export async function PolitiWidget({
  title = 'Politiloggen Helgeland',
  count = 5,
  variant = 'full',
}: Props) {
  let threads: PoliceThread[] = []

  try {
    const res = await fetch(
      'https://api.politiloggen.politiet.no/messages?Districts=Nordland&Take=50',
      {
        headers: { 'User-Agent': 'helgelandsia.no' },
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { messages: PoliceMsg[] }

    // Grupper alle Helgeland-meldinger per threadId.
    // API leverer nyeste meldinger først — msgs[0] = siste oppdatering per tråd.
    const threadMap = new Map<string, PoliceMsg[]>()
    for (const msg of data.messages ?? []) {
      if (!KOMMUNENAVN_LC.has(msg.municipality?.toLowerCase() ?? '')) continue
      const arr = threadMap.get(msg.threadId) ?? []
      arr.push(msg)
      threadMap.set(msg.threadId, arr)
    }

    // Bygg PoliceThread-objekter — én per sak, begrenset til count
    for (const [threadId, msgs] of threadMap.entries()) {
      const latest = msgs[0]
      threads.push({
        id: threadId,
        category: latest.category,
        municipality: latest.municipality,
        area: latest.area,
        isActive: latest.isActive,
        latest,
        history: msgs.slice(1).reverse(), // eldre meldinger, eldst først
      })
      if (threads.length >= count) break
    }
  } catch {
    return null
  }

  if (!threads.length) return null

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <a
          href="https://www.politiet.no/politiloggen"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted transition hover:text-sea"
        >
          Kilde: Politiet (NLOD 2.0) ↗
        </a>
      </div>
      <PolitiList threads={threads} variant={variant ?? 'full'} />
    </div>
  )
}
