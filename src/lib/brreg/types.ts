// BRREG Enhetsregisteret API v2 — typer

export interface BrregOrganisasjonsform {
  kode: string
  beskrivelse: string
}

export interface BrregNaeringskode {
  kode: string
  beskrivelse: string
}

export interface BrregAdresse {
  land?: string
  landkode?: string
  postnummer?: string
  poststed?: string
  adresse?: string[]
  kommune?: string
  kommunenummer?: string
}

export interface BrregEnhet {
  organisasjonsnummer: string
  navn: string
  organisasjonsform?: BrregOrganisasjonsform
  naeringskode1?: BrregNaeringskode
  naeringskode2?: BrregNaeringskode
  antallAnsatte?: number
  forretningsadresse?: BrregAdresse
  postadresse?: BrregAdresse
  registreringsdatoEnhetsregisteret?: string
  stiftelsesdato?: string
  slettedato?: string
  konkurs?: boolean
  underAvvikling?: boolean
  underTvangsavviklingEllerTvangsopplosning?: boolean
  aktivitet?: string[]
  hjemmeside?: string
  registrertIMvaregisteret?: boolean
  registrertIForetaksregisteret?: boolean
  registrertIFrivillighetsregisteret?: boolean
}

export interface BrregUnderenhet {
  organisasjonsnummer: string
  navn: string
  overordnetEnhet?: string
  organisasjonsform?: BrregOrganisasjonsform
  naeringskode1?: BrregNaeringskode
  naeringskode2?: BrregNaeringskode
  antallAnsatte?: number
  beliggenhetsadresse?: BrregAdresse
  postadresse?: BrregAdresse
  registreringsdatoEnhetsregisteret?: string
  slettedato?: string
}

export interface BrregOppdatering {
  organisasjonsnummer: string
  endringstype: 'Endring' | 'Sletting' | 'Fjernet' | 'Ny'
  endringstidspunkt: string
}

export type BrregStatus = 'aktiv' | 'underAvvikling' | 'konkurs' | 'slettet' | 'fjernet'
export type BrregEntityType = 'hovedenhet' | 'underenhet'

export interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: number
  syncType: 'full' | 'incremental'
}
