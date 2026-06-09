import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Arrangement', plural: 'Arrangementer' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'place', '_status'],
    group: 'Innhold',
  },
  versions: { drafts: true },
  access: {
    read: isPublishedOrLoggedIn,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Tittel' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Bilde' },
    {
      name: 'description',
      type: 'richText',
      label: 'Beskrivelse',
      editor: lexicalEditor(),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          label: 'Starttidspunkt',
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Sluttidspunkt',
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    { name: 'locationName', type: 'text', label: 'Stedsnavn (f.eks. Kulturhuset)' },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'businesses',
      label: 'Arrangør (bedrift)',
    },
    { name: 'ticketUrl', type: 'text', label: 'Billettlenke (URL)' },
    {
      type: 'row',
      fields: [
        { name: 'free', type: 'checkbox', label: 'Gratis', admin: { width: '50%' } },
        { name: 'price', type: 'text', label: 'Pris', admin: { width: '50%' } },
      ],
    },
    // Sidebar
    slugField('title'),
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: { position: 'sidebar' },
      label: 'Kategori',
    },
    {
      name: 'place',
      type: 'relationship',
      relationTo: 'places',
      admin: { position: 'sidebar' },
      label: 'Sted',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
      label: 'Fremhevet',
    },
  ],
}
