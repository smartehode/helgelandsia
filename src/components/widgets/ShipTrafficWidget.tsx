export function ShipTrafficWidget() {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Skipstrafikk på Helgeland</h2>
        <a
          href="https://nais.kystverket.no/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted transition hover:text-sea"
        >
          Kilde: Kystverket (NAIS) ↗
        </a>
      </div>
      <iframe
        src="https://nais.kystverket.no/embed/?datasetIds=aisstream&mapBounds=9.5%2C63.5%3B17.5%2C67.8"
        title="Live skipstrafikk fra Kystverket NAIS"
        loading="lazy"
        className="block h-[300px] w-full border-0 md:h-[420px]"
      />
    </div>
  )
}
