import type { GlobalConfig } from 'payload'
import { isEditor } from '../access'
import { widgetBlocks, layoutBlocks } from '../blocks'

export const WidgetAreas: GlobalConfig = {
  slug: 'sidefelt',
  label: 'Widget-områder',
  admin: {
    group: 'Konfigurasjon',
    description: 'Widgets som vises i tre soner på forsiden.',
  },
  access: { read: () => true, update: isEditor },
  fields: [
    {
      name: 'fremhevet',
      type: 'blocks',
      label: 'Fremhevet sone (full bredde)',
      blocks: layoutBlocks,
      admin: {
        description: 'Full bredde under navigasjonskortene. Bruk «Fremhevede historier»-blokken til å plukke ut ekslusive artikler og saker.',
      },
    },
    {
      name: 'sidefelt',
      type: 'blocks',
      label: 'Sidefelt (høyrespalte)',
      blocks: widgetBlocks,
      admin: {
        description: 'Kompakt variant. Vises i høyrespalten ved siden av innholdet på store skjermer.',
      },
    },
    {
      name: 'midten',
      type: 'blocks',
      label: 'Midt på forsiden',
      blocks: widgetBlocks,
      admin: {
        description: 'Full variant. Vises mellom "Fremhevede historier" og annonsen, i et 2-kolonners grid.',
      },
    },
    {
      name: 'bunn',
      type: 'blocks',
      label: 'Bunn av forsiden',
      blocks: widgetBlocks,
      admin: {
        description: 'Kompakt variant. Vises som full-bredde stripe rett over footeren, i et 3-kolonners grid.',
      },
    },
  ],
}
