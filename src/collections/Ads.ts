import type { CollectionConfig } from 'payload'
import { isEditor } from '../access'

// Annonser med plassering, periode og enkel statistikk.
export const Ads: CollectionConfig = {
  slug: 'ads',
  labels: { singular: 'Annonse', plural: 'Annonser' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'placement', 'active', 'startDate', 'endDate'],
    group: 'Markedsføring',
  },
  access: {
    // Bare aktive annonser innenfor perioden vises offentlig
    read: ({ req: { user } }) => {
      if (user) return true
      const now = new Date().toISOString()
      return {
        and: [
          { active: { equals: true } },
          { or: [{ startDate: { less_than_equal: now } }, { startDate: { exists: false } }] },
          { or: [{ endDate: { greater_than_equal: now } }, { endDate: { exists: false } }] },
        ],
      }
    },
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Intern tittel' },
    { name: 'advertiser', type: 'text', label: 'Annonsør' },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Annonsebilde',
    },
    { name: 'linkUrl', type: 'text', required: true, label: 'Lenke (URL)' },
    {
      name: 'placement',
      type: 'select',
      required: true,
      defaultValue: 'sidebar',
      label: 'Plassering',
      options: [
        { label: 'Topp (banner)', value: 'header' },
        { label: 'Sidefelt', value: 'sidebar' },
        { label: 'I innhold', value: 'in-content' },
        { label: 'Bunn', value: 'footer' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startDate', type: 'date', label: 'Fra', admin: { width: '50%' } },
        { name: 'endDate', type: 'date', label: 'Til', admin: { width: '50%' } },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Aktiv' },
    {
      type: 'row',
      fields: [
        {
          name: 'impressions',
          type: 'number',
          defaultValue: 0,
          admin: { width: '50%', readOnly: true },
          label: 'Visninger',
        },
        {
          name: 'clicks',
          type: 'number',
          defaultValue: 0,
          admin: { width: '50%', readOnly: true },
          label: 'Klikk',
        },
      ],
    },
  ],
}
