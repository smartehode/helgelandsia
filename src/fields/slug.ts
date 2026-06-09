import type { Field } from 'payload'

// Lager en URL-vennlig slug fra en tekst (norske tegn håndteres).
const slugify = (val: string): string =>
  val
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/**
 * Gjenbrukbart slug-felt. Genereres automatisk fra `sourceField`
 * (f.eks. "title") når slug er tom, men kan overstyres manuelt.
 */
export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'URL-vennlig identifikator. Genereres automatisk hvis tom.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.length > 0) return slugify(value)
        const source = data?.[sourceField]
        if (typeof source === 'string') return slugify(source)
        return value
      },
    ],
  },
})
