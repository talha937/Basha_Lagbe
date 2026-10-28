import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ContactBox from "../components/ContactBox";
import PropertyGallery from "../components/PropertyGallery";
import ReportBox from "../components/ReportBox";
import VerifiedBadge from "../components/VerifiedBadge";
import PropertyMap from "../components/PropertyMap";
import { FACILITY_MAP, PROPERTY_TYPE_MAP, TENANT_TYPE_MAP, taka } from "../lib/labels";
import { getProperty } from "../services/api";

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

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

  if (loading) return <main className="py-16 text-center text-slate-500">লোড হচ্ছে...</main>;

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg">বিজ্ঞাপনটি পাওয়া যায়নি। হয়তো ভাড়া হয়ে গেছে, মেয়াদ শেষ হয়েছে বা সরিয়ে ফেলা হয়েছে।</p>
        <Link to="/" className="mt-4 inline-block text-brand-700 underline">সব বিজ্ঞাপন দেখুন</Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-red-700">
        <p>{error}</p>
        <Link to="/" className="mt-4 inline-block text-brand-700 underline">হোমে ফিরুন</Link>
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
      <Link to="/" className="text-sm text-brand-700">← সব বিজ্ঞাপন</Link>

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
                  <span key={code} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">
                    {FACILITY_MAP[code].icon} {FACILITY_MAP[code].bn}
                  </span>
                ) : null
              )}
              <PropertyMap area={property.area} />
            </div>
          )}
        </div>

        <aside className="md:col-span-2">
          {property.is_verified && <VerifiedBadge />}
          <p className="mt-2 text-3xl font-bold text-brand-700">
            {taka(property.rent)} <span className="text-base font-normal text-slate-500">/মাস</span>
          </p>
          <h1 className="mt-1 text-xl font-semibold">{property.title}</h1>
          <p className="text-slate-500">📍 {property.area}, Dhaka</p>
          <p className="mt-3 text-sm text-slate-600">
            {property.bedrooms} Beds · {property.bathrooms} Baths{property.sqft ? ` · ${property.sqft} sqft` : ""}
          </p>

          <ContactBox propertyId={property.id} />
          <ReportBox propertyId={property.id} />
        </aside>
      </div>
    </main>
  );
}