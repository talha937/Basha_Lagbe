import { useState } from "react";

export default function PropertyGallery({ images = [], title }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="flex h-72 items-center justify-center rounded-2xl bg-emerald-50 text-6xl">🏠</div>;
  }
  const current = images[Math.min(active, images.length - 1)];

  return (
    <div>
      <div className="relative">
        <img src={current.url} alt={title} className="h-72 w-full rounded-2xl object-cover md:h-96" />
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
          {active + 1}/{images.length}
        </span>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 overflow-hidden rounded-lg ring-2 ${i === active ? "ring-emerald-600" : "ring-transparent"}`}
            >
              <img src={img.url} alt="" className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}