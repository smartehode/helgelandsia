import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { WidgetVariant } from './PowerPriceWidget'

export interface WeatherLocation {
  name: string
  lat: number
  lon: number
}

interface Props {
  title?: string
  locations?: WeatherLocation[]
  days?: number
  variant?: WidgetVariant
}

const DEFAULT_LOCATIONS: WeatherLocation[] = [
  { name: 'Brønnøysund', lat: 65.475, lon: 12.215 },
  { name: 'Sandnessjøen', lat: 66.014, lon: 12.633 },
  { name: 'Mosjøen', lat: 65.835, lon: 13.193 },
  { name: 'Mo i Rana', lat: 66.313, lon: 14.143 },
]

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code === 1) return '🌤️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 55) return '🌦️'
  if (code >= 61 && code <= 65) return '🌧️'
  if (code >= 71 && code <= 75) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 85 && code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌡️'
}

interface WeatherResult {
  name: string
  current: { temp: number; wind: number; code: number } | null
  daily: { date: string; max: number; min: number; code: number }[]
}

async function fetchWeather(
  name: string, lat: number, lon: number, days: number,
): Promise<WeatherResult> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'temperature_2m,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      timezone: 'Europe/Oslo',
      forecast_days: String(days),
    })
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 1800 } },
    )
    if (!res.ok) return { name, current: null, daily: [] }
    const data = await res.json()
    return {
      name,
      current: {
        temp: Math.round(data.current.temperature_2m),
        wind: Math.round(data.current.wind_speed_10m),
        code: data.current.weather_code,
      },
      daily: data.daily.time.slice(0, days).map((date: string, i: number) => ({
        date,
        max: Math.round(data.daily.temperature_2m_max[i]),
        min: Math.round(data.daily.temperature_2m_min[i]),
        code: data.daily.weather_code[i],
      })),
    }
  } catch {
    return { name, current: null, daily: [] }
  }
}

export async function WeatherWidget({
  title,
  locations = DEFAULT_LOCATIONS,
  days = 4,
  variant = 'full',
}: Props) {
  const resolvedDays = Math.min(Math.max(days, 1), 7)
  const results = await Promise.all(
    locations.map(l => fetchWeather(l.name, l.lat, l.lon, resolvedDays)),
  )
  const heading = title ?? 'Vær på Helgeland'

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <h2 className="font-serif text-xl font-semibold text-fjord">{heading}</h2>

      <div className="mt-4 divide-y divide-ink/5">
        {results.map(loc => (
          <div key={loc.name} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">
                  {loc.current ? weatherEmoji(loc.current.code) : '—'}
                </span>
                <div>
                  <p className="font-medium text-ink">{loc.name}</p>
                  {loc.current && (
                    <p className="text-xs text-muted">
                      {loc.current.temp > 0 ? '+' : ''}{loc.current.temp}°C · {loc.current.wind} m/s
                    </p>
                  )}
                </div>
              </div>

              {variant === 'full' && loc.daily.length > 0 && (
                <div className="flex gap-2">
                  {loc.daily.map(day => (
                    <div key={day.date} className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-medium capitalize text-muted">
                        {format(new Date(day.date + 'T12:00:00'), 'EEE', { locale: nb })}
                      </span>
                      <span className="text-sm">{weatherEmoji(day.code)}</span>
                      <span className="text-[10px] font-semibold text-ink">
                        {day.max > 0 ? '+' : ''}{day.max}°
                      </span>
                      <span className="text-[10px] text-muted">
                        {day.min > 0 ? '+' : ''}{day.min}°
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-muted">Kilde: open-meteo.com</p>
    </div>
  )
}
