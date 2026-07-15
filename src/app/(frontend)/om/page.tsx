import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Om Helgelandsia',
  description:
    'Helgelandsia samler alt som skjer på Helgeland på ett sted: bedrifter, stillinger, anbud, arrangementer, høringer, fergetider og lokale nyheter — fra 18 kommuner, oppdatert hver dag.',
}

export default async function OmPage() {
  const payload = await getPayloadClient()
  const { totalDocs } = await payload.find({
    collection: 'businesses',
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })
  // Avrund ned til nærmeste tusen for "over X bedrifter"-formulering
  const bedriftsTusen = Math.floor(totalDocs / 1000) * 1000
  const bedriftsAntall = new Intl.NumberFormat('nb-NO').format(bedriftsTusen)

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">

      {/* ── Innledning ─────────────────────────────────────────────── */}
      <h1 className="font-serif text-4xl font-bold text-fjord sm:text-5xl">
        Alt om Helgeland, samlet på ett sted
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-ink/80">
        Helgeland er en stor region med små avstander mellom folk — men informasjonen
        om regionen ligger spredt på titalls nettsteder: kommunesider, registre,
        ruteplanleggere, nyhetskilder. Helgelandsia samler den.
      </p>

      {/* ── Hva du finner ─────────────────────────────────────────── */}
      <p className="mt-8 leading-relaxed text-ink/70">
        Her finner du næringslivet på Helgeland — over {bedriftsAntall} bedrifter fra
        alle de 18 kommunene, med nøkkeltall fra offentlige registre og oppdatert
        informasjon fra bedriftene selv. Du finner offentlige anbud som passer lokale
        leverandører, ledige stillinger, arrangementer, kommunale høringer og
        kunngjøringer — mye av det lagt inn av folk og bedrifter i regionen selv. Og
        de praktiske tingene i hverdagen: fergetider, flytrafikk, strømpris, vær,
        webkameraer og politiloggen.
      </p>

      {/* ── To målgrupper ─────────────────────────────────────────── */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-ink/10 bg-white p-6">
          <h2 className="font-serif text-xl font-semibold text-fjord">
            For deg som bor her
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            Helgelandsia er stedet å sjekke hva som skjer — i dag, i din kommune.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            Portalen er selvbetjent: med en gratis brukerkonto kan du selv legge ut
            arrangementer, ledige stillinger, pressemeldinger og artikler — og melde
            inn bedriften din. Alt du sender inn kvalitetssikres av redaksjonen før
            publisering, og du følger statusen fra Min side.
          </p>
          <Link
            href="/min-side"
            className="mt-5 inline-block rounded-lg bg-fjord px-4 py-2 text-sm font-medium text-white transition hover:bg-fjord/90"
          >
            Gå til Min side
          </Link>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-6">
          <h2 className="font-serif text-xl font-semibold text-fjord">
            For deg som driver bedrift
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            Stedet kundene finner deg. Ta over bedriftsoppføringen din gratis, legg
            til logo, beskrivelse og kontaktinfo — og se hvilke offentlige anbud som
            passer din bransje.
          </p>
          <Link
            href="/bedrifter"
            className="mt-5 inline-block rounded-lg bg-fjord px-4 py-2 text-sm font-medium text-white transition hover:bg-fjord/90"
          >
            Finn din bedrift
          </Link>
        </div>
      </div>

      {/* ── Datakilder ────────────────────────────────────────────── */}
      <p className="mt-14 text-sm leading-relaxed text-muted">
        Helgelandsia bygger på åpne, offentlige datakilder — Brønnøysundregistrene,
        Doffin, Entur, Kystverket, Politiet, SSB med flere — alltid med
        kildeangivelse, og oppdatert automatisk hver dag. Portalen drives lokalt,
        fra Helgeland, for Helgeland.
      </p>

    </main>
  )
}
