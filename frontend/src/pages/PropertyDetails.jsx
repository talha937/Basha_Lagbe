import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createInquiry, getProperty } from '../services/api'

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-600"

export default function PropertyDetails() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({ name: '', contact: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setNotFound(false)

    getProperty(id)
      .then((data) => { if (!cancelled) setProperty(data) })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 404) setNotFound(true)
        else setError(err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (form.name.trim().length < 2) return setFormError('Please enter your name.')
    if (form.contact.trim().length < 5) return setFormError('Please enter a valid phone or email.')
    if (form.message.trim().length < 2) return setFormError('Please write a short message.')

    setSending(true)
    try {
      await createInquiry({
        property_id: Number(id),
        name: form.name.trim(),
        contact: form.contact.trim(),
        message: form.message.trim(),
      })
      setSent(true)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">Loading...</main>

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg">Property not found. It may have been rented or removed.</p>
        <Link to="/" className="mt-4 inline-block text-emerald-700 underline">Back to listings</Link>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">
        <p>{error}</p>
        <Link to="/" className="mt-4 inline-block text-emerald-700 underline">Back to listings</Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-emerald-700">← Back to Listings</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          {property.image_url ? (
            <img src={property.image_url} alt={property.title} className="h-72 w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-2xl bg-emerald-50 text-6xl">🏠</div>
          )}
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
            {property.bedrooms} Beds · {property.bathrooms} Baths{property.sqft ? ` · ${property.sqft} sqft` : ''}
          </p>

          <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-3 font-semibold">Contact Landlord</h3>
            {sent ? (
              <p className="text-sm text-emerald-700">
                ✅ Your inquiry was sent. The landlord will contact you.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input className={field} placeholder="Your name" maxLength={100} value={form.name} onChange={setField('name')} />
                <input className={field} placeholder="Phone or email" maxLength={100} value={form.contact} onChange={setField('contact')} />
                <textarea className={field} rows="3" placeholder="Short message" maxLength={1000} value={form.message} onChange={setField('message')} />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {sending ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}