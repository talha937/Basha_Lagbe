import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { REQUEST_STATUS } from "../lib/labels";
import { fmtDateTime } from "../lib/ui";
import { decideRequest, getLandlordRequests } from "../services/api";

const TABS = [
  { key: "pending", bn: "অপেক্ষায়" },
  { key: "accepted", bn: "গৃহীত" },
  { key: "rejected", bn: "প্রত্যাখ্যাত" },
  { key: "all", bn: "সব" },
];

export default function Requests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [tab, setTab] = useState("pending");
  const [busyId, setBusyId] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getLandlordRequests()
      .then((d) => { if (!cancelled) setItems(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [version]);

  const count = (key) => (key === "all" ? items.length : items.filter((r) => r.status === key).length);
  const visible = tab === "all" ? items : items.filter((r) => r.status === tab);

  async function decide(r, status) {
    const message =
      status === "accepted"
        ? `গ্রহণ করলে ${r.tenant_name} আপনার মোবাইল নম্বর দেখতে পাবেন এবং আপনিও তার নম্বর দেখতে পাবেন। এগিয়ে যাবেন?`
        : "প্রত্যাখ্যান করলে এই সিদ্ধান্ত আর বদলানো যাবে না। নিশ্চিত?";
    if (!window.confirm(message)) return;

    setBusyId(r.id);
    setActionError("");
    try {
      const updated = await decideRequest(r.id, status);
      setItems((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
    } catch (e) {
      setActionError(e.message);
      if (e.status === 409) setVersion((v) => v + 1); // someone already decided it: resync
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/dashboard" className="text-sm text-emerald-700">← ড্যাশবোর্ডে ফিরুন</Link>
      <h1 className="mt-2 text-2xl font-bold">ভাড়াটিয়ার অনুরোধ <span className="text-sm font-normal text-slate-400">Requests</span></h1>

      <div className="mt-5 inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {t.bn}
            <span className={`rounded-full px-2 text-xs ${tab === t.key ? "bg-white/20" : "bg-slate-100"}`}>{count(t.key)}</span>
          </button>
        ))}
      </div>

      {actionError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}
      {loading && <p className="mt-6 text-slate-500">লোড হচ্ছে...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p className="mt-6 rounded-xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200">এই তালিকায় কোনো অনুরোধ নেই।</p>
      )}

      <div className="mt-6 space-y-4">
        {visible.map((r) => {
          const s = REQUEST_STATUS[r.status];
          const busy = busyId === r.id;
          return (
            <div key={r.id} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${busy ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{r.property_title}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.bn}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{r.message}</p>
              <p className="mt-3 text-sm text-slate-500">{r.tenant_name} · {fmtDateTime(r.created_at)}</p>

              {r.status === "accepted" && r.tenant_phone && (
                <a href={`tel:${r.tenant_phone}`} className="mt-2 inline-block text-lg font-bold text-emerald-700">📞 {r.tenant_phone}</a>
              )}

              {r.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <button disabled={busy} onClick={() => decide(r, "accepted")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">গ্রহণ করুন</button>
                  <button disabled={busy} onClick={() => decide(r, "rejected")} className="rounded-lg border border-bd-red px-4 py-2 text-sm font-semibold text-bd-red hover:bg-bd-red/5">প্রত্যাখ্যান</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}