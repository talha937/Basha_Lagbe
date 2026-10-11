export default function VerifiedBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow ${className}`}>
      ✔ যাচাইকৃত
    </span>
  );
}