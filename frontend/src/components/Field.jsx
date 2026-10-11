export default function Field({ id, bn, en, error, hint, children }) {
  const Label = id ? "label" : "span";
  return (
    <div>
      <Label
        {...(id ? { htmlFor: id } : {})}
        className="mb-1 flex items-baseline gap-2 text-sm font-medium text-slate-700"
      >
        {bn}
        {en && <span className="text-xs font-normal text-slate-400">{en}</span>}
      </Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}