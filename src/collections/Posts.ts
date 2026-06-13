import type { CollectionConfig } from 'payload'
import {
  lexicalEditor,
  HeadingFeature,
  BlocksFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'
import { isEditor, isPublishedOrLoggedIn } from '../access'
import { slugField } from '../fields/slug'
import { afterChangeApproved } from '../lib/email/submission-approved'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Artikkel', plural: 'Historier & artikler' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'author', '_status', 'publishedAt'],
    group: 'Innhold',
    // Live-forhåndsvisning av artikkelen mens du redigerer
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL}/historier/${data?.slug ?? ''}`,
    },
  },
  // Utkast/versjonering – innhold publiseres bevisst
  versions: {
    drafts: { autosave: { interval: 800 } },
    maxPerDoc: 25,
  },
  hooks: {
    afterChange: [afterChangeApproved('posts')],
  },
  access: {
    read: isPublishedOrLoggedIn,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  fields: [
    { name: 'submittedBy', type: 'relationship', relationTo: 'members', label: 'Innsendt av', admin: { position: 'sidebar' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Innhold',
          fields: [
            { name: 'title', type: 'text', required: true, label: 'Tittel' },
            {
              name: 'excerpt',
              type: 'textarea',
              label: 'Ingress',
              maxLength: 300,
              admin: { description: 'Kort sammendrag som vises i lister og søk.' },
            },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Hovedbilde',
            },
            {
              name: 'content',
              type: 'richText',
              label: 'Brødtekst',
              required: true,
              editor: lexicalEditor({
                features: ({ defaultFeatures }) => [
                  ...defaultFeatures,
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                  FixedToolbarFeature(),
                ],
              }),
            },
          ],
        },
        {
          label: 'Koblinger',
          fields: [
            {
              name: 'relatedBusinesses',
              type: 'relationship',
              relationTo: 'businesses',
              hasMany: true,
              label: 'Relaterte bedrifter',
            },
            {
              name: 'relatedEvents',
              type: 'relationship',
              relationTo: 'events',
              hasMany: true,
              label: 'Relaterte arrangementer',
            },
          ],
        },
      ],
    },
    // Sidebar-felt
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
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
      label: 'Forfatter',
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: { position: 'sidebar' },
      label: 'Emneord',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Vis på forsiden.' },
      label: 'Fremhevet',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
      label: 'Publiseringsdato',
      hooks: {
        // Sett dato automatisk ved første publisering
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) return new Date()
            return value
          },
        ],
      },
    },
  ],
}
