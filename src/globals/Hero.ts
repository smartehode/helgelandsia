import type { GlobalConfig } from 'payload'
import { isEditor } from '../access'

export const Hero: GlobalConfig = {
  slug: 'hero',
  label: 'Hero (forside)',
  admin: { group: 'Konfigurasjon' },
  access: { read: () => true, update: isEditor },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Liten overskrift', defaultValue: 'Midt i Helgeland' },
    { name: 'heading', type: 'text', required: true, label: 'Overskrift', defaultValue: 'Historiene fra Helgeland' },
    { name: 'subheading', type: 'textarea', label: 'Undertekst', defaultValue: 'Lokale historier, næringsliv, kultur og opplevelser fra hele regionen.' },
    {
      name: 'background', type: 'select', defaultValue: 'color', label: 'Bakgrunn',
      options: [
        { label: 'Farge', value: 'color' },
        { label: 'Bilde', value: 'image' },
        { label: 'Video', value: 'video' },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Bakgrunnsbilde / video-plakat',
      admin: { condition: (_, s) => s?.background === 'image' || s?.background === 'video' } },
    { name: 'video', type: 'upload', relationTo: 'media', label: 'Bakgrunnsvideo (mp4)',
      admin: { condition: (_, s) => s?.background === 'video' } },
    { name: 'overlay', type: 'number', label: 'Mørkleggingsgrad (0–80)', defaultValue: 45, min: 0, max: 80,
      admin: { condition: (_, s) => s?.background !== 'color' } },
    {
      name: 'ctas', type: 'array', label: 'Knapper', maxRows: 2,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        { name: 'style', type: 'select', defaultValue: 'primary',
          options: [{ label: 'Primær (fylt)', value: 'primary' }, { label: 'Sekundær (omriss)', value: 'secondary' }] },
      ],
      defaultValue: [
        { label: 'Les historier', url: '/historier', style: 'primary' },
        { label: 'Hva skjer?', url: '/arrangementer', style: 'secondary' },
      ],
    },
  ],
}
