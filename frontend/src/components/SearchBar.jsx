import { useMemo, useState } from 'react'

export default function SearchBar({ areas, filters, onChange, onSearch, areaError }) {
  const [areaOpen, setAreaOpen] = useState(false)
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value })
  const visibleAreas = useMemo(() => {
    const query = filters.areaText.trim().toLowerCase()
    if (!query) return areas
    return areas.filter((area) => `${area.name} ${area.thana}`.toLowerCase().includes(query))
  }, [areas, filters.areaText])

  const field = "h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"

  return (
    <div className="rounded-2xl border border-white/70 bg-white/95 p-3 shadow-[0_12px_35px_rgba(13,42,71,0.18)] backdrop-blur-sm sm:p-4">
      <div className="grid gap-3 md:grid-cols-[1.35fr_1.05fr_1fr_auto]">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-brand-600">⌖</span>
          <input
            placeholder="Enter area or city"
            value={filters.areaText}
            onFocus={() => setAreaOpen(true)}
            onChange={(event) => {
              setAreaOpen(true)
              onChange({ ...filters, areaText: event.target.value })
            }}
            className={`${field} pl-11`}
          />
          {areaOpen && visibleAreas.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
              {visibleAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange({ ...filters, areaText: area.name })
                    setAreaOpen(false)
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50"
                >
                  <span className="font-semibold">{area.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{area.thana}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-brand-600">৳</span>
          <input type="number" min="0" placeholder="Budget" value={filters.minRent} onChange={set('minRent')} className={`${field} pl-11`} />
        </div>
        <select value={filters.bedrooms || ''} onChange={set('bedrooms')} className={`${field} appearance-none`}>
          <option value="">Bedrooms</option>
          <option value="1">1 bedroom</option>
          <option value="2">2 bedrooms</option>
          <option value="3">3 bedrooms</option>
          <option value="4">4+ bedrooms</option>
        </select>
        <button onClick={onSearch} className="h-14 rounded-xl bg-brand-700 px-7 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800">
          <span className="mr-2 text-lg">⌕</span>
          Search
        </button>
      </div>
      <input type="number" min="0" placeholder="Max rent (৳)" value={filters.maxRent} onChange={set('maxRent')} className="sr-only" aria-label="Maximum rent" />
      {areaError && <p className="mt-2 text-sm text-red-600">{areaError}</p>}
    </div>
  )
}