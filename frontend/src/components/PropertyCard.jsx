import { Link } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge";
import { FACILITY_MAP, TENANT_TYPE_MAP, taka } from "../lib/labels";

const PROPERTY_IMAGES = [
  "/property-1.jpg",
  "/property-2.jpg",
  "/property-3.jpg",
  "/property-4.jpg",
  "/property-5.jpg",
  "/property-6.jpg",
];

export default function PropertyCard({ property, preview = false }) {
  const { id, title, area, rent, bedrooms, bathrooms, sqft, image_url, tenant_type, is_verified, facilities = [] } = property;
  const tenant = TENANT_TYPE_MAP[tenant_type];
  const button = "mt-4 block rounded-lg bg-brand-50 py-2 text-center text-sm font-semibold text-brand-700";
  const imageIndex = Number.isFinite(Number(id)) ? (Number(id) - 1) % PROPERTY_IMAGES.length : 0;
  const propertyImage = image_url || PROPERTY_IMAGES[Math.max(imageIndex, 0)];

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <img src={propertyImage} alt={title || "Rental property"} className="h-52 w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        {tenant && tenant_type !== "any" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow">
            {tenant.bn}
          </span>
        )}
        {is_verified && <VerifiedBadge className="absolute right-3 top-3" />}
      </div>

      <div className="p-4">
        <p className="text-lg font-bold text-brand-700">
          {taka(rent)} <span className="text-sm font-normal text-slate-500">/মাস</span>
        </p>
        <h3 className="mt-1 font-semibold">{title}</h3>
        <p className="text-sm text-slate-500">📍 {area}, Dhaka</p>
        <p className="mt-2 text-sm text-slate-600">
          {bedrooms} Beds · {bathrooms} Baths{sqft ? ` · ${sqft} sqft` : ""}
        </p>

        {facilities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {facilities.slice(0, 3).map((code) =>
              FACILITY_MAP[code] ? (
                <span key={code} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {FACILITY_MAP[code].bn}
                </span>
              ) : null
            )}
          </div>
        )}

        {preview ? (
          <div className={button}>বিস্তারিত দেখুন</div>
        ) : (
          <Link to={`/properties/${id}`} className={`${button} hover:bg-brand-100`}>বিস্তারিত দেখুন</Link>
        )}
      </div>
    </div>
  );
}