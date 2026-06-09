import type { GlobalConfig } from 'payload'
import { isEditor } from '../access'

// Felles felt for menylenker
const linkFields = [
  { name: 'label', type: 'text' as const, required: true },
  { name: 'url', type: 'text' as const, required: true, admin: { description: 'F.eks. /historier' } },
]

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Meny (topp)',
  admin: { group: 'Konfigurasjon' },
  access: { read: () => true, update: isEditor },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Menypunkter',
      fields: linkFields,
    },
  ],
}

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Bunntekst',
  admin: { group: 'Konfigurasjon' },
  access: { read: () => true, update: isEditor },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Kolonner',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'links', type: 'array', fields: linkFields },
      ],
    },
    { name: 'copyright', type: 'text', label: 'Copyright-tekst' },
  ],
}
