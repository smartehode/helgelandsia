import type { Payload } from 'payload'

const MIN_GROUP_SIZE = 10
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

// Per-kategori cache: naceCategory → { result, ts }
const cache = new Map<string, { result: CategoryStats; ts: number }>()

interface CategoryStats {
  omsetningValues: number[]
  driftsmarginValues: number[]
  groupSize: number
}

// Beregner "topp X%"-plassering: andel av gruppen med verdi HØYERE enn din.
function calcTopPercent(values: number[], myValue: number): number {
  const countAbove = values.filter(v => v > myValue).length
  return ((countAbove + 1) / values.length) * 100
}

// Terskel-mapping: returnerer null for bedrifter under topp 50 %.
function toLabel(pct: number): string | null {
  if (pct <= 5) return 'Topp 5 %'
  if (pct <= 10) return 'Topp 10 %'
  if (pct <= 25) return 'Topp 25 %'
  if (pct <= 50) return 'Topp 50 %'
  return null
}

export interface PercentilResult {
  omsetningLabel: string | null
  driftsmarginLabel: string | null
  // Raw percentil 1–100: lavere = bedre (færre bedrifter har høyere verdi).
  // Sendes til BransjeVis for skala-visualisering uavhengig av badge-terskel.
  omsetningPct: number | null
  driftsmarginPct: number | null
  kategorinavn: string
  groupSize: number
}

async function loadCategoryStats(
  payload: Payload,
  naceCategory: string,
): Promise<CategoryStats | null> {
  const cached = cache.get(naceCategory)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.result

  // Alle bedrifter i kategorien med orgnr
  const bizRes = await payload.find({
    collection: 'businesses',
    where: {
      and: [
        { naceCategory: { equals: naceCategory } },
        { orgnr: { exists: true } },
      ],
    },
    limit: 3000,
    depth: 0,
    overrideAccess: true,
  })

  const orgnrList: string[] = (bizRes.docs as any[])
    .map((b: any) => b.orgnr as string)
    .filter(Boolean)

  if (orgnrList.length < MIN_GROUP_SIZE) return null

  // Alle regnskap for disse orgnrene, nyeste år først
  const regRes = await payload.find({
    collection: 'regnskap' as any,
    where: { orgnr: { in: orgnrList } },
    sort: '-aar',
    limit: 6000,
    overrideAccess: true,
  })

  // Behold kun siste tilgjengelige år per bedrift
  const latestByOrgnr = new Map<string, any>()
  for (const r of regRes.docs as any[]) {
    if (!latestByOrgnr.has(r.orgnr)) {
      latestByOrgnr.set(r.orgnr, r)
    }
  }

  if (latestByOrgnr.size < MIN_GROUP_SIZE) return null

  const omsetningValues = [...latestByOrgnr.values()]
    .map((r: any) => r.omsetning)
    .filter((v): v is number => typeof v === 'number' && v > 0)

  const driftsmarginValues = [...latestByOrgnr.values()]
    .filter((r: any) => typeof r.omsetning === 'number' && r.omsetning > 0 && typeof r.driftsresultat === 'number')
    .map((r: any) => r.driftsresultat / r.omsetning)

  const result: CategoryStats = {
    omsetningValues,
    driftsmarginValues,
    groupSize: latestByOrgnr.size,
  }
  cache.set(naceCategory, { result, ts: Date.now() })
  return result
}

export async function getPercentilerForBusiness(
  payload: Payload,
  orgnr: string,
  naceCategory: string,
  kategorinavn: string,
): Promise<PercentilResult | null> {
  // Hent ett regnskap for denne bedriften
  const myRegRes = await payload.find({
    collection: 'regnskap' as any,
    where: { orgnr: { equals: orgnr } },
    sort: '-aar',
    limit: 1,
    overrideAccess: true,
  })
  const myRegnskap = (myRegRes.docs as any[])[0]
  if (!myRegnskap) return null

  const stats = await loadCategoryStats(payload, naceCategory)
  if (!stats) return null

  let omsetningPct: number | null = null
  let omsetningLabel: string | null = null
  if (
    stats.omsetningValues.length >= MIN_GROUP_SIZE &&
    typeof myRegnskap.omsetning === 'number' &&
    myRegnskap.omsetning > 0
  ) {
    omsetningPct = calcTopPercent(stats.omsetningValues, myRegnskap.omsetning)
    omsetningLabel = toLabel(omsetningPct)
  }

  let driftsmarginPct: number | null = null
  let driftsmarginLabel: string | null = null
  if (
    stats.driftsmarginValues.length >= MIN_GROUP_SIZE &&
    typeof myRegnskap.omsetning === 'number' &&
    myRegnskap.omsetning > 0 &&
    typeof myRegnskap.driftsresultat === 'number'
  ) {
    const myMargin = myRegnskap.driftsresultat / myRegnskap.omsetning
    driftsmarginPct = calcTopPercent(stats.driftsmarginValues, myMargin)
    driftsmarginLabel = toLabel(driftsmarginPct)
  }

  if (omsetningPct == null && driftsmarginPct == null) return null
  return { omsetningLabel, driftsmarginLabel, omsetningPct, driftsmarginPct, kategorinavn, groupSize: stats.groupSize }
}
