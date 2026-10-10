import { AREAS } from '../data/sampleProperties'

export default function SearchBar({ filters, onChange, onSearch }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value })

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"

  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-lg md:grid-cols-4">
      <select value={filters.area} onChange={set('area')} className={field}>
        <option value="">Any area</option>
        {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <input type="number" min="0" placeholder="Min rent (৳)" value={filters.minRent} onChange={set('minRent')} className={field} />
      <input type="number" min="0" placeholder="Max rent (৳)" value={filters.maxRent} onChange={set('maxRent')} className={field} />
      <button onClick={onSearch} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
        Search
      </button>
    </div>
  )
}