export default function PropertyMap({ area }) {
  const query = encodeURIComponent(`${area}, Dhaka, Bangladesh`);
  return (
    <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-semibold">লোকেশন ম্যাপ</h2>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Google Maps-এ খুলুন
        </a>
      </div>
      <iframe
        title={`Map showing ${area}`}
        src={`https://www.google.com/maps?q=${query}&output=embed`}
        className="h-72 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  );
}
