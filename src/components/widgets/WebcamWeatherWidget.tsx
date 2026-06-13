import type { WidgetVariant } from './PowerPriceWidget'
import { WebcamWeatherClient, type Location } from './WebcamWeatherClient'

export type { Location }

interface Props {
  title?: string
  locations?: Location[]
  variant?: WidgetVariant
}

export const DEFAULT_LOCATIONS: Location[] = [
  {
    name: 'Brønnøysund',
    lat: 65.4719,
    lng: 12.2099,
    cameras: [
      { url: 'https://weathercam.herokuapp.com/branded/1',                           title: 'Brønnøysund havn',   source: 'Brønnøysunds Avis' },
      { url: 'https://webcam.havbrukssenter.no/Bilder/Torghatten_Aqua.jpg',           title: 'Toft',               source: 'Norsk Havbrukssenter' },
      { url: 'https://weathercam.herokuapp.com/branded/2',                           title: 'FV17 Horn',          source: 'Brønnøysunds Avis' },
      { url: 'https://www.velfjordferie.no/webkamera/kamera_vf.php',                  title: 'Hommelstø',          source: 'Velfjordferie' },
      { url: 'https://weathercam.herokuapp.com/branded/4',                           title: 'FV17 Vennesund',     source: 'Brønnøysunds Avis' },
    ],
  },
  {
    name: 'Sandnessjøen',
    lat: 66.0217,
    lng: 12.6316,
    cameras: [
      { url: 'https://ftp.hald-ikt.no/webcam/bilder/Ferjeleie001M.jpg',              title: 'Ferjeleiet sentrum', source: 'Alstahaug kommune' },
      { url: 'https://ftp.hald-ikt.no/webcam/bilder/kamera3-sor.jpg',                title: 'Småbåthavn sør',     source: 'Båtforeningen' },
      { url: 'https://kamera.atlas.vegvesen.no/api/images/3001071_1',                 title: 'FV17 Tjøtta ferjekai', source: 'Vegvesenet' },
    ],
  },
  {
    name: 'Mosjøen',
    lat: 65.836,
    lng: 13.1908,
    cameras: [
      { url: 'https://infohelgeland.no/temp_http_files/mosjoenbf_200.jpg',            title: 'Småbåthavna',        source: 'Mosjøen Båtforening' },
    ],
  },
]

export function WebcamWeatherWidget({ title, locations, variant = 'full' }: Props) {
  const locs = locations?.length ? locations : DEFAULT_LOCATIONS
  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <WebcamWeatherClient
        title={title ?? 'Webkamera og vær'}
        locations={locs}
        variant={variant}
      />
    </div>
  )
}
