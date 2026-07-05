import type { CollectionConfig } from 'payload'

export const Tenders: CollectionConfig = {
  slug: 'tenders',
  labels: { singular: 'Anbud', plural: 'Anbud' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'buyerName', 'municipality', 'status', 'deadline', 'noticeType'],
    group: 'Innhold',
    description: 'Offentlige anskaffelser fra Doffin — synkroniseres automatisk daglig.',
  },
  access: {
    read: () => true,
    // create/update/delete: kun admin (Payload-standard)
  },
  fields: [
    {
      name: 'doffinId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Unik Doffin-ID — settes av synkjobben og skal aldri endres manuelt.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { readOnly: true },
    },
    {
      name: 'buyerName',
      type: 'text',
      required: true,
      label: 'Oppdragsgiver',
      admin: { readOnly: true },
    },
    {
      name: 'buyerOrgNr',
      type: 'text',
      label: 'Oppdragsgivers orgnr',
      admin: { readOnly: true },
    },
    {
      name: 'municipality',
      type: 'text',
      label: 'Kommune',
      index: true,
      admin: {
        readOnly: true,
        description: 'Utledet fra oppdragsgivers navn — null for nasjonale/regionale ordninger.',
      },
    },
    {
      name: 'noticeType',
      type: 'text',
      label: 'Kunngjøringstype',
      admin: {
        readOnly: true,
        description: 'Rå Doffin-kunngjøringstype (f.eks. ANNOUNCEMENT_OF_COMPETITION).',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      index: true,
      label: 'Status',
      options: [
        { value: 'ACTIVE', label: 'Aktiv' },
        { value: 'EXPIRED', label: 'Utgått' },
        { value: 'AWARDED', label: 'Tildelt' },
        { value: 'CANCELLED', label: 'Kansellert' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'publicationDate',
      type: 'date',
      label: 'Publisert',
      admin: { readOnly: true, date: { displayFormat: 'd. MMM yyyy' } },
    },
    {
      name: 'deadline',
      type: 'date',
      label: 'Tilbudsfrist',
      admin: { readOnly: true, date: { displayFormat: 'd. MMM yyyy HH:mm' } },
    },
    {
      name: 'cpvHovedkode',
      type: 'text',
      label: 'Hoved-CPV-kode',
      index: true,
      admin: {
        readOnly: true,
        description: '8-sifret CPV-kode (directCpvCodes[0] fra Doffin).',
      },
    },
    {
      name: 'cpvTilleggskoder',
      type: 'json',
      label: 'Tilleggs-CPV-koder',
      admin: {
        readOnly: true,
        description: 'Array med alle direktetilknyttede CPV-koder (directCpvCodes fra Doffin).',
      },
    },
    {
      name: 'locationId',
      type: 'json',
      label: 'NUTS-lokasjoner',
      admin: {
        readOnly: true,
        description: 'NUTS-regionkoder — f.eks. ["NO082"] for Nordland.',
      },
    },
    {
      name: 'placeOfPerformance',
      type: 'json',
      label: 'Leveringssted',
      admin: {
        readOnly: true,
        description: 'Klartekst-leveringssteder (f.eks. ["Nordland"]).',
      },
    },
    {
      name: 'doffinUrl',
      type: 'text',
      required: true,
      label: 'Doffin-lenke',
      admin: { readOnly: true },
    },
    {
      name: 'lastSynced',
      type: 'date',
      required: true,
      label: 'Sist synkronisert',
      admin: { readOnly: true, date: { displayFormat: 'd. MMM yyyy HH:mm' } },
    },
  ],
}
