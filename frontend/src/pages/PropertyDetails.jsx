import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { sampleProperties } from '../data/sampleProperties'

export default function PropertyDetails() {
  const { id } = useParams()
  const property = sampleProperties.find((p) => p.id === Number(id))
  const [sent, setSent] = useState(false)

  if (!property) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg">Property not found.</p>
        <Link to="/" className="mt-4 inline-block text-emerald-700 underline">Back to listings</Link>
      </main>
    )
  }

  const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-emerald-700">← Back to Listings</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <div className="flex h-72 items-center justify-center rounded-2xl bg-emerald-50 text-6xl">🏠</div>
          <h2 className="mt-6 text-xl font-bold">About This Property</h2>
          <p className="mt-2 text-slate-600">{property.description}</p>
        </div>

        <aside className="md:col-span-2">
          <p className="text-3xl font-bold text-emerald-700">
            ৳{property.rent.toLocaleString('en-US')} <span className="text-base font-normal text-slate-500">/month</span>
          </p>
          <h1 className="mt-1 text-xl font-semibold">{property.title}</h1>
          <p className="text-slate-500">📍 {property.area}, Dhaka</p>
          <p className="mt-3 text-sm text-slate-600">
            {property.bedrooms} Beds · {property.bathrooms} Baths · {property.sqft} sqft
          </p>

          <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-3 font-semibold">Contact Landlord</h3>
            {sent ? (
              <p className="text-sm text-emerald-700">
                Thanks! (Demo only. The real inquiry will be saved on Day 5.)
              </p>
            ) : (
              <div className="space-y-3">
                <input className={field} placeholder="Your name" />
                <input className={field} placeholder="Phone or email" />
                <textarea className={field} rows="3" placeholder="Short message" />
                <button onClick={() => setSent(true)} className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Send Inquiry
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}