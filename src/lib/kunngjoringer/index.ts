import type { Kunngjoring } from './types'
import { fetchRana } from './rana'
import { fetchHemnes } from './hemnes'
import { fetchAlstahaug } from './alstahaug'

export type { Kunngjoring } from './types'

// Brønnøy utelatt i v1: ArtikkelRSS.ashx returnerer 404 (RSS ikke aktivert på Sør-Helgeland-instansen).

const FETCHERS: Record<string, () => Promise<Kunngjoring[]>> = {
  rana:       fetchRana,
  hemnes:     fetchHemnes,
  alstahaug:  fetchAlstahaug,
}

export const TILGJENGELIGE_KOMMUNER = Object.keys(FETCHERS)

/**
 * Henter kunngjøringer fra valgte kommuner (default alle).
 * Promise.allSettled — én død kilde tar aldri ned widgeten.
 * Returnerer saker sortert nyest først, begrenset til `count`.
 */
export async function fetchKunngjoringer(
  kommuner?: string[],
  count = 8,
): Promise<Kunngjoring[]> {
  const toFetch = kommuner?.length
    ? kommuner.filter(k => FETCHERS[k])
    : TILGJENGELIGE_KOMMUNER

  const settled = await Promise.allSettled(toFetch.map(k => FETCHERS[k]()))

  const all: Kunngjoring[] = settled.flatMap(r =>
    r.status === 'fulfilled' ? r.value : [],
  )

  all.sort((a, b) => b.dato.getTime() - a.dato.getTime())

  return all.slice(0, count)
}
