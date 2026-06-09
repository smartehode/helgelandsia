import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

// Gjenbrukbare layout-blokker for fleksible sider.
// Redaktøren stabler disse i ønsket rekkefølge i adminpanelet.

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Hero-seksjoner' },
  fields: [
    { name: 'heading', type: 'text', required: true, label: 'Overskrift' },
    { name: 'subheading', type: 'textarea', label: 'Undertekst' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Bakgrunnsbilde' },
    {
      type: 'row',
      fields: [
        { name: 'ctaLabel', type: 'text', label: 'Knappetekst', admin: { width: '50%' } },
        { name: 'ctaUrl', type: 'text', label: 'Knappelenke', admin: { width: '50%' } },
      ],
    },
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Tekstseksjon', plural: 'Tekstseksjoner' },
  fields: [
    { name: 'content', type: 'richText', editor: lexicalEditor(), required: true },
  ],
}

export const FeaturedPostsBlock: Block = {
  slug: 'featuredPosts',
  labels: { singular: 'Fremhevede historier', plural: 'Fremhevede historier' },
  fields: [
    { name: 'heading', type: 'text', label: 'Seksjonstittel' },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      label: 'Velg artikler',
    },
  ],
}

export const BusinessListBlock: Block = {
  slug: 'businessList',
  labels: { singular: 'Bedriftsliste', plural: 'Bedriftslister' },
  fields: [
    { name: 'heading', type: 'text', label: 'Seksjonstittel' },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Filtrer på kategori (valgfritt)',
    },
    { name: 'limit', type: 'number', defaultValue: 6, label: 'Antall' },
  ],
}

export const EventListBlock: Block = {
  slug: 'eventList',
  labels: { singular: 'Arrangementsliste', plural: 'Arrangementslister' },
  fields: [
    { name: 'heading', type: 'text', label: 'Seksjonstittel' },
    { name: 'limit', type: 'number', defaultValue: 6, label: 'Antall' },
  ],
}

export const CTABlock: Block = {
  slug: 'cta',
  labels: { singular: 'Handlingsfremmende', plural: 'Handlingsfremmende' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    { name: 'buttonLabel', type: 'text' },
    { name: 'buttonUrl', type: 'text' },
  ],
}

export const layoutBlocks = [
  HeroBlock,
  RichTextBlock,
  FeaturedPostsBlock,
  BusinessListBlock,
  EventListBlock,
  CTABlock,
]
