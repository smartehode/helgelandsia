import type { CollectionConfig } from 'payload'

export const Abonnenter: CollectionConfig = {
  slug: 'abonnenter',
  labels: { singular: 'Abonnent', plural: 'Abonnenter' },
  admin: {
    useAsTitle: 'epost',
    group: 'Nyhetsbrev',
    defaultColumns: ['epost', 'status', 'samtykkeTidspunkt', 'paameldtFra', 'createdAt'],
  },
  access: {
    // Kun innloggede admin-brukere (users-collection) kan se listen
    read:   ({ req }) => req.user?.collection === 'users',
    // Opprettelse og oppdatering skjer KUN via overrideAccess:true i API
    create: () => false,
    update: () => false,
    delete: ({ req }) => req.user?.collection === 'users',
  },
  fields: [
    {
      name: 'epost',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'venter_bekreftelse',
      options: [
        { label: 'Venter bekreftelse', value: 'venter_bekreftelse' },
        { label: 'Aktiv',              value: 'aktiv' },
        { label: 'Avmeldt',            value: 'avmeldt' },
      ],
    },
    {
      name: 'bekreftToken',
      type: 'text',
      unique: true,
      admin: { readOnly: true, description: 'Kryptografisk tilfeldig — brukes i bekreftelseslenken.' },
    },
    {
      name: 'avmeldToken',
      type: 'text',
      unique: true,
      admin: { readOnly: true, description: 'Kryptografisk tilfeldig — brukes i avmeldingslenken i hvert brev.' },
    },
    {
      name: 'samtykkeTidspunkt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Settes KUN ved aktiv bekreftelse (dobbel opt-in) — ikke ved påmelding.',
        date: { displayFormat: "d. MMM yyyy 'kl.' HH:mm" },
      },
    },
    {
      name: 'paameldtFra',
      type: 'text',
      admin: { readOnly: true, description: 'Hvilken side skjemaet sto på.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Normaliser e-post til lowercase ved lagring
        if (typeof data.epost === 'string') {
          data.epost = data.epost.toLowerCase().trim()
        }
        return data
      },
    ],
  },
}
