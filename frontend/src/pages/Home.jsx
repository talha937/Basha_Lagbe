import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import PropertyCard from '../components/PropertyCard'
import { sampleProperties } from '../data/sampleProperties'

const emptyFilters = { area: '', minRent: '', maxRent: '' }

export default function Home() {
  const [filters, setFilters] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)

  const results = sampleProperties.filter((p) => {
    if (applied.area && p.area !== applied.area) return false
    if (applied.minRent && p.rent < Number(applied.minRent)) return false
    if (applied.maxRent && p.rent > Number(applied.maxRent)) return false
    return true
  })

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
            <SearchBar filters={filters} onChange={setFilters} onSearch={() => setApplied(filters)} />
          </div>
        </div>
      </section>

      <section id="listings" className="mx-auto max-w-6xl px-4 pt-12">
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Development mode: these are sample listings, not real rentals.
        </p>
        <h2 className="text-2xl font-bold">Rental Listings</h2>
        <p className="mb-6 text-sm text-slate-500">Showing {results.length} results</p>

        {results.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-slate-500">
            No properties match your search. Try changing the filters.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>
    </main>
  )
}