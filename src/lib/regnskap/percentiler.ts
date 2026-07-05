import type { Payload } from 'payload'

const MIN_GROUP_SIZE = 10

// Beregner "topp X%"-plassering: andel av gruppen med verdi HØYERE enn din.
// Eks.: 3 av 100 bedrifter har høyere omsetning → du er i topp 4% (rank 4/100).
function calcTopPercent(values: number[], myValue: number): number {
  const countAbove = values.filter(v => v > myValue).length
  return ((countAbove + 1) / values.length) * 100
}

// Runder ned til nærmeste terskel for visning. Returnerer null over 25 %.
// Designprinsipp: kun klart positive plasseringer vises — topp 25% er ærlig og eksklusivt.
function toLabel(pct: number): string | null {
  if (pct <= 5) return 'Topp 5 %'
  if (pct <= 10) return 'Topp 10 %'
  if (pct <= 25) return 'Topp 25 %'
  return null
}

export interface PercentilResult {
  omsetningLabel: string | null
  driftsmarginLabel: string | null
  kategorinavn: string
}

export async function getPercentilerForBusiness(
  payload: Payload,
  orgnr: string,
  naceCategory: string,
  kategorinavn: string,
): Promise<PercentilResult | null> {
  // 1. Alle bedrifter i denne kategorien med orgnr
  const bizRes = await payload.find({
    collection: 'businesses',
    where: {
      and: [
        { naceCategory: { equals: naceCategory } },
        { orgnr: { exists: true } },
      ],
    },
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  })

  const orgnrList: string[] = (bizRes.docs as any[])
    .map((b: any) => b.orgnr as string)
    .filter(Boolean)

  if (orgnrList.length < MIN_GROUP_SIZE) return null

  // 2. Alle regnskap for disse orgnrene, sortert nyeste år først
  const regRes = await payload.find({
    collection: 'regnskap' as any,
    where: { orgnr: { in: orgnrList } },
    sort: '-aar',
    limit: 5000,
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

  const myRegnskap = latestByOrgnr.get(orgnr)
  if (!myRegnskap) return null

  // --- Omsetnings-percentil ---
  const omsetningValues = [...latestByOrgnr.values()]
    .map((r: any) => r.omsetning)
    .filter((v): v is number => typeof v === 'number' && v > 0)

  let omsetningLabel: string | null = null
  if (
    omsetningValues.length >= MIN_GROUP_SIZE &&
    typeof myRegnskap.omsetning === 'number' &&
    myRegnskap.omsetning > 0
  ) {
    omsetningLabel = toLabel(calcTopPercent(omsetningValues, myRegnskap.omsetning))
  }

  // --- Driftsmargin-percentil (kun der omsetning > 0) ---
  const driftsmarginValues = [...latestByOrgnr.values()]
    .filter((r: any) => typeof r.omsetning === 'number' && r.omsetning > 0 && typeof r.driftsresultat === 'number')
    .map((r: any) => r.driftsresultat / r.omsetning)

  let driftsmarginLabel: string | null = null
  if (
    driftsmarginValues.length >= MIN_GROUP_SIZE &&
    typeof myRegnskap.omsetning === 'number' &&
    myRegnskap.omsetning > 0 &&
    typeof myRegnskap.driftsresultat === 'number'
  ) {
    const myMargin = myRegnskap.driftsresultat / myRegnskap.omsetning
    driftsmarginLabel = toLabel(calcTopPercent(driftsmarginValues, myMargin))
  }

  if (!omsetningLabel && !driftsmarginLabel) return null
  return { omsetningLabel, driftsmarginLabel, kategorinavn }
}
