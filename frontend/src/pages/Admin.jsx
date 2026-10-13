import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VerifiedBadge from "../components/VerifiedBadge";
import {
  FACILITY_MAP, PROPERTY_TYPE_MAP, REPORT_REASON_MAP, TENANT_TYPE_MAP, VERIFY_METHODS, taka,
} from "../lib/labels";
import { fmtDate, fmtDateTime, inputClass, primaryBtn, secondaryBtn } from "../lib/ui";
import {
  approveListing, getAdminListings, getAdminReports, getAdminSummary, rejectListing,
  resolveReport, unverifyListing, verifyListing,
} from "../services/api";

const PANELS = {
  approve: { title: "অনুমোদন", label: "নোট (ঐচ্ছিক)", min: 0, button: "অনুমোদন করুন" },
  reject: { title: "প্রত্যাখ্যান", label: "কারণ (বাড়িওয়ালা এটি দেখবেন)", min: 5, button: "প্রত্যাখ্যান করুন" },
  verify: { title: "যাচাই", label: "কী যাচাই করেছেন? (কমপক্ষে ১০ অক্ষর)", min: 10, button: "যাচাইকৃত করুন" },
  unverify: { title: "যাচাই সরান", label: "কারণ", min: 5, button: "যাচাই সরান" },
};

function ListingCard({ p, onChanged }) {
  const [panel, setPanel] = useState(null);
  const [note, setNote] = useState("");
  const [method, setMethod] = useState("phone_call");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (name) => { setPanel(panel === name ? null : name); setNote(""); setError(""); };

  async function submit(e) {
    e.preventDefault();
    setError("");
    const cfg = PANELS[panel];
    if (note.trim().length < cfg.min) return setError(`কমপক্ষে ${cfg.min} অক্ষর লিখুন।`);

    setBusy(true);
    try {
      let updated;
      if (panel === "approve") updated = await approveListing(p.id, note.trim());
      else if (panel === "reject") updated = await rejectListing(p.id, note.trim());
      else if (panel === "verify") updated = await verifyListing(p.id, method, note.trim());
      else updated = await unverifyListing(p.id, note.trim());
      setPanel(null);
      setNote("");
      onChanged(updated);
    } catch (err) {
      setError(err.fields?.note || err.message);
    } finally {
      setBusy(false);
    }
  }

  const status = p.moderation_status;
  const btn = "rounded-lg border px-3 py-2 text-sm font-medium";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{p.title}</h3>
          <p className="text-sm text-slate-500">
            📍 {p.area} · {taka(p.rent)}/মাস · {PROPERTY_TYPE_MAP[p.property_type]?.bn} · {TENANT_TYPE_MAP[p.tenant_type]?.bn}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.is_verified && <VerifiedBadge />}
          {p.open_report_count > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">⚠ {p.open_report_count}টি রিপোর্ট</span>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        বাড়িওয়ালা: <strong>{p.owner_name || "—"}</strong>
        {p.owner_phone && <> · <a href={`tel:${p.owner_phone}`} className="font-semibold text-brand-700">{p.owner_phone}</a></>}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {p.bedrooms} Beds · {p.bathrooms} Baths{p.sqft ? ` · ${p.sqft} sqft` : ""}
        {p.floor != null ? ` · ${p.floor} তলা` : ""} · অগ্রিম {p.advance_months} মাস
        {p.service_charge ? ` · সার্ভিস ${taka(p.service_charge)}` : ""}
      </p>

      {p.facilities.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">{p.facilities.map((c) => FACILITY_MAP[c]?.bn).filter(Boolean).join(" · ")}</p>
      )}
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{p.description}</p>

      {p.images.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {p.images.slice(0, 6).map((img) => (
            <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
              <img src={img.url} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-amber-700">কোনো ছবি নেই</p>
      )}

      {status === "rejected" && p.moderation_note && (
        <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">প্রত্যাখ্যানের কারণ: {p.moderation_note}</p>
      )}
      {status === "approved" && p.expires_at && (
        <p className="mt-3 text-xs text-slate-500">মেয়াদ: {fmtDate(p.expires_at)} পর্যন্ত{p.verified_at ? ` · যাচাই: ${fmtDate(p.verified_at)}` : ""}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(status === "pending_review" || status === "rejected") && (
          <button onClick={() => toggle("approve")} className={`${btn} border-brand-600 text-brand-700 hover:bg-brand-50`}>✔ অনুমোদন</button>
        )}
        {status !== "rejected" && (
          <button onClick={() => toggle("reject")} className={`${btn} border-bd-red text-bd-red hover:bg-bd-red/5`}>✖ প্রত্যাখ্যান</button>
        )}
        {status === "approved" && !p.is_verified && (
          <button onClick={() => toggle("verify")} className={`${btn} border-brand-600 text-brand-700 hover:bg-brand-50`}>🛡 যাচাই করুন</button>
        )}
        {status === "approved" && p.is_verified && (
          <button onClick={() => toggle("unverify")} className={`${btn} border-slate-300 text-slate-600 hover:bg-slate-50`}>যাচাই সরান</button>
        )}
      </div>

      {panel && (
        <form onSubmit={submit} noValidate className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold">{PANELS[panel].title}</p>
          {panel === "verify" && (
            <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
              {VERIFY_METHODS.map((m) => <option key={m.code} value={m.code}>{m.bn}</option>)}
            </select>
          )}
          <label className="block text-xs text-slate-600">{PANELS[panel].label}</label>
          <textarea className={inputClass} rows="3" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "অপেক্ষা করুন..." : PANELS[panel].button}</button>
            <button type="button" onClick={() => setPanel(null)} className={secondaryBtn}>বাতিল</button>
          </div>
        </form>
      )}
    </div>
  );
}

function ReportCard({ r, onChanged }) {
  const [panel, setPanel] = useState(null); // dismissed | action_taken
  const [note, setNote] = useState("");
  const [unpublish, setUnpublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (note.trim().length < 5) return setError("কমপক্ষে ৫ অক্ষরের নোট লিখুন।");
    setBusy(true);
    try {
      await resolveReport(r.id, { outcome: panel, note: note.trim(), unpublish: panel === "action_taken" && unpublish });
      onChanged();
    } catch (err) {
      setError(err.fields?.body || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{REPORT_REASON_MAP[r.reason]?.bn || r.reason}</p>
          <p className="text-sm text-slate-500">
            বিজ্ঞাপন: <Link to={`/properties/${r.property_id}`} className="text-brand-700 underline">{r.property_title}</Link>
            {" "}({r.property_moderation_status})
          </p>
        </div>
        {r.status === "open" && r.open_reports_for_listing > 1 && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">এই বিজ্ঞাপনে মোট {r.open_reports_for_listing}টি রিপোর্ট</span>
        )}
      </div>

      {r.details && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{r.details}</p>}
      <p className="mt-2 text-xs text-slate-400">রিপোর্টার: {r.reporter_name} · {fmtDateTime(r.created_at)}</p>

      {r.status !== "open" && (
        <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
          {r.status === "dismissed" ? "খারিজ" : "ব্যবস্থা নেওয়া হয়েছে"}: {r.resolution_note}
          {r.reviewed_at ? ` (${fmtDateTime(r.reviewed_at)})` : ""}
        </p>
      )}

      {r.status === "open" && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => { setPanel(panel === "dismissed" ? null : "dismissed"); setNote(""); setError(""); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">খারিজ করুন</button>
            <button onClick={() => { setPanel(panel === "action_taken" ? null : "action_taken"); setNote(""); setError(""); }} className="rounded-lg border border-bd-red px-3 py-2 text-sm font-medium text-bd-red hover:bg-bd-red/5">ব্যবস্থা নিয়েছি</button>
          </div>

          {panel && (
            <form onSubmit={submit} noValidate className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4">
              <label className="block text-xs text-slate-600">
                {panel === "dismissed" ? "কেন খারিজ?" : "কী ব্যবস্থা নেওয়া হয়েছে? (বিজ্ঞাপন সরালে বাড়িওয়ালা এই নোট দেখবেন)"}
              </label>
              <textarea className={inputClass} rows="3" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
              {panel === "action_taken" && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={unpublish} onChange={(e) => setUnpublish(e.target.checked)} />
                  বিজ্ঞাপনটি সাইট থেকে সরিয়ে দিন (প্রত্যাখ্যান)
                </label>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "অপেক্ষা করুন..." : "নিশ্চিত করুন"}</button>
                <button type="button" onClick={() => setPanel(null)} className={secondaryBtn}>বাতিল</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("pending_review"); // pending_review | approved | rejected | reports
  const [reportFilter, setReportFilter] = useState("open");
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const refreshSummary = useCallback(() => {
    getAdminSummary().then(setSummary).catch(() => {});
  }, []);
  const reload = () => { setVersion((v) => v + 1); refreshSummary(); };

  useEffect(() => { refreshSummary(); }, [refreshSummary]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setItems([]);
    const request = tab === "reports" ? getAdminReports(reportFilter) : getAdminListings(tab);
    request
      .then((d) => { if (!cancelled) setItems(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, reportFilter, version]);

  function onListingChanged(updated) {
    setItems((prev) =>
      updated.moderation_status === tab
        ? prev.map((x) => (x.id === updated.id ? updated : x))
        : prev.filter((x) => x.id !== updated.id)
    );
    refreshSummary();
  }

  const tabs = [
    { key: "pending_review", bn: "রিভিউ কিউ", n: summary?.pending_listings },
    { key: "approved", bn: "অনুমোদিত" },
    { key: "rejected", bn: "প্রত্যাখ্যাত" },
    { key: "reports", bn: "রিপোর্ট", n: summary?.open_reports },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">অ্যাডমিন প্যানেল <span className="text-sm font-normal text-slate-400">Admin</span></h1>

      <div className="mt-5 inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {t.bn}
            {t.n > 0 && <span className={`rounded-full px-2 text-xs ${tab === t.key ? "bg-white/20" : "bg-bd-red text-white"}`}>{t.n}</span>}
          </button>
        ))}
      </div>

      {tab === "reports" && (
        <select className={`${inputClass} mt-4 max-w-xs`} value={reportFilter} onChange={(e) => setReportFilter(e.target.value)}>
          <option value="open">খোলা রিপোর্ট</option>
          <option value="action_taken">ব্যবস্থা নেওয়া হয়েছে</option>
          <option value="dismissed">খারিজ</option>
        </select>
      )}

      {loading && <p className="mt-6 text-slate-500">লোড হচ্ছে...</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="mt-6 rounded-xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200">এখানে কিছু নেই 🎉</p>
      )}

      <div className="mt-6 space-y-4">
        {tab === "reports"
          ? items.map((r) => <ReportCard key={r.id} r={r} onChanged={reload} />)
          : items.map((p) => <ListingCard key={p.id} p={p} onChanged={onListingChanged} />)}
      </div>
    </main>
  );
}