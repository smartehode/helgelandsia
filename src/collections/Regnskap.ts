import type { CollectionConfig } from 'payload'

export const Regnskap: CollectionConfig = {
  slug: 'regnskap',
  labels: { singular: 'Regnskap', plural: 'Regnskap' },
  admin: {
    useAsTitle: 'orgnr',
    defaultColumns: ['orgnr', 'aar', 'omsetning', 'aarsresultat', 'hentetDato'],
    group: 'Innhold',
    description: 'Nøkkeltall fra Regnskapsregisteret — synkroniseres månedlig.',
  },
  access: {
    read: () => true,
    // create/update/delete: kun admin (Payload-standard)
  },
  fields: [
    {
      name: 'orgnr',
      type: 'text',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'aar',
      type: 'number',
      required: true,
      index: true,
      label: 'År',
      admin: { readOnly: true },
    },
    {
      name: 'omsetning',
      type: 'number',
      label: 'Omsetning',
      admin: { readOnly: true },
    },
    {
      name: 'driftsresultat',
      type: 'number',
      label: 'Driftsresultat',
      admin: { readOnly: true },
    },
    {
      name: 'aarsresultat',
      type: 'number',
      label: 'Årsresultat',
      admin: { readOnly: true },
    },
    {
      name: 'egenkapital',
      type: 'number',
      label: 'Egenkapital',
      admin: { readOnly: true },
    },
    {
      name: 'valuta',
      type: 'text',
      label: 'Valuta',
      admin: { readOnly: true },
    },
    {
      name: 'hentetDato',
      type: 'date',
      required: true,
      label: 'Hentet dato',
      admin: { readOnly: true, date: { displayFormat: 'd. MMM yyyy' } },
    },
  ],
}
