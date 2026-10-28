import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { primaryBtn } from "../lib/ui";

export default function Profile() {
  const { user } = useAuth();
  const isLandlord = user.role === "landlord";
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold text-brand-700">আপনার আলাদা প্রোফাইল ড্যাশবোর্ড</p>
        <h1 className="mt-2 text-2xl font-bold">{user.name}</h1>
        <p className="mt-1 text-slate-500">{isLandlord ? "বাড়িওয়ালা" : "ভাড়াটিয়া"}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-500">মোবাইল</dt><dd className="mt-1 font-semibold">{user.phone}</dd></div>
          <div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-500">ইমেইল</dt><dd className="mt-1 font-semibold">{user.email || "দেওয়া হয়নি"}</dd></div>
        </dl>
        <Link to={isLandlord ? "/dashboard" : "/my-requests"} className={`${primaryBtn} mt-6 inline-block`}>
          {isLandlord ? "আমার বিজ্ঞাপনে যান" : "আমার অনুরোধ দেখুন"}
        </Link>
      </div>
    </main>
  );
}
