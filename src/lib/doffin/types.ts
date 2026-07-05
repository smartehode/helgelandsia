export interface DoffinBuyer {
  id: string
  organizationId: string
  name: string
}

export interface DoffinSearchHit {
  id: string
  buyer: DoffinBuyer[]
  heading: string
  description: string | null
  locationId: string[]
  estimatedValue: { currencyCode: string; amount: number } | null
  type: string
  allTypes: string[]
  status: string
  issueDate: string
  deadline: string | null
  publicationDate: string
  placeOfPerformance: string[]
  procurementStrategicLabels: string[]
}

export interface DoffinSearchResponse {
  numHitsTotal: number
  numHitsAccessible: number
  hits: DoffinSearchHit[]
}

export interface DoffinNoticeDetail {
  id: string
  heading: string
  description: string | null
  buyer: DoffinBuyer[]
  directCpvCodes: string[]
  parentCpvCodes: string[]
  allCpvCodes: string[]
  noticeStatus: string  // «status» i søketreff, men «noticeStatus» i detaljsvar
  noticeType: string    // «type» i søketreff, men «noticeType» i detaljsvar
  issueDate: string
  deadline: string | null
  publicationDate: string
  locationId: string[]
  placeOfPerformance: string[]
}

export interface SyncResult {
  created: number
  updated: number
  expired: number
  errors: number
  total: number
}
