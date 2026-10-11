import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { inputClass, primaryBtn } from "../lib/ui";
import { createContactRequest, getMyProperty, getMyRequests } from "../services/api";

function Shell({ children }) {
  return (
    <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-3 font-semibold">বাড়িওয়ালার সাথে যোগাযোগ</h3>
      {children}
    </div>
  );
}

export default function ContactBox({ propertyId }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [info, setInfo] = useState({ loading: true, isOwner: false, request: null, loadError: "" });
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role === "admin") {
      setInfo({ loading: false, isOwner: false, request: null, loadError: "" });
      return;
    }
    let cancelled = false;
    setInfo({ loading: true, isOwner: false, request: null, loadError: "" });

    (async () => {
      try {
        let isOwner = false;
        if (user.role === "landlord") {
          try {
            await getMyProperty(propertyId); // succeeds only for the owner
            isOwner = true;
          } catch { /* 404 means it is somebody else's listing */ }
        }
        let request = null;
        if (!isOwner) {
          const mine = await getMyRequests();
          request = mine.find((r) => r.listing.id === Number(propertyId)) || null;
        }
        if (!cancelled) setInfo({ loading: false, isOwner, request, loadError: "" });
      } catch (e) {
        if (!cancelled) setInfo({ loading: false, isOwner: false, request: null, loadError: e.message });
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, user, propertyId]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (message.trim().length < 5) return setError("কমপক্ষে ৫ অক্ষরের একটি বার্তা লিখুন।");

    setSending(true);
    try {
      const created = await createContactRequest({ property_id: Number(propertyId), message: message.trim() });
      setInfo((s) => ({ ...s, request: created }));
    } catch (err) {
      setError(err.message);
      if (err.status === 409) {
        try {
          const mine = await getMyRequests();
          const existing = mine.find((r) => r.listing.id === Number(propertyId));
          if (existing) setInfo((s) => ({ ...s, request: existing }));
        } catch { /* keep the error message */ }
      }
    } finally {
      setSending(false);
    }
  }

  if (authLoading || info.loading) {
    return <Shell><p className="text-sm text-slate-500">লোড হচ্ছে...</p></Shell>;
  }

  if (!user) {
    return (
      <Shell>
        <p className="text-sm text-slate-600">
          বাড়িওয়ালার সাথে যোগাযোগ করতে অ্যাকাউন্ট লাগবে। এতে ভুয়া ও স্প্যাম অনুরোধ কমে।
        </p>
        <div className="mt-3 flex gap-2">
          <Link to="/login" state={{ from: location.pathname }} className={`${primaryBtn} flex-1 text-center`}>লগইন</Link>
          <Link to="/register" state={{ from: location.pathname }} className="flex-1 rounded-lg border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">রেজিস্টার</Link>
        </div>
      </Shell>
    );
  }

  if (user.role === "admin") {
    return <Shell><p className="text-sm text-slate-500">অ্যাডমিন অ্যাকাউন্ট থেকে অনুরোধ পাঠানো যায় না।</p></Shell>;
  }

  if (info.loadError) {
    return <Shell><p className="text-sm text-red-700">{info.loadError}</p></Shell>;
  }

  if (info.isOwner) {
    return (
      <Shell>
        <p className="text-sm text-slate-600">এটি আপনার নিজের বিজ্ঞাপন।</p>
        <Link to={`/dashboard/properties/${propertyId}/edit`} className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline">এডিট করুন</Link>
      </Shell>
    );
  }

  const r = info.request;
  if (r?.status === "pending") {
    return (
      <Shell>
        <p className="text-sm font-semibold text-amber-700">⏳ আপনার অনুরোধ পাঠানো হয়েছে</p>
        <p className="mt-1 text-sm text-slate-600">বাড়িওয়ালা গ্রহণ করলে এখানে তার নম্বর দেখতে পাবেন।</p>
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{r.message}</p>
      </Shell>
    );
  }
  if (r?.status === "accepted") {
    return (
      <Shell>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">✅ বাড়িওয়ালা আপনার অনুরোধ গ্রহণ করেছেন</p>
          <p className="mt-2 text-sm text-slate-700">{r.landlord_name}</p>
          <a href={`tel:${r.landlord_phone}`} className="text-xl font-bold text-emerald-700">📞 {r.landlord_phone}</a>
        </div>
        <p className="mt-3 text-xs text-slate-600">⚠️ বাসা নিজে দেখে নেওয়ার আগে কোনো টাকা পাঠাবেন না।</p>
      </Shell>
    );
  }
  if (r?.status === "rejected") {
    return (
      <Shell>
        <p className="text-sm text-slate-700">বাড়িওয়ালা এই অনুরোধটি গ্রহণ করেননি।</p>
        <Link to="/#listings" className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline">অন্য বিজ্ঞাপন দেখুন</Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <textarea
          className={inputClass}
          rows="3"
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="নিজের পরিচয় ও কবে থেকে বাসা লাগবে, ছোট করে লিখুন"
        />
        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          🔒 বাড়িওয়ালা অনুরোধ গ্রহণ করলে তিনি আপনার নাম ও মোবাইল নম্বর ({user.phone}) দেখতে পাবেন।
          গ্রহণ না করা পর্যন্ত কেউ কারও নম্বর দেখতে পাবে না।
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={sending} className={`${primaryBtn} w-full`}>
          {sending ? "পাঠানো হচ্ছে..." : "অনুরোধ পাঠান"}
        </button>
      </form>
    </Shell>
  );
}