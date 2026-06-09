import type { CollectionConfig } from 'payload'
import { isEditor, isPublishedOrLoggedIn } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Innhold' },
  access: {
    read: () => true, // Bilder er offentlige
    create: isEditor,
    update: isEditor,
    delete: isEditor,
  },
  upload: {
    // Automatiske størrelser for responsiv levering
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
    ],
    focalPoint: true,
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Beskrivelse av bildet (viktig for SEO og universell utforming).' },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Valgfri bildetekst.' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Fotograf / kilde.' },
    },
  ],
}
