// Custom ICS/iCalendar parser — no external dependencies.
// Handles the common patterns in Norwegian kulturhus/bibliotek feeds.

export interface ParsedIcsEvent {
  uid: string
  occurrenceId: string  // uid for singles, uid_YYYYMMDD for RRULE occurrences
  summary: string
  start: Date
  end: Date
  location?: string
  description?: string
  url?: string        // URL property (event page, e.g. Facebook)
  attachUrl?: string  // ATTACH image URL if present
  isAllDay: boolean
}

// ── Timezone conversion ───────────────────────────────────────────────────────

function tzLocalToUtc(localIso: string, tz: string): Date {
  // Create a Date from localIso as if it were UTC (fakeUtc), then
  // find the actual UTC time that represents localIso in tz.
  const fakeUtc = new Date(localIso + 'Z')
  const displayed = new Intl.DateTimeFormat('sv', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(fakeUtc)
  // displayed looks like "2024-12-25 20:00:00" (sv locale uses space not T)
  const displayedUtc = new Date(displayed.replace(' ', 'T') + 'Z')
  const offset = displayedUtc.getTime() - fakeUtc.getTime()
  return new Date(fakeUtc.getTime() - offset)
}

function parseIcsDate(value: string, tzid?: string): Date {
  // UTC (ends with Z)
  if (value.endsWith('Z')) {
    const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
    if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`)
    return new Date(value)
  }
  const tz = tzid || 'Europe/Oslo'
  // Date-only
  if (/^\d{8}$/.test(value)) {
    const y = value.slice(0, 4), mo = value.slice(4, 6), d = value.slice(6, 8)
    return tzLocalToUtc(`${y}-${mo}-${d}T00:00:00`, tz)
  }
  // DateTime without Z
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/)
  if (m) return tzLocalToUtc(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`, tz)
  return new Date(value)
}

// ── Property parsing ──────────────────────────────────────────────────────────

function parseProp(line: string): { name: string; params: Record<string, string>; value: string } {
  const colonIdx = line.indexOf(':')
  if (colonIdx === -1) return { name: line.toUpperCase(), params: {}, value: '' }

  const head = line.slice(0, colonIdx)
  const value = line.slice(colonIdx + 1)
  const parts = head.split(';')
  const name = parts[0].toUpperCase()
  const params: Record<string, string> = {}
  for (let i = 1; i < parts.length; i++) {
    const eq = parts[i].indexOf('=')
    if (eq !== -1) params[parts[i].slice(0, eq).toUpperCase()] = parts[i].slice(eq + 1)
  }
  return { name, params, value }
}

function unescapeIcs(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')     // kollapser kun horisontal whitespace, ikke nylinje
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseDurationMs(s: string): number {
  // PT2H, P1D, PT1H30M, P1DT2H, P2W
  const m = s.match(/P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/)
  if (!m) return 7200_000
  const [, w, d, h, min, sec] = m.map(v => parseInt(v ?? '0', 10))
  return ((w * 7 + d) * 24 * 3600 + h * 3600 + min * 60 + sec) * 1000
}

// ── RRULE expansion ───────────────────────────────────────────────────────────

const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }

interface ParsedRrule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  until?: Date
  count?: number
  byday?: number[]  // JS getUTCDay() values: 0=Sun, 1=Mon, ..., 6=Sat
}

function parseRrule(ruleStr: string): ParsedRrule | null {
  const parts: Record<string, string> = {}
  for (const p of ruleStr.split(';')) {
    const eq = p.indexOf('=')
    if (eq !== -1) parts[p.slice(0, eq)] = p.slice(eq + 1)
  }
  const freq = (parts['FREQ'] ?? '').toUpperCase() as ParsedRrule['freq']
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) return null

  const interval = Math.max(1, parseInt(parts['INTERVAL'] ?? '1', 10) || 1)
  const until = parts['UNTIL'] ? (() => { try { return parseIcsDate(parts['UNTIL']) } catch { return undefined } })() : undefined
  const count = parts['COUNT'] ? parseInt(parts['COUNT'], 10) : undefined

  let byday: number[] | undefined
  const bdayStr = parts['BYDAY']
  if (bdayStr) {
    // Skip positional specifiers like "1MO" (first Monday) — complex to expand correctly
    if (/[+-]?\d/.test(bdayStr)) {
      byday = undefined  // fall back to simple monthly/weekly without day selection
    } else {
      byday = bdayStr.split(',').map(d => DAY_MAP[d.toUpperCase()]).filter((n): n is number => n !== undefined)
    }
  }

  return { freq, interval, until, count, byday }
}

function expandRrule(
  dtstart: Date,
  durationMs: number,
  rule: ParsedRrule,
  exdates: Set<string>,
  maxDate: Date,
): Array<{ start: Date; end: Date; occurrenceId: string }> {
  const effectiveUntil = rule.until && rule.until < maxDate ? rule.until : maxDate
  const maxCount = Math.min(rule.count ?? 500, 500)
  const results: Array<{ start: Date; end: Date; occurrenceId: string }> = []

  if (rule.freq === 'WEEKLY' && rule.byday && rule.byday.length > 0) {
    // Find Monday of the week containing dtstart (same time)
    const dstart = dtstart.getUTCDay()
    const daysToMon = (dstart - 1 + 7) % 7
    let weekMon = new Date(dtstart.getTime() - daysToMon * 86400_000)
    const sortedDays = [...rule.byday].sort((a, b) => ((a - 1 + 7) % 7) - ((b - 1 + 7) % 7))

    while (weekMon <= effectiveUntil && results.length < maxCount) {
      for (const jsDay of sortedDays) {
        const offsetFromMon = (jsDay - 1 + 7) % 7
        const occ = new Date(weekMon.getTime() + offsetFromMon * 86400_000)
        if (occ >= dtstart && occ <= effectiveUntil) {
          const dk = occ.toISOString().slice(0, 10)
          if (!exdates.has(dk)) {
            results.push({ start: new Date(occ), end: new Date(occ.getTime() + durationMs), occurrenceId: dk.replace(/-/g, '') })
          }
        }
        if (results.length >= maxCount) break
      }
      weekMon = new Date(weekMon.getTime() + rule.interval * 7 * 86400_000)
    }
    return results
  }

  let current = new Date(dtstart)
  while (current <= effectiveUntil && results.length < maxCount) {
    const dk = current.toISOString().slice(0, 10)
    if (!exdates.has(dk)) {
      results.push({
        start: new Date(current),
        end: new Date(current.getTime() + durationMs),
        occurrenceId: dk.replace(/-/g, ''),
      })
    }
    const next = new Date(current)
    switch (rule.freq) {
      case 'DAILY':   next.setUTCDate(next.getUTCDate() + rule.interval); break
      case 'WEEKLY':  next.setUTCDate(next.getUTCDate() + rule.interval * 7); break
      case 'MONTHLY': next.setUTCMonth(next.getUTCMonth() + rule.interval); break
      case 'YEARLY':  next.setUTCFullYear(next.getUTCFullYear() + rule.interval); break
    }
    if (next.getTime() === current.getTime()) break  // safety: no infinite loop
    current = next
  }
  return results
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseIcs(content: string, now = new Date()): ParsedIcsEvent[] {
  // RFC 5545 unfolding: CRLF (or LF) + ett whitespace-tegn fjernes helt — ingen erstatning.
  // $1-mønsteret beholdt whitespace og ga "Ar ctic" — fjernet.
  const unfolded = content.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')

  const maxDate = new Date(now.getTime() + 90 * 24 * 86400_000)  // 3 months
  const results: ParsedIcsEvent[] = []

  // Extract VEVENT blocks
  const re = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(unfolded)) !== null) {
    const block = m[1]
    // Collect props
    const props: Record<string, Array<{ params: Record<string, string>; value: string }>> = {}
    for (const line of block.split(/\r?\n/).filter(Boolean)) {
      const p = parseProp(line)
      if (!props[p.name]) props[p.name] = []
      props[p.name].push({ params: p.params, value: p.value })
    }

    const uid = props['UID']?.[0]?.value?.trim()
    if (!uid) continue

    const summaryRaw = props['SUMMARY']?.[0]?.value ?? '(uten tittel)'
    const summary = unescapeIcs(summaryRaw).trim()

    const dtstartProp = props['DTSTART']?.[0]
    if (!dtstartProp) continue
    const tzid = dtstartProp.params['TZID']
    let start: Date
    try { start = parseIcsDate(dtstartProp.value.trim(), tzid) } catch { continue }

    const isAllDay = /^\d{8}$/.test(dtstartProp.value.trim())

    let end: Date
    const dtendProp = props['DTEND']?.[0]
    const durProp = props['DURATION']?.[0]
    if (dtendProp) {
      try { end = parseIcsDate(dtendProp.value.trim(), dtendProp.params['TZID'] ?? tzid) } catch { end = new Date(start.getTime() + 7200_000) }
    } else if (durProp) {
      end = new Date(start.getTime() + parseDurationMs(durProp.value.trim()))
    } else {
      end = new Date(start.getTime() + (isAllDay ? 86400_000 : 7200_000))
    }

    const durationMs = Math.max(0, end.getTime() - start.getTime())

    const locationRaw = props['LOCATION']?.[0]?.value
    const location = locationRaw ? unescapeIcs(locationRaw).trim() || undefined : undefined

    const descRaw = props['DESCRIPTION']?.[0]?.value
    const description = descRaw ? stripHtml(unescapeIcs(descRaw)).slice(0, 2000).trim() || undefined : undefined

    const url = props['URL']?.[0]?.value?.trim() || undefined

    // ATTACH — image URL if FMTTYPE is image/* or URL has an image extension
    let attachUrl: string | undefined
    const attachProp = props['ATTACH']?.[0]
    if (attachProp) {
      const fmttype = attachProp.params['FMTTYPE'] ?? ''
      const val = attachProp.value.trim()
      if (val.startsWith('http') && (fmttype.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(val))) {
        attachUrl = val
      }
    }

    // EXDATE
    const exdates = new Set<string>()
    for (const exdateProp of props['EXDATE'] ?? []) {
      const exTzid = exdateProp.params['TZID']
      for (const ds of exdateProp.value.split(',')) {
        try {
          const d = parseIcsDate(ds.trim(), exTzid ?? tzid)
          exdates.add(d.toISOString().slice(0, 10))
        } catch {}
      }
    }

    // RRULE expansion
    const rruleStr = props['RRULE']?.[0]?.value
    if (rruleStr) {
      const rule = parseRrule(rruleStr.trim())
      if (rule) {
        const occs = expandRrule(start, durationMs, rule, exdates, maxDate)
        for (const occ of occs) {
          results.push({ uid, occurrenceId: `${uid}_${occ.occurrenceId}`, summary, start: occ.start, end: occ.end, location, description, url, attachUrl, isAllDay })
        }
      }
    } else {
      results.push({ uid, occurrenceId: uid, summary, start, end, location, description, url, attachUrl, isAllDay })
    }
  }

  return results
}
