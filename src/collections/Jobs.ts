import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { afterChangeApproved } from '../lib/email/submission-approved'

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Stilling', plural: 'Stillinger' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'employer', 'deadline', 'place', '_status'],
    group: 'Innhold',
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [afterChangeApproved('jobs')],
  },
  access: {
    read: isPublishedOrLoggedIn,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: 'submittedBy', type: 'relationship', relationTo: 'members', label: 'Innsendt av', admin: { position: 'sidebar' } },
    { name: 'title', type: 'text', required: true, label: 'Stillingstittel' },
    { name: 'employer', type: 'text', required: true, label: 'Arbeidsgiver' },
    {
      name: 'description',
      type: 'richText',
      label: 'Beskrivelse / arbeidsoppgaver',
      editor: lexicalEditor(),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'jobType',
          type: 'select',
          label: 'Type stilling',
          options: [
            { label: 'Heltid', value: 'full-time' },
            { label: 'Deltid', value: 'part-time' },
            { label: 'Vikariat', value: 'temp' },
            { label: 'Engasjement', value: 'contract' },
            { label: 'Sesong', value: 'seasonal' },
            { label: 'Lærling', value: 'apprentice' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'deadline',
          type: 'date',
          label: 'Søknadsfrist',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd. MMM yyyy' } },
        },
      ],
    },
    { name: 'locationName', type: 'text', label: 'Arbeidssted (f.eks. Sandnessjøen)' },
    { name: 'applicationUrl', type: 'text', label: 'Søknadslenke (URL)' },
    { name: 'applicationEmail', type: 'email', label: 'Søknads-e-post' },
    {
      type: 'row',
      fields: [
        { name: 'contactName', type: 'text', label: 'Kontaktperson', admin: { width: '50%' } },
        { name: 'contactPhone', type: 'text', label: 'Kontakttelefon', admin: { width: '50%' } },
      ],
    },
    // Sidebar
    slugField('title'),
    {
      name: 'place',
      type: 'relationship',
      relationTo: 'places',
      admin: { position: 'sidebar' },
      label: 'Sted',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: { position: 'sidebar' },
      label: 'Bransje/kategori',
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
