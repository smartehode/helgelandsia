export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { PowerPriceWidget } from '@/components/widgets/PowerPriceWidget'
import { WeatherWidget } from '@/components/widgets/WeatherWidget'
import { FlightsWidget } from '@/components/widgets/FlightsWidget'
import { NavJobsWidget } from '@/components/widgets/NavJobsWidget'
import { NewsWidget } from '@/components/widgets/NewsWidget'
import { BrregWidget } from '@/components/widgets/BrregWidget'
import { WebcamWeatherWidget } from '@/components/widgets/WebcamWeatherWidget'
import { CurrencyWidget } from '@/components/widgets/CurrencyWidget'
import { CalendarWidget } from '@/components/widgets/CalendarWidget'

export const metadata: Metadata = {
  title: 'Nyttig for Helgeland',
  description: 'Strømpriser, vær, flytider, nyheter og mer for Helgeland.',
}

export default function NyttigPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-serif text-3xl font-bold text-sea">Nyttig for Helgeland</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <PowerPriceWidget zone="NO4" variant="full" />
        <WeatherWidget
          locations={[
            { name: 'Brønnøysund', lat: 65.475, lon: 12.215 },
            { name: 'Sandnessjøen', lat: 66.014, lon: 12.633 },
            { name: 'Mosjøen', lat: 65.835, lon: 13.193 },
            { name: 'Mo i Rana', lat: 66.313, lon: 14.143 },
          ]}
          days={4}
          variant="full"
        />
        <FlightsWidget
          airports={['BNN', 'SSJ', 'MJF']}
          direction="departure"
          count={4}
          variant="full"
        />
        <NavJobsWidget count={6} variant="full" />
        <NewsWidget count={8} variant="full" />
        <BrregWidget count={5} variant="full" />
        <WebcamWeatherWidget variant="full" />
        <CurrencyWidget variant="full" />
        <CalendarWidget variant="full" />
      </div>
    </div>
  )
}
