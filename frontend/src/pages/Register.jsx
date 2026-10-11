import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { inputClass, isBdMobile, normalizePhone, primaryBtn } from "../lib/ui";

export default function Register() {
  const { user, loading, register } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const local = {};
    if (form.name.trim().length < 2) local.name = "নাম লিখুন (কমপক্ষে ২ অক্ষর)";
    if (!isBdMobile(form.phone)) local.phone = "সঠিক মোবাইল নম্বর দিন, যেমন 01712345678";
    if (form.password.length < 8) local.password = "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে";
    if (Object.keys(local).length) return setErrors(local);

    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
        email: form.email.trim() || null,
        password: form.password,
      });
      // AuthContext now has the user, so the redirect at the top runs
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="অ্যাকাউন্ট খুলুন"
      subtitle="বাড়িওয়ালা হিসেবে বিজ্ঞাপন দিতে রেজিস্টার করুন"
      footer={<>আগে থেকেই অ্যাকাউন্ট আছে? <Link to="/login" className="font-semibold text-emerald-700">লগইন করুন</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field id="name" bn="আপনার নাম" en="Name" error={errors.name}>
          <input id="name" className={inputClass} value={form.name} onChange={set("name")} placeholder="যেমন: করিম রহমান" maxLength={100} />
        </Field>

        <Field id="phone" bn="মোবাইল নম্বর" en="Mobile" error={errors.phone}>
          <div className="flex">
            <span className="flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">+88</span>
            <input id="phone" inputMode="tel" className={`${inputClass} rounded-l-none`} value={form.phone} onChange={set("phone")} placeholder="01712345678" maxLength={20} />
          </div>
        </Field>

        <Field id="email" bn="ইমেইল" en="Email (optional)" error={errors.email}>
          <input id="email" type="email" className={inputClass} value={form.email} onChange={set("email")} placeholder="you@example.com" maxLength={255} />
        </Field>

        <Field id="password" bn="পাসওয়ার্ড" en="Password" hint="কমপক্ষে ৮ অক্ষর" error={errors.password}>
          <div className="relative">
            <input id="password" type={showPw ? "text" : "password"} className={`${inputClass} pr-16`} value={form.password} onChange={set("password")} autoComplete="new-password" maxLength={128} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
              {showPw ? "লুকান" : "দেখান"}
            </button>
          </div>
        </Field>

        {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

        <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
          {busy ? "অপেক্ষা করুন..." : "রেজিস্টার করুন"}
        </button>
      </form>
    </AuthLayout>
  );
}