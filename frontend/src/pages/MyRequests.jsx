import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { REQUEST_STATUS, taka } from "../lib/labels";
import { fmtDateTime } from "../lib/ui";
import { getMyRequests } from "../services/api";

export default function MyRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyRequests()
      .then((d) => { if (!cancelled) setItems(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">আমার অনুরোধ <span className="text-sm font-normal text-slate-400">My requests</span></h1>

      {loading && <p className="mt-6 text-slate-500">লোড হচ্ছে...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <p className="font-semibold">এখনো কোনো অনুরোধ পাঠাননি</p>
          <p className="mt-1 text-sm text-slate-500">পছন্দের বাসা খুঁজে বাড়িওয়ালাকে অনুরোধ পাঠান।</p>
          <Link to="/" className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">বিজ্ঞাপন দেখুন</Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {items.map((r) => {
          const s = REQUEST_STATUS[r.status];
          return (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex gap-4">
                {r.listing.image_url ? (
                  <img src={r.listing.image_url} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-2xl">🏠</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/properties/${r.listing.id}`} className="font-semibold hover:text-brand-700">{r.listing.title}</Link>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.bn}</span>
                  </div>
                  <p className="text-sm text-slate-500">📍 {r.listing.area} · {taka(r.listing.rent)}/মাস</p>
                  <p className="mt-1 text-xs text-slate-400">{fmtDateTime(r.created_at)}</p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{r.message}</p>

              {r.status === "accepted" && r.landlord_phone && (
                <div className="mt-3 rounded-xl bg-brand-50 p-3">
                  <p className="text-sm text-brand-800">✅ {r.landlord_name} আপনার অনুরোধ গ্রহণ করেছেন</p>
                  <a href={`tel:${r.landlord_phone}`} className="text-lg font-bold text-brand-700">📞 {r.landlord_phone}</a>
                  <p className="mt-1 text-xs text-slate-600">⚠️ বাসা নিজে দেখে নেওয়ার আগে কোনো টাকা পাঠাবেন না।</p>
                </div>
              )}
              {r.status === "rejected" && <p className="mt-3 text-sm text-slate-500">বাড়িওয়ালা এই অনুরোধটি গ্রহণ করেননি।</p>}
            </div>
          );
        })}
      </div>
    </main>
  );
}