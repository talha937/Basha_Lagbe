import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyInquiries } from "../services/api";

function ContactLink({ value }) {
  // Only build a link when the value is clearly a phone number or an email
  if (/^\+?[0-9\s-]{6,20}$/.test(value)) {
    return <a href={`tel:${value.replace(/[\s-]/g, "")}`} className="font-semibold text-emerald-700">{value}</a>;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return <a href={`mailto:${value}`} className="font-semibold text-emerald-700">{value}</a>;
  }
  return <span className="font-semibold">{value}</span>;
}

export default function Inquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyInquiries()
      .then((d) => { if (!cancelled) setItems(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/dashboard" className="text-sm text-emerald-700">← ড্যাশবোর্ডে ফিরুন</Link>
      <h1 className="mt-2 text-2xl font-bold">ইনকোয়ারি <span className="text-sm font-normal text-slate-400">Inquiries</span></h1>

      {loading && <p className="mt-6 text-slate-500">লোড হচ্ছে...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="mt-6 rounded-xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200">এখনো কোনো ইনকোয়ারি আসেনি।</p>
      )}

      <div className="mt-6 space-y-4">
        {items.map((q) => (
          <div key={q.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold">{q.property_title}</span>
              <span className="text-xs text-slate-400">
                {new Date(q.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">{q.message}</p>
            <p className="mt-3 text-sm text-slate-500">{q.name} · <ContactLink value={q.contact} /></p>
          </div>
        ))}
      </div>
    </main>
  );
}