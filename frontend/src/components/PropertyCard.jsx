import { Link } from "react-router-dom";
import { FACILITY_MAP, TENANT_TYPE_MAP, taka } from "../lib/labels";

export default function PropertyCard({ property, preview = false }) {
  const { id, title, area, rent, bedrooms, bathrooms, sqft, image_url, tenant_type, facilities = [] } = property;
  const tenant = TENANT_TYPE_MAP[tenant_type];
  const button = "mt-4 block rounded-lg bg-emerald-50 py-2 text-center text-sm font-semibold text-emerald-700";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <div className="relative">
        {image_url ? (
          <img src={image_url} alt={title} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center bg-emerald-50 text-4xl">🏠</div>
        )}
        {tenant && tenant_type !== "any" && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow">
            {tenant.bn}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-lg font-bold text-emerald-700">
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
          <Link to={`/properties/${id}`} className={`${button} hover:bg-emerald-100`}>বিস্তারিত দেখুন</Link>
        )}
      </div>
    </div>
  );
}