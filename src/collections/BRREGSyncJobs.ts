import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

export const BRREGSyncJobs: CollectionConfig = {
  slug: 'brreg-sync-jobs',
  labels: { singular: 'BRREG-synkjobb', plural: 'BRREG-synkjobber' },
  admin: {
    useAsTitle: 'createdAt',
    defaultColumns: ['syncType', 'status', 'created', 'updated', 'errors', 'createdAt'],
    group: 'Konfigurasjon',
    pagination: { defaultLimit: 30 },
    description: 'Logg over automatiske importjobber fra Brønnøysundregistrene.',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'syncType',
      type: 'select',
      label: 'Type',
      options: [
        { label: 'Full nedlasting', value: 'full' },
        { label: 'Inkrementell', value: 'incremental' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      options: [
        { label: 'Vellykket', value: 'success' },
        { label: 'Delvis vellykket', value: 'partial' },
        { label: 'Feilet', value: 'failed' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'created', type: 'number', defaultValue: 0, label: 'Nye bedrifter', admin: { width: '25%' } },
        { name: 'updated', type: 'number', defaultValue: 0, label: 'Oppdaterte', admin: { width: '25%' } },
        { name: 'skipped', type: 'number', defaultValue: 0, label: 'Hoppet over', admin: { width: '25%' } },
        { name: 'errors', type: 'number', defaultValue: 0, label: 'Feil', admin: { width: '25%' } },
      ],
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      label: 'Feilmelding',
      admin: { condition: (data) => Boolean(data?.errorMessage) },
    },
  ],
}
