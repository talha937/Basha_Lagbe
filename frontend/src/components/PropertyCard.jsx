import { Link } from 'react-router-dom'

export default function PropertyCard({ property }) {
  const { id, title, area, rent, bedrooms, bathrooms, sqft, image_url } = property

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      {image_url ? (
        <img src={image_url} alt={title} className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-emerald-50 text-4xl">🏠</div>
      )}
      <div className="p-4">
        <p className="text-lg font-bold text-emerald-700">
          ৳{rent.toLocaleString('en-US')} <span className="text-sm font-normal text-slate-500">/month</span>
        </p>
        <h3 className="mt-1 font-semibold">{title}</h3>
        <p className="text-sm text-slate-500">📍 {area}, Dhaka</p>
        <p className="mt-2 text-sm text-slate-600">
          {bedrooms} Beds · {bathrooms} Baths · {sqft} sqft
        </p>
        <Link
          to={`/properties/${id}`}
          className="mt-4 block rounded-lg bg-emerald-50 py-2 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}