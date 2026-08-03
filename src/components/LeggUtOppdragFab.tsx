import { cookies } from 'next/headers'
import Link from 'next/link'

// Flytende "Legg ut et oppdrag"-pille.
// Vises KUN for ikke-innloggede besøkende (payload-token-cookie mangler).
// Settes inn på /oppdrag, /bedrifter og kategorisidene.
export async function LeggUtOppdragFab() {
  const store = await cookies()
  if (store.get('payload-token')) return null

  return (
    <div className="fixed bottom-5 right-4 z-40 sm:right-6">
      <Link
        href="/logg-inn?fra=%2Fmin-side%3Ftype%3Doppdrag"
        className="flex items-center gap-2 rounded-full bg-fjord px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-fjord/90 hover:shadow-lg"
      >
        {/* Blyantikonet */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0"
          aria-hidden
        >
          <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
        </svg>
        Legg ut et oppdrag
      </Link>
    </div>
  )
}
