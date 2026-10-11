export const PROPERTY_TYPES = [
  { code: "flat", bn: "ফ্ল্যাট", en: "Flat" },
  { code: "room", bn: "সিঙ্গেল রুম", en: "Single room" },
  { code: "sublet", bn: "সাবলেট", en: "Sublet" },
  { code: "studio", bn: "স্টুডিও", en: "Studio" },
  { code: "mess", bn: "মেস / হোস্টেল সিট", en: "Mess / hostel seat" },
];

export const TENANT_TYPES = [
  { code: "any", bn: "যে কেউ", en: "Anyone" },
  { code: "family", bn: "ফ্যামিলি", en: "Family" },
  { code: "bachelor_male", bn: "ব্যাচেলর (ছেলে)", en: "Bachelor (male)" },
  { code: "bachelor_female", bn: "ব্যাচেলর (মেয়ে)", en: "Bachelor (female)" },
];

export const FACILITIES = [
  { code: "lift", bn: "লিফট", en: "Lift", icon: "🛗" },
  { code: "generator", bn: "জেনারেটর", en: "Generator", icon: "⚡" },
  { code: "gas", bn: "গ্যাস লাইন", en: "Gas line", icon: "🔥" },
  { code: "parking", bn: "পার্কিং", en: "Parking", icon: "🅿️" },
  { code: "security", bn: "নিরাপত্তা প্রহরী", en: "Security guard", icon: "🛡️" },
  { code: "cctv", bn: "সিসিটিভি", en: "CCTV", icon: "📹" },
  { code: "wifi", bn: "ওয়াইফাই", en: "Wi-Fi", icon: "📶" },
  { code: "balcony", bn: "বারান্দা", en: "Balcony", icon: "🌿" },
  { code: "rooftop", bn: "ছাদ", en: "Rooftop", icon: "🏙️" },
];

const toMap = (list) => Object.fromEntries(list.map((x) => [x.code, x]));
export const PROPERTY_TYPE_MAP = toMap(PROPERTY_TYPES);
export const TENANT_TYPE_MAP = toMap(TENANT_TYPES);
export const FACILITY_MAP = toMap(FACILITIES);

// en-IN grouping gives 1,50,000, which is how Bangladesh writes lakhs
export const taka = (n) => `৳${Number(n || 0).toLocaleString("en-IN")}`;

export const REPORT_REASONS = [
  { code: "scam", bn: "প্রতারণা / ভুয়া বিজ্ঞাপন" },
  { code: "wrong_price", bn: "ভাড়া ভুল দেখানো হয়েছে" },
  { code: "duplicate", bn: "একই বিজ্ঞাপন বারবার দেওয়া হয়েছে" },
  { code: "unavailable", bn: "বাসা আর খালি নেই" },
  { code: "wrong_info", bn: "তথ্য বা ছবি ভুল" },
  { code: "other", bn: "অন্য কারণ" },
];
export const REPORT_REASON_MAP = toMap(REPORT_REASONS);

export const VERIFY_METHODS = [
  { code: "phone_call", bn: "ফোনে কথা বলে" },
  { code: "site_visit", bn: "সরেজমিনে দেখে" },
  { code: "ownership_document", bn: "মালিকানার কাগজ দেখে" },
];

export const REQUEST_STATUS = {
  pending: { bn: "অপেক্ষায়", cls: "bg-amber-100 text-amber-700" },
  accepted: { bn: "গৃহীত", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { bn: "প্রত্যাখ্যাত", cls: "bg-red-100 text-red-700" },
};