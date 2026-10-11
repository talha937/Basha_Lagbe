import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PropertyGallery from "../components/PropertyGallery";
import { FACILITY_MAP, PROPERTY_TYPE_MAP, TENANT_TYPE_MAP, taka } from "../lib/labels";
import { inputClass, primaryBtn } from "../lib/ui";
import { createInquiry, getProperty } from "../services/api";

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setNotFound(false);
    getProperty(id)
      .then((data) => { if (!cancelled) setProperty(data); })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) setNotFound(true);
        else setError(err.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (form.name.trim().length < 2) return setFormError("আপনার নাম লিখুন।");
    if (form.contact.trim().length < 5) return setFormError("সঠিক মোবাইল নম্বর বা ইমেইল দিন।");
    if (form.message.trim().length < 2) return setFormError("একটি ছোট বার্তা লিখুন।");

    setSending(true);
    try {
      await createInquiry({
        property_id: Number(id),
        name: form.name.trim(),
        contact: form.contact.trim(),
        message: form.message.trim(),
      });
      setSent(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <main className="py-16 text-center text-slate-500">লোড হচ্ছে...</main>;

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg">বিজ্ঞাপনটি পাওয়া যায়নি। হয়তো ভাড়া হয়ে গেছে বা সরিয়ে ফেলা হয়েছে।</p>
        <Link to="/" className="mt-4 inline-block text-emerald-700 underline">সব বিজ্ঞাপন দেখুন</Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">
        <p>{error}</p>
        <Link to="/" className="mt-4 inline-block text-emerald-700 underline">হোমে ফিরুন</Link>
      </main>
    );
  }

  const rows = [
    ["ধরন", PROPERTY_TYPE_MAP[property.property_type]?.bn],
    ["কাদের জন্য", TENANT_TYPE_MAP[property.tenant_type]?.bn],
    ["তলা", property.floor == null ? null : property.floor === 0 ? "নিচতলা" : String(property.floor)],
    ["অগ্রিম", `${property.advance_months} মাসের ভাড়া`],
    ["সার্ভিস চার্জ", property.service_charge ? `${taka(property.service_charge)}/মাস` : "নেই"],
    ["কবে থেকে খালি", property.available_from
      ? new Date(property.available_from).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "এখনই"],
  ].filter(([, value]) => value);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-emerald-700">← সব বিজ্ঞাপন</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <PropertyGallery images={property.images} title={property.title} />

          <h2 className="mt-6 text-xl font-bold">বিবরণ</h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-600">{property.description}</p>

          <h2 className="mt-6 text-xl font-bold">বিস্তারিত তথ্য</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-400">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {property.facilities.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {property.facilities.map((code) =>
                FACILITY_MAP[code] ? (
                  <span key={code} className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                    {FACILITY_MAP[code].icon} {FACILITY_MAP[code].bn}
                  </span>
                ) : null
              )}
            </div>
          )}
        </div>

        <aside className="md:col-span-2">
          <p className="text-3xl font-bold text-emerald-700">
            {taka(property.rent)} <span className="text-base font-normal text-slate-500">/মাস</span>
          </p>
          <h1 className="mt-1 text-xl font-semibold">{property.title}</h1>
          <p className="text-slate-500">📍 {property.area}, Dhaka</p>
          <p className="mt-3 text-sm text-slate-600">
            {property.bedrooms} Beds · {property.bathrooms} Baths{property.sqft ? ` · ${property.sqft} sqft` : ""}
          </p>

          <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-3 font-semibold">বাড়িওয়ালার সাথে যোগাযোগ</h3>
            {sent ? (
              <p className="text-sm text-emerald-700">✅ আপনার বার্তা পাঠানো হয়েছে। বাড়িওয়ালা আপনার সাথে যোগাযোগ করবেন।</p>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <input className={inputClass} placeholder="আপনার নাম" maxLength={100} value={form.name} onChange={setField("name")} />
                <input className={inputClass} placeholder="মোবাইল নম্বর বা ইমেইল" maxLength={100} value={form.contact} onChange={setField("contact")} />
                <textarea className={inputClass} rows="3" placeholder="ছোট একটি বার্তা" maxLength={1000} value={form.message} onChange={setField("message")} />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button type="submit" disabled={sending} className={`${primaryBtn} w-full`}>
                  {sending ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}