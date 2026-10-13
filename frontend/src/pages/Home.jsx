import { useEffect, useState } from 'react'
import SearchBar from '../components/SearchBar'
import PropertyCard from '../components/PropertyCard'
import { getAreas, getProperties } from '../services/api'

const emptyFilters = { areaText: '', minRent: '', maxRent: '', bedrooms: '' }
const emptyApplied = { areaId: '', minRent: '', maxRent: '', bedrooms: '' }

export default function Home() {
  const [areas, setAreas] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyApplied)
  const [areaError, setAreaError] = useState('')
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the area suggestions once
  useEffect(() => {
    getAreas().then(setAreas).catch(() => setAreas([]))
  }, [])

  // Load listings whenever the applied search changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    getProperties({
      area_id: applied.areaId,
      min_rent: applied.minRent,
      max_rent: applied.maxRent,
      bedrooms: applied.bedrooms,
    })
      .then((data) => { if (!cancelled) setProperties(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [applied])

  function handleSearch() {
    const text = filters.areaText.trim().toLowerCase()
    let areaId = ''

    if (text) {
      const match = areas.find((a) => a.name.toLowerCase() === text)
      if (!match) {
        setAreaError('Please choose an area from the suggestions.')
        return
      }
      areaId = match.id
    }

    setAreaError('')
    setApplied({ areaId, minRent: filters.minRent, maxRent: filters.maxRent, bedrooms: filters.bedrooms })
  }

  function choosePopularArea(name) {
    setFilters((current) => ({ ...current, areaText: name }))
  }

  return (
    <main>
      <section className="relative min-h-[520px] overflow-hidden bg-brand-100 px-4 text-brand-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/city-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#e9f5ff]/95 via-[#e9f5ff]/80 to-[#e9f5ff]/20" />
        <div className="relative mx-auto flex min-h-[520px] w-full max-w-6xl items-center py-16">
          <div className="w-full max-w-3xl">
            <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-brand-800 md:text-6xl">
              Find Your
              <br />
              Perfect <span className="text-brand-500">Rental Home</span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-brand-800/80 md:text-lg">
              Discover verified rental properties in your favorite areas.
              <br className="hidden sm:block" /> Safe, simple and hassle-free.
            </p>
            <div className="mt-8 max-w-5xl">
            <SearchBar
              areas={areas}
              filters={filters}
              onChange={setFilters}
              onSearch={handleSearch}
              areaError={areaError}
            />
            </div>
            <div className="mt-7">
              <p className="mb-3 text-sm font-bold text-brand-800">Popular Areas</p>
              <div className="flex flex-wrap gap-3">
                {['Dhanmondi', 'Gulshan', 'Uttara', 'Banani', 'Mirpur', 'Mohammadpur'].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => choosePopularArea(area)}
                    className="rounded-full border border-white/80 bg-white/90 px-5 py-2 text-sm font-semibold text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="listings" className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="text-2xl font-bold">Rental Listings</h2>

        {loading && <p className="mt-6 text-slate-500">Loading properties...</p>}

        {!loading && error && (
          <div className="mt-6 rounded-xl bg-red-50 p-6 text-center text-red-700">
            <p>{error}</p>
            <button
              onClick={() => setApplied({ ...applied })}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="mb-6 text-sm text-slate-500">Showing {properties.length} results</p>
            {properties.length === 0 ? (
              <p className="rounded-xl bg-white p-8 text-center text-slate-500">
                No properties match your search. Try changing the filters.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}