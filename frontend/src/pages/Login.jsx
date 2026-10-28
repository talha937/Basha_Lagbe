import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { homePath, inputClass, primaryBtn } from "../lib/ui";

export default function Login() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

       if (!loading && user) return <Navigate to={location.state?.from || homePath(user)} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) return setError("মোবাইল নম্বর/ইমেইল এবং পাসওয়ার্ড দিন");
    setBusy(true);
    try {
      await login(identifier.trim(), password, role);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="লগইন"
      subtitle="আপনার বিজ্ঞাপনগুলো ম্যানেজ করুন"
      footer={<>নতুন? <Link to="/register" className="font-semibold text-brand-700">রেজিস্টার করুন</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field id="identifier" bn="মোবাইল নম্বর বা ইমেইল" en="Mobile or email">
          <input id="identifier" className={inputClass} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="01712345678" autoComplete="username" maxLength={255} />
        </Field>

        <Field bn="অ্যাকাউন্টের ধরন" en="Account type">
          <div className="grid grid-cols-2 gap-2">
            {[["tenant", "ভাড়াটিয়া"], ["landlord", "বাড়িওয়ালা"]].map(([value, label]) => (
              <button type="button" key={value} onClick={() => setRole(value)} className={`rounded-lg border px-3 py-2 text-sm ${role === value ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-slate-300"}`}>
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field id="password" bn="পাসওয়ার্ড" en="Password">
          <div className="relative">
            <input id="password" type={showPw ? "text" : "password"} className={`${inputClass} pr-16`} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" maxLength={128} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
              {showPw ? "লুকান" : "দেখান"}
            </button>
          </div>
        </Field>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
          {busy ? "অপেক্ষা করুন..." : "লগইন"}
        </button>
      </form>
    </AuthLayout>
  );
}