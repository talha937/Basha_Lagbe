export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
export const primaryBtn =
  "rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60";
export const secondaryBtn =
  "rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

// Mirrors the backend: 01712345678, +8801712345678 and Bangla digits are all accepted
export function normalizePhone(value) {
  let s = value
    .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
    .replace(/[\s\-()]/g, "");
  if (s.startsWith("+88")) s = s.slice(3);
  else if (s.startsWith("88") && s.length === 13) s = s.slice(2);
  return s;
}

export const isBdMobile = (value) => /^01[3-9]\d{8}$/.test(normalizePhone(value));

// Where each role lands after login
export const homePath = (user) =>
  user?.role === "admin" ? "/admin" : user?.role === "landlord" ? "/dashboard" : "/my-requests";

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Whole days left until a date (0 or less means expired)
export const daysUntil = (iso) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);