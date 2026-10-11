import { useRef } from "react";

function Thumb({ src, cover, isNew, onRemove }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-slate-200">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="ছবি মুছুন"
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black"
      >
        ✕
      </button>
      {cover && <span className="absolute bottom-1.5 left-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">কভার</span>}
      {isNew && <span className="absolute bottom-1.5 right-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">নতুন</span>}
    </div>
  );
}

export default function PhotoUploader({ existing, newFiles, max, error, onAdd, onRemoveNew, onRemoveExisting }) {
  const inputRef = useRef(null);
  const total = existing.length + newFiles.length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {existing.map((img, i) => (
          <Thumb key={`e${img.id}`} src={img.url} cover={i === 0} onRemove={() => onRemoveExisting(img.id)} />
        ))}
        {newFiles.map((f, i) => (
          <Thumb key={f.url} src={f.url} isNew cover={existing.length === 0 && i === 0} onRemove={() => onRemoveNew(f.url)} />
        ))}
        {total < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <span className="text-2xl leading-none">＋</span>
            <span className="text-xs">ছবি যোগ করুন</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="mt-3 text-xs text-slate-500">
        {total}/{max}টি ছবি · JPG, PNG বা WebP · প্রতিটি সর্বোচ্চ ৫ MB · প্রথম ছবিটি কভার হিসেবে দেখাবে
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}