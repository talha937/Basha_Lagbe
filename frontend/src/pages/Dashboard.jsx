import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { taka } from "../lib/labels";
import { daysUntil, fmtDate, primaryBtn, secondaryBtn } from "../lib/ui";
import {
  deleteMyProperty, getLandlordRequests, getMyProperties, markAvailable, markRented, renewProperty,
} from "../services/api";

function stateOf(p) {
  if (p.status === "rented") return "rented";
  if (p.moderation_status === "pending_review") return "pending";
  if (p.moderation_status === "rejected") return "rejected";
  if (p.expires_at && daysUntil(p.expires_at) <= 0) return "expired";
  return "live";
}

const BADGES = {
  live: { bn: "চলমান", cls: "bg-brand-100 text-brand-700" },
  pending: { bn: "রিভিউয়ের অপেক্ষায়", cls: "bg-amber-100 text-amber-700" },
  rejected: { bn: "প্রত্যাখ্যাত", cls: "bg-red-100 text-red-700" },
  expired: { bn: "মেয়াদ শেষ", cls: "bg-slate-200 text-slate-700" },
  rented: { bn: "ভাড়া হয়েছে", cls: "bg-bd-red/10 text-bd-red" },
};

const TABS = [
  { key: "all", bn: "সব", match: () => true },
  { key: "live", bn: "চলমান", match: (s) => s === "live" },
  { key: "attention", bn: "মনোযোগ দরকার", match: (s) => ["pending", "rejected", "expired"].includes(s) },
  { key: "rented", bn: "ভাড়া হয়েছে", match: (s) => s === "rented" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice] = useState(location.state?.notice || "");
  const [properties, setProperties] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
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
    getLandlordRequests("pending")
      .then((r) => { if (!cancelled) setPendingCount(r.length); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const withState = properties.map((p) => ({ p, s: stateOf(p) }));
  const currentTab = TABS.find((t) => t.key === tab);
  const countFor = (t) => withState.filter(({ s }) => t.match(s)).length;
  const visible = withState.filter(({ s }) => currentTab.match(s));

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">আমার বিজ্ঞাপন</h1>
          <p className="text-sm text-slate-500">স্বাগতম, {user.name} · My properties</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/requests" className={secondaryBtn}>
            অনুরোধ{pendingCount > 0 ? ` (${pendingCount} নতুন)` : ""}
          </Link>
          <Link to="/dashboard/new" className={primaryBtn}>+ নতুন বাসা যোগ করুন</Link>
        </div>
      </div>

      {notice && <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{notice}</p>}
      {actionError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

      <div className="mt-6 inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {t.bn}
            <span className={`rounded-full px-2 text-xs ${tab === t.key ? "bg-white/20" : "bg-slate-100"}`}>{countFor(t)}</span>
          </button>
        ))}
      </div>

      {loading && <p className="mt-8 text-slate-500">লোড হচ্ছে...</p>}
      {!loading && error && <p className="mt-8 rounded-xl bg-red-50 p-6 text-center text-red-700">{error}</p>}

      {!loading && !error && properties.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <p className="text-lg font-semibold">আপনার এখনো কোনো বিজ্ঞাপন নেই</p>
          <p className="mt-1 text-sm text-slate-500">ছবিসহ প্রথম বিজ্ঞাপনটি জমা দিন। রিভিউয়ের পর সবাই দেখতে পাবে।</p>
          <Link to="/dashboard/new" className={`${primaryBtn} mt-5 inline-block`}>+ প্রথম বিজ্ঞাপন দিন</Link>
        </div>
      )}

      {!loading && !error && properties.length > 0 && visible.length === 0 && (
        <p className="mt-8 rounded-xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200">এই তালিকায় কোনো বিজ্ঞাপন নেই।</p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ p, s }) => {
          const busy = busyId === p.id;
          const left = p.expires_at ? daysUntil(p.expires_at) : null;
          const soon = s === "live" && left !== null && left <= 5;
          const badge = BADGES[s];

          return (
            <div key={p.id} className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${busy ? "opacity-60" : ""}`}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-brand-50 text-4xl">🏠</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.bn}</span>
                </div>
                <p className="text-sm text-slate-500">📍 {p.area}, Dhaka</p>
                <p className="mt-1 text-lg font-bold text-brand-700">{taka(p.rent)} <span className="text-sm font-normal text-slate-500">/মাস</span></p>

                {p.is_verified && <p className="mt-1 text-xs font-semibold text-brand-700">✔ যাচাইকৃত</p>}
                {p.images.length === 0 && <p className="mt-1 text-xs text-amber-700">ছবি নেই। ছবি যোগ করলে বেশি অনুরোধ আসে।</p>}

                {s === "pending" && (
                  <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">আমাদের টিম রিভিউ করছে। অনুমোদনের পর সবাই দেখতে পাবে।</p>
                )}
                {s === "rejected" && (
                  <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                    <strong>কারণ:</strong> {p.moderation_note || "উল্লেখ নেই"}<br />ঠিক করে আবার জমা দিন।
                  </p>
                )}
                {s === "live" && left !== null && (
                  <p className={`mt-2 text-xs ${soon ? "font-semibold text-amber-700" : "text-slate-500"}`}>
                    ⏳ মেয়াদ: আর {left} দিন ({fmtDate(p.expires_at)} পর্যন্ত)
                  </p>
                )}
                {s === "expired" && (
                  <p className="mt-2 rounded-lg bg-slate-100 p-2 text-xs text-slate-700">মেয়াদ শেষ, তাই বিজ্ঞাপনটি আর দেখা যাচ্ছে না। আবার দেখাতে রিনিউ করুন।</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-medium">
                  <Link to={`/dashboard/properties/${p.id}/edit`} className="rounded-lg border border-slate-300 py-2 text-center hover:bg-slate-50">এডিট</Link>

                  {s === "rented" ? (
                    <button disabled={busy} onClick={() => act(p.id, () => markAvailable(p.id))} className="rounded-lg border border-brand-600 py-2 text-brand-700 hover:bg-brand-50">আবার চালু করুন</button>
                  ) : (
                    <button disabled={busy} onClick={() => act(p.id, () => markRented(p.id))} className="rounded-lg border border-bd-red py-2 text-bd-red hover:bg-bd-red/5">ভাড়া হয়েছে</button>
                  )}

                  {(s === "live" || s === "expired") && (
                    <button
                      disabled={busy}
                      onClick={() => act(p.id, () => renewProperty(p.id))}
                      className={`rounded-lg py-2 ${s === "expired" || soon ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-slate-300 hover:bg-slate-50"}`}
                    >
                      রিনিউ করুন
                    </button>
                  )}
                  {s === "live" && (
                    <Link to={`/properties/${p.id}`} className="rounded-lg bg-slate-100 py-2 text-center hover:bg-slate-200">সাইটে দেখুন</Link>
                  )}

                  <button disabled={busy} onClick={() => handleDelete(p)} className="col-span-2 rounded-lg py-1.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600">মুছে ফেলুন</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}