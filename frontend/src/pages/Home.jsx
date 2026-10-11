import { useEffect, useState } from 'react'
import SearchBar from '../components/SearchBar'
import PropertyCard from '../components/PropertyCard'
import { getAreas, getProperties } from '../services/api'

const emptyFilters = { areaText: '', minRent: '', maxRent: '' }
const emptyApplied = { areaId: '', minRent: '', maxRent: '' }

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
    setApplied({ areaId, minRent: filters.minRent, maxRent: filters.maxRent })
  }

  return (
    <main>
      <section className="bg-gradient-to-br from-emerald-900 to-slate-900 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Find Your Perfect <br />
            <span className="text-emerald-400">Rental Home in Bangladesh</span>
          </h1>
          <p className="mt-4 max-w-xl text-slate-200">
            Directly connect with landlords. No brokers. No hassle.
          </p>
          <div className="mt-8">
            <SearchBar
              areas={areas}
              filters={filters}
              onChange={setFilters}
              onSearch={handleSearch}
              areaError={areaError}
            />
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