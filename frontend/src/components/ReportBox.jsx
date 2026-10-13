import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { REPORT_REASONS } from "../lib/labels";
import { inputClass, primaryBtn, secondaryBtn } from "../lib/ui";
import { reportListing } from "../services/api";

export default function ReportBox({ propertyId }) {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  if (user?.role === "admin") return null;

  if (done) {
    return <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{done}</p>;
  }

  if (!user) {
    return (
      <p className="mt-4 text-center text-xs text-slate-500">
        সমস্যা আছে?{" "}
        <Link to="/login" state={{ from: location.pathname }} className="text-brand-700 underline">লগইন করে রিপোর্ট করুন</Link>
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-4 w-full text-center text-xs text-slate-500 underline hover:text-red-600">
        ⚠️ এই বিজ্ঞাপনে সমস্যা আছে? রিপোর্ট করুন
      </button>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!reason) return setError("একটি কারণ বেছে নিন।");
    if (reason === "other" && details.trim().length < 10) return setError("সমস্যাটি কমপক্ষে ১০ অক্ষরে লিখুন।");

    setBusy(true);
    try {
      await reportListing(propertyId, { reason, details: details.trim() || null });
      setDone("ধন্যবাদ। রিপোর্টটি আমাদের টিমের কাছে পৌঁছেছে।");
    } catch (err) {
      if (err.status === 409) setError("আপনি এই বিজ্ঞাপনটি আগেই রিপোর্ট করেছেন।");
      else if (err.status === 400) setError("নিজের বিজ্ঞাপন রিপোর্ট করা যায় না।");
      else setError(err.fields?.body || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-red-100">
      <h3 className="text-sm font-semibold">বিজ্ঞাপনটি রিপোর্ট করুন</h3>
      <select className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="">— কারণ বেছে নিন —</option>
        {REPORT_REASONS.map((r) => <option key={r.code} value={r.code}>{r.bn}</option>)}
      </select>
      <textarea className={inputClass} rows="3" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="বিস্তারিত (ঐচ্ছিক)" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "পাঠানো হচ্ছে..." : "রিপোর্ট পাঠান"}</button>
        <button type="button" onClick={() => setOpen(false)} className={secondaryBtn}>বাতিল</button>
      </div>
    </form>
  );
}