const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://helgelandsia.no'

const FJORD  = '#0e3a5c'
const SEA    = '#3b7fc4'
const PAPER  = '#faf8f5'
const BORDER = '#e5e0d8'
const INK    = '#1a1a1a'
const MUTED  = '#6b6560'

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="no"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
<tr><td style="background:${FJORD};border-radius:12px 12px 0 0;padding:24px 40px;">
<span style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#f5f1eb;">Helgelandsia</span>
</td></tr>
<tr><td style="background:${PAPER};padding:36px 40px;border-radius:0 0 12px 12px;border:1px solid ${BORDER};border-top:none;">
${body}
</td></tr>
<tr><td style="padding:20px 40px;text-align:center;">
<p style="margin:0;font-size:12px;color:${MUTED};">Du mottar denne e-posten fordi du er registrert på Helgelandsia.<br/>Svar ikke på denne e-posten — den sendes automatisk.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

const h1  = `font-family:Georgia,serif;font-size:22px;color:${FJORD};margin:0 0 16px;`
const p   = `font-size:15px;line-height:1.6;color:${INK};margin:0 0 14px;`
const btn = `display:inline-block;background:${SEA};color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;margin-top:8px;`
const sm  = `font-size:13px;color:${MUTED};margin-top:16px;word-break:break-all;`

export function verifyEmailHtml(token: string): string {
  const url = `${BASE_URL}/verifiser?token=${token}`
  return wrap(`
<h1 style="${h1}">Velkommen til Helgelandsia!</h1>
<p style="${p}">Takk for at du registrerte deg. Klikk nedenfor for å bekrefte e-postadressen din.</p>
<p style="${p}">Lenken er gyldig i 24 timer.</p>
<a href="${url}" style="${btn}">Bekreft e-posten min</a>
<p style="${sm}">Eller kopier denne lenken i nettleseren:<br/>${url}</p>
  `)
}

export function forgotPasswordHtml(token: string): string {
  const url = `${BASE_URL}/nytt-passord?token=${token}`
  return wrap(`
<h1 style="${h1}">Tilbakestill passordet ditt</h1>
<p style="${p}">Vi mottok en forespørsel om å tilbakestille passordet for kontoen din på Helgelandsia.</p>
<p style="${p}">Klikk nedenfor for å velge et nytt passord. Lenken er gyldig i 1 time.</p>
<a href="${url}" style="${btn}">Velg nytt passord</a>
<p style="${sm}">Eller kopier denne lenken:<br/>${url}</p>
<p style="font-size:13px;color:${MUTED};margin-top:8px;">Hvis du ikke ba om dette, kan du se bort fra denne e-posten.</p>
  `)
}

export function tenderDigestHtml(params: {
  name: string
  entries: { businessName: string; tenders: { title: string; buyerName: string; deadline: string | null; doffinUrl: string }[] }[]
}): string {
  const { name, entries } = params
  const totalCount = entries.reduce((s, e) => s + e.tenders.length, 0)

  const entriesHtml = entries.map(({ businessName, tenders }) => {
    const rows = tenders.map(t => {
      const deadline = t.deadline
        ? new Date(t.deadline).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Ingen frist oppgitt'
      return `
<tr>
<td style="padding:12px 16px;border-bottom:1px solid ${BORDER};">
  <a href="${t.doffinUrl}" style="font-size:14px;font-weight:600;color:${SEA};text-decoration:none;">${t.title}</a>
  <p style="margin:4px 0 0;font-size:12px;color:${MUTED};">${t.buyerName} &middot; Frist: ${deadline}</p>
</td>
</tr>`
    }).join('')
    return `
<p style="font-size:14px;font-weight:bold;color:${FJORD};margin:20px 0 8px;">${businessName}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
  style="border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
${rows}
</table>`
  }).join('')

  return wrap(`
<h1 style="${h1}">Nye anbud som kan passe din bedrift</h1>
<p style="${p}">Hei${name ? ' ' + name : ''},</p>
<p style="${p}">Vi fant ${totalCount === 1 ? 'ett nytt anbud' : `${totalCount} nye anbud`} i Doffin som kan være aktuelle for din bedrift på Helgelandsia.</p>
${entriesHtml}
<p style="margin-top:24px;"><a href="${BASE_URL}/anbud" style="${btn}">Se alle Nordland-anbud</a></p>
<p style="${sm}">Du mottar disse varslene fordi du har en verifisert bedriftsprofil på Helgelandsia.<br/>
Du kan skru av varslingen på <a href="${BASE_URL}/min-side" style="color:${SEA};">Min side</a>.</p>
  `)
}

export function oppdragNotificationHtml(params: {
  bedriftNavn: string
  tittel: string
  katLabel: string
  kommune: string
  onsketTidsrom: string | null
  beskrivelseKort: string
  oppdragUrl: string
}): string {
  const { bedriftNavn, tittel, katLabel, kommune, onsketTidsrom, beskrivelseKort, oppdragUrl } = params
  const kommuneDisplay = kommune.charAt(0).toUpperCase() + kommune.slice(1)
  return wrap(`
<h1 style="${h1}">Nytt lokalt oppdrag i din bransje</h1>
<p style="${p}">Hei,</p>
<p style="${p}">Det er lagt ut et nytt oppdrag på Helgelandsia som kan passe for <strong>${bedriftNavn}</strong>:</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
  style="border:1px solid ${BORDER};border-radius:8px;padding:16px 20px;margin-bottom:16px;background:#fff;">
<tr><td>
  <p style="font-family:Georgia,serif;font-size:17px;color:${FJORD};font-weight:bold;margin:0 0 8px;">${tittel}</p>
  <p style="font-size:13px;color:${MUTED};margin:0 0 4px;">${katLabel} &middot; ${kommuneDisplay}</p>
  ${onsketTidsrom ? `<p style="font-size:13px;color:${MUTED};margin:0 0 8px;">Tidsrom: ${onsketTidsrom}</p>` : ''}
  ${beskrivelseKort ? `<p style="font-size:14px;color:${INK};margin:8px 0 0;">${beskrivelseKort}${beskrivelseKort.length >= 200 ? '…' : ''}</p>` : ''}
</td></tr>
</table>
<a href="${oppdragUrl}" style="${btn}">Se oppdraget og meld interesse</a>
<p style="${sm}">Du mottar dette fordi <strong>${bedriftNavn}</strong> er registrert på Helgelandsia med oppdragsvarsling aktivert.<br/>
Skru av på <a href="${BASE_URL}/min-side" style="color:${SEA};">Min side</a>.</p>
  `)
}

export function oppdragInteresseHtml(params: {
  oppdragTittel: string
  bedriftNavn: string
  bedriftUrl: string
  bedriftTelefon: string | null
  bedriftEpost: string | null
  oppdragUrl: string
}): string {
  const { oppdragTittel, bedriftNavn, bedriftUrl, bedriftTelefon, bedriftEpost, oppdragUrl } = params
  const kontaktLinjer = [
    bedriftTelefon ? `<li style="font-size:14px;color:${INK};">Tlf: ${bedriftTelefon}</li>` : '',
    bedriftEpost ? `<li style="font-size:14px;color:${INK};">E-post: <a href="mailto:${bedriftEpost}" style="color:${SEA};">${bedriftEpost}</a></li>` : '',
  ].filter(Boolean).join('')
  return wrap(`
<h1 style="${h1}">En bedrift er interessert i ditt oppdrag</h1>
<p style="${p}"><strong>${bedriftNavn}</strong> på Helgeland har meldt interesse for ditt oppdrag <strong>«${oppdragTittel}»</strong>.</p>
<p style="${p}">Det er opp til deg å ta kontakt. Her er bedriftens informasjon:</p>
${kontaktLinjer ? `<ul style="padding-left:20px;margin:0 0 16px;">${kontaktLinjer}</ul>` : ''}
<p style="${p}"><a href="${bedriftUrl}" style="color:${SEA};">Se bedriftsprofilen til ${bedriftNavn} ↗</a></p>
<a href="${oppdragUrl}" style="${btn}">Se oppdraget</a>
<p style="${sm}">Helgelandsia er kun formidler og er ikke part i avtaler som inngås mellom partene.</p>
  `)
}

export function submissionApprovedHtml(params: {
  name: string
  contentType: string
  title: string
  url: string
}): string {
  const { name, contentType, title, url } = params
  return wrap(`
<h1 style="${h1}">Innholdet ditt er publisert!</h1>
<p style="${p}">Hei${name ? ' ' + name : ''},</p>
<p style="${p}">Din ${contentType} <strong>«${title}»</strong> er godkjent og publisert på Helgelandsia.</p>
<a href="${url}" style="${btn}">Se publisert innhold</a>
<p style="${sm}">Takk for ditt bidrag til Helgelandsia!</p>
  `)
}
