import Image from 'next/image'
import Link from 'next/link'
import { RichText } from '@/components/RichText'
import { PowerPriceWidget, type PowerZone, type WidgetVariant } from '@/components/widgets/PowerPriceWidget'
import { WeatherWidget, type WeatherLocation } from '@/components/widgets/WeatherWidget'
import { FlightsWidget, type Airport, type FlightDirection } from '@/components/widgets/FlightsWidget'
import { NavJobsWidget } from '@/components/widgets/NavJobsWidget'
import { NewsWidget, type NewsSourceName } from '@/components/widgets/NewsWidget'
import { BrregWidget } from '@/components/widgets/BrregWidget'
import { WebcamWeatherWidget } from '@/components/widgets/WebcamWeatherWidget'
import { CurrencyWidget, type CurrencyItem } from '@/components/widgets/CurrencyWidget'
import { CalendarWidget } from '@/components/widgets/CalendarWidget'
import { AnbudWidget } from '@/components/widgets/AnbudWidget'
import { HistorierWidget } from '@/components/widgets/HistorierWidget'
import { ArrangementerWidget } from '@/components/widgets/ArrangementerWidget'
import { ShipTrafficWidget } from '@/components/widgets/ShipTrafficWidget'
import { PolitiWidget } from '@/components/widgets/PolitiWidget'

// All class strings must be complete literals — Tailwind cannot detect dynamically built names.
const GRID_COLS: Record<string, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

const COL_SPAN: Record<string, string> = {
  '1': '',
  '2': 'sm:col-span-2',
  'full': 'col-span-full',
}

interface RenderBlocksProps {
  blocks: any[]
  forceVariant?: WidgetVariant
  kolonner?: '1' | '2' | '3' | '4'
  gap?: 'gap-4' | 'gap-6' | 'gap-8' | 'gap-10'
}

export function RenderBlocks({ blocks, forceVariant, kolonner = '1', gap = 'gap-6' }: RenderBlocksProps) {
  if (!blocks?.length) return null
  const gridCols = GRID_COLS[kolonner] ?? 'grid-cols-1'
  return (
    <div className={`grid ${gridCols} ${gap}`}>
      {blocks.map((block, i) => {
        const span = COL_SPAN[(block.bredde as string) ?? '1'] ?? ''
        return (
          <div key={block.id ?? i} className={span || undefined}>
            <BlockSwitch block={block} forceVariant={forceVariant} />
          </div>
        )
      })}
    </div>
  )
}

function BlockSwitch({ block, forceVariant }: { block: any; forceVariant?: WidgetVariant }) {
  switch (block.blockType) {
    case 'powerPrices':
      return (
        <PowerPriceWidget
          title={block.title}
          zone={(block.zone as PowerZone) ?? 'NO4'}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'weather':
      return (
        <WeatherWidget
          title={block.title}
          locations={block.locations?.length ? (block.locations as WeatherLocation[]) : undefined}
          days={block.days ?? 4}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'hero':
      return <HeroRenderer block={block} />
    case 'richText':
      return (
        <div className="prose prose-slate max-w-none py-8">
          <RichText data={block.content} />
        </div>
      )
    case 'cta':
      return <CTARenderer block={block} />
    case 'flights':
      return (
        <FlightsWidget
          title={block.title}
          airports={(block.airports as Airport[]) || undefined}
          direction={(block.direction as FlightDirection) ?? 'departure'}
          count={block.count ?? 4}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'navJobs':
      return (
        <NavJobsWidget
          title={block.title}
          count={block.count ?? 6}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'news':
      return (
        <NewsWidget
          title={block.title}
          sources={block.sources?.length ? (block.sources as NewsSourceName[]) : undefined}
          count={block.count ?? 8}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'brreg':
      return (
        <BrregWidget
          title={block.title}
          count={block.count ?? 5}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'webcam':
      return (
        <WebcamWeatherWidget
          title={block.title}
          locations={block.locations?.length
            ? block.locations.map((loc: any) => ({
                name: loc.name,
                lat: loc.lat,
                lng: loc.lng,
                cameras: loc.cameras?.map((c: any) => ({
                  url: c.url,
                  title: c.camTitle ?? c.title,
                  source: c.source,
                })) ?? [],
              }))
            : undefined}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'currency':
      return (
        <CurrencyWidget
          title={block.title}
          show={block.show?.length ? (block.show as CurrencyItem[]) : undefined}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'holidays':
      return (
        <CalendarWidget
          title={block.title}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'anbud':
      return (
        <AnbudWidget
          title={block.title}
          count={block.count ?? 5}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'historier':
      return (
        <HistorierWidget
          title={block.title}
          count={block.count ?? 3}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'arrangementer':
      return (
        <ArrangementerWidget
          title={block.title}
          count={block.count ?? 5}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'skipstrafikk':
      return (
        <ShipTrafficWidget
          title={block.title || undefined}
          hoyde={(block.hoyde as 'normal' | 'lav') ?? 'normal'}
        />
      )
    case 'politilogg':
      return (
        <PolitiWidget
          title={block.title || undefined}
          count={block.count ?? 5}
          variant={forceVariant ?? (block.variant as WidgetVariant) ?? 'full'}
        />
      )
    case 'featuredPosts':
    case 'businessList':
    case 'eventList':
      // These blocks are data-fetching blocks; they require server-side queries.
      // Render a placeholder here — implement per-route if needed.
      return null
    default:
      return null
  }
}

function HeroRenderer({ block }: { block: any }) {
  const img = block.image && typeof block.image === 'object' ? block.image.url : null
  return (
    <div className="relative flex min-h-[320px] items-center overflow-hidden rounded-2xl bg-fjord">
      {img && (
        <Image src={img} alt={block.image?.alt ?? ''} fill className="object-cover opacity-40" priority />
      )}
      <div className="relative z-10 px-8 py-12 text-fog">
        <h1 className="font-serif text-4xl font-bold">{block.heading}</h1>
        {block.subheading && <p className="mt-3 text-lg opacity-90">{block.subheading}</p>}
        {block.ctaLabel && block.ctaUrl && (
          <Link href={block.ctaUrl}
            className="mt-6 inline-block rounded-xl bg-sun px-6 py-3 font-semibold text-ink hover:bg-sun/90">
            {block.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

function CTARenderer({ block }: { block: any }) {
  return (
    <div className="rounded-2xl bg-sea/10 p-8 text-center">
      <h2 className="font-serif text-2xl font-bold text-fjord">{block.heading}</h2>
      {block.text && <p className="mt-3 text-ink/80">{block.text}</p>}
      {block.buttonLabel && block.buttonUrl && (
        <Link href={block.buttonUrl}
          className="mt-6 inline-block rounded-xl bg-sea px-6 py-3 font-semibold text-fog hover:bg-sea/90">
          {block.buttonLabel}
        </Link>
      )}
    </div>
  )
}
