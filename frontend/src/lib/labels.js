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