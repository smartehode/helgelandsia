import Anthropic from '@anthropic-ai/sdk'

// Ferdigformulerte norske bransjefrasar — modellen slipper å omskrive
// kategorinamnet og unngår dermed feil orddeling (t.d. «transportog»).
const KATEGORI_FRASE: Record<string, string> = {
  'Bygg & håndverk':             'bygg- og håndverksbransjen',
  'Handel & butikk':             'handels- og butikkbransjen',
  'Restaurant & overnatting':    'restaurant- og overnattingsbransjen',
  'Transport & logistikk':       'transport- og logistikkbransjen',
  'Havbruk & fiskeri':           'havbruks- og fiskeribransjen',
  'Landbruk & primær':           'landbruks- og primærnæringen',
  'Industri & produksjon':       'industri- og produksjonsbransjen',
  'Tjenester til næringsliv':    'tjenesteytende næringsliv',
  'Helse & omsorg':              'helse- og omsorgssektoren',
  'Utdanning':                   'utdanningssektoren',
  'Kultur, fritid & reiseliv':   'kultur-, fritids- og reiselivssektoren',
  'Eiendom & finans':            'eiendoms- og finanssektoren',
  'Foreninger & organisasjoner': 'forenings- og organisasjonssektoren',
  'Energi & teknisk':            'energi- og teknikkbransjen',
  'Annet':                       'annen næring',
}

export interface SammendragInput {
  navn: string
  kommune: string | null
  kategori: string | null
  organisasjonsform: string | null
  ansatte: number | null
  regnskapsaar: number
  omsetning: number | null
  driftsresultat: number | null
  aarsresultat: number | null
  egenkapital: number | null
  antallAarMedRegnskap: number
  // Vekst: forrige år brukes kun til å beregne prosentvis endring
  forrigeAarOmsetning?: number | null
  // Aktivitet/formål fra BRREG-registreringen
  aktivitet?: string | null
  formaal?: string | null
  omsetningPercentil?: string | null
  driftsmarginPercentil?: string | null
  antallSammenlignede?: number | null
}

export interface SammendragResult {
  tekst: string
  aar: number
}

function fmtKr(n: number | null | undefined): string {
  if (n == null) return 'ikke oppgitt'
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(n) + ' kr'
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return 'ikke oppgitt'
  return (n * 100).toFixed(1) + ' %'
}

function buildPrompt(input: SammendragInput): string {
  const driftsmargin =
    input.omsetning && input.omsetning > 0 && input.driftsresultat != null
      ? input.driftsresultat / input.omsetning
      : null

  // Vekst i omsetning fra forrige år
  const vekstProsent =
    input.forrigeAarOmsetning &&
    input.forrigeAarOmsetning > 0 &&
    input.omsetning != null &&
    input.omsetning > 0
      ? ((input.omsetning - input.forrigeAarOmsetning) / input.forrigeAarOmsetning) * 100
      : null

  const lines: string[] = [
    `Navn: ${input.navn}`,
    `Kommune: ${input.kommune ?? 'ikke oppgitt'}`,
    `Bransje: ${input.kategori ? (KATEGORI_FRASE[input.kategori] ?? input.kategori) : 'ikke oppgitt'}`,
    `Organisasjonsform: ${input.organisasjonsform ?? 'ikke oppgitt'}`,
    `Antall ansatte (BRREG): ${input.ansatte ?? 'ikke oppgitt'}`,
  ]

  const aktivitetTekst = input.aktivitet || input.formaal
  if (aktivitetTekst) {
    lines.push(`Registrert aktivitet: ${aktivitetTekst}`)
  }

  lines.push(
    `Regnskapsår: ${input.regnskapsaar}`,
    `Omsetning: ${fmtKr(input.omsetning)}`,
  )

  if (vekstProsent != null) {
    const sign = vekstProsent >= 0 ? '+' : ''
    lines.push(`Omsetningsvekst fra ${input.regnskapsaar - 1}: ${sign}${vekstProsent.toFixed(1)} %`)
  }

  lines.push(
    `Driftsresultat: ${fmtKr(input.driftsresultat)}`,
    `Årsresultat: ${fmtKr(input.aarsresultat)}`,
    `Egenkapital: ${fmtKr(input.egenkapital)}`,
    `Driftsmargin: ${fmtPct(driftsmargin)}`,
    `Antall år med regnskap tilgjengelig: ${input.antallAarMedRegnskap}`,
  )

  if (input.omsetningPercentil && input.antallSammenlignede) {
    lines.push(
      `Omsetningsrangering: ${input.omsetningPercentil} blant ${input.antallSammenlignede} bedrifter i bransjen på Helgeland`,
    )
  }
  if (input.driftsmarginPercentil && input.antallSammenlignede) {
    lines.push(
      `Driftsmarginrangering: ${input.driftsmarginPercentil} blant ${input.antallSammenlignede} bedrifter i bransjen på Helgeland`,
    )
  }

  return `Du er en nøytral tekstgenerator for norsk bedriftsinformasjon.

Skriv 3–4 setninger på norsk bokmål om bedriften, KUN basert på tallene under.

Regler:
- Bruk «Registrert aktivitet» til å beskrive hva bedriften driver med — men aldri utover det som står der.
- Beskriv kun det som er oppgitt — aldri spekuler om årsaker, fremtid eller forhold som ikke fremgår av tallene.
- Svake tall (negativt resultat, lav margin) omtales nøytralt og faktabasert, aldri negativt ladet.
- Ingen råd, ingen anbefalinger, ingen vurderinger.
- Nevn rangeringsplassering kun hvis den er oppgitt under Fakta.
- Svar med kun selve teksten — ingen innledning, ingen forklaring.

Fakta:
${lines.join('\n')}`
}

export async function genererSammendrag(
  input: SammendragInput,
): Promise<SammendragResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      temperature: 0.3,
      messages: [{ role: 'user', content: buildPrompt(input) }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') return null
    const tekst = block.text.trim()
    if (!tekst) return null
    return { tekst, aar: input.regnskapsaar }
  } catch (err) {
    console.error('[AI-sammendrag] API-feil:', err)
    return null
  }
}
