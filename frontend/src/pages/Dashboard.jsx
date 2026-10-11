import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { taka } from "../lib/labels";
import { primaryBtn, secondaryBtn } from "../lib/ui";
import { deleteMyProperty, getMyProperties, markAvailable, markRented } from "../services/api";

const TABS = [
  { key: "all", bn: "সব", en: "All" },
  { key: "available", bn: "চলমান", en: "Active" },
  { key: "rented", bn: "ভাড়া হয়েছে", en: "Rented" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice] = useState(location.state?.notice || "");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [tab, setTab] = useState("all");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (location.state?.notice) navigate(location.pathname, { replace: true, state: null });
    let cancelled = false;
    getMyProperties()
      .then((data) => { if (!cancelled) setProperties(data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const counts = {
    all: properties.length,
    available: properties.filter((p) => p.status === "available").length,
    rented: properties.filter((p) => p.status === "rented").length,
  };
  const visible = tab === "all" ? properties : properties.filter((p) => p.status === tab);

  async function act(id, fn) {
    setBusyId(id);
    setActionError("");
    try {
      const result = await fn();
      setProperties((prev) =>
        result ? prev.map((p) => (p.id === id ? result : p)) : prev.filter((p) => p.id !== id)
      );
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleDelete(p) {
    if (!window.confirm("এই বিজ্ঞাপনটি মুছে ফেলবেন? এটি আর ফেরত আনা যাবে না।")) return;
    act(p.id, () => deleteMyProperty(p.id));
  }

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">আমার বিজ্ঞাপন</h1>
          <p className="text-sm text-slate-500">স্বাগতম, {user.name} · My properties</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/inquiries" className={secondaryBtn}>ইনকোয়ারি দেখুন</Link>
          <Link to="/dashboard/new" className={primaryBtn}>+ নতুন বাসা যোগ করুন</Link>
        </div>
      </div>

      {notice && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
      {actionError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

      <div className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.key ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.bn}
            <span className={`rounded-full px-2 text-xs ${tab === t.key ? "bg-white/20" : "bg-slate-100"}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {loading && <p className="mt-8 text-slate-500">লোড হচ্ছে...</p>}
      {!loading && error && <p className="mt-8 rounded-xl bg-red-50 p-6 text-center text-red-700">{error}</p>}

      {!loading && !error && properties.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <p className="text-lg font-semibold">আপনার এখনো কোনো বিজ্ঞাপন নেই</p>
          <p className="mt-1 text-sm text-slate-500">ছবিসহ প্রথম বিজ্ঞাপনটি দিন, ভাড়াটিয়ারা সরাসরি যোগাযোগ করবেন।</p>
          <Link to="/dashboard/new" className={`${primaryBtn} mt-5 inline-block`}>+ প্রথম বিজ্ঞাপন দিন</Link>
        </div>
      )}

      {!loading && !error && properties.length > 0 && visible.length === 0 && (
        <p className="mt-8 rounded-xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200">এই তালিকায় কোনো বিজ্ঞাপন নেই।</p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => {
          const rented = p.status === "rented";
          const busy = busyId === p.id;
          return (
            <div key={p.id} className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${busy ? "opacity-60" : ""}`}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-emerald-50 text-4xl">🏠</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${rented ? "bg-bd-red/10 text-bd-red" : "bg-emerald-100 text-emerald-700"}`}>
                    {rented ? "ভাড়া হয়েছে" : "চলমান"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">📍 {p.area}, Dhaka</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">{taka(p.rent)} <span className="text-sm font-normal text-slate-500">/মাস</span></p>
                <p className="mt-1 text-xs text-slate-400">
                  আপডেট: {fmtDate(p.updated_at)}
                  {p.images.length === 0 && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">ছবি নেই</span>}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-medium">
                  <Link to={`/dashboard/properties/${p.id}/edit`} className="rounded-lg border border-slate-300 py-2 text-center hover:bg-slate-50">এডিট</Link>
                  {rented ? (
                    <button disabled={busy} onClick={() => act(p.id, () => markAvailable(p.id))} className="rounded-lg border border-emerald-600 py-2 text-emerald-700 hover:bg-emerald-50">আবার চালু করুন</button>
                  ) : (
                    <button disabled={busy} onClick={() => act(p.id, () => markRented(p.id))} className="rounded-lg border border-bd-red py-2 text-bd-red hover:bg-bd-red/5">ভাড়া হয়েছে</button>
                  )}
                  {!rented ? (
                    <Link to={`/properties/${p.id}`} className="rounded-lg bg-slate-100 py-2 text-center hover:bg-slate-200">সাইটে দেখুন</Link>
                  ) : <span />}
                  <button disabled={busy} onClick={() => handleDelete(p)} className="rounded-lg py-2 text-slate-500 hover:bg-red-50 hover:text-red-600">মুছুন</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}