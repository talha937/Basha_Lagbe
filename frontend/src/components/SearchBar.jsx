export default function SearchBar({ areas, filters, onChange, onSearch, areaError }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value })

  const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-600"

  return (
    <div className="rounded-2xl bg-white p-4 shadow-lg">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <input
            list="area-options"
            placeholder="Search area (e.g. Mirpur 10)"
            value={filters.areaText}
            onChange={set('areaText')}
            className={field}
          />
          <datalist id="area-options">
            {areas.map((a) => (
              <option key={a.id} value={a.name} label={`${a.thana} thana`} />
            ))}
          </datalist>
        </div>
        <input type="number" min="0" placeholder="Min rent (৳)" value={filters.minRent} onChange={set('minRent')} className={field} />
        <input type="number" min="0" placeholder="Max rent (৳)" value={filters.maxRent} onChange={set('maxRent')} className={field} />
        <button onClick={onSearch} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Search
        </button>
      </div>
      {areaError && <p className="mt-2 text-sm text-red-600">{areaError}</p>}
    </div>
  )
}