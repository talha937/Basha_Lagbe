import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Field from "../components/Field";
import PhotoUploader from "../components/PhotoUploader";
import PropertyCard from "../components/PropertyCard";
import { FACILITIES, PROPERTY_TYPES, TENANT_TYPES } from "../lib/labels";
import { inputClass, primaryBtn, secondaryBtn } from "../lib/ui";
import {
  createMyProperty, deleteImage, getAreas, getMyProperty, updateMyProperty, uploadImages,
} from "../services/api";

const MAX_PHOTOS = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

const emptyForm = {
  title: "", areaText: "", property_type: "flat", tenant_type: "any",
  rent: "", service_charge: "0", advance_months: "2",
  bedrooms: "", bathrooms: "", sqft: "", floor: "", available_from: "",
  facilities: [], description: "",
};

function Section({ title, sub, children }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 font-semibold">
        {title} <span className="ml-1 text-xs font-normal text-slate-400">{sub}</span>
      </h2>
      {children}
    </section>
  );
}

const chip = (active) =>
  `rounded-full border px-3 py-1.5 text-sm ${
    active ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
  }`;

export default function PropertyForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice || "";

  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [existing, setExisting] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const latestFiles = useRef([]);

  useEffect(() => { latestFiles.current = newFiles; }, [newFiles]);
  useEffect(() => () => latestFiles.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  useEffect(() => {
    getAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    setLoading(true);
    getMyProperty(id)
      .then((p) => {
        if (cancelled) return;
        setForm({
          title: p.title, areaText: p.area, property_type: p.property_type, tenant_type: p.tenant_type,
          rent: String(p.rent), service_charge: String(p.service_charge), advance_months: String(p.advance_months),
          bedrooms: String(p.bedrooms), bathrooms: String(p.bathrooms),
          sqft: p.sqft == null ? "" : String(p.sqft), floor: p.floor == null ? "" : String(p.floor),
          available_from: p.available_from || "", facilities: p.facilities, description: p.description,
        });
        setExisting(p.images);
      })
      .catch((e) => { if (!cancelled) setLoadError(e.status === 404 ? "এই বিজ্ঞাপনটি পাওয়া যায়নি।" : e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [editing, id, location.key]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleFacility = (code) =>
    setForm((f) => ({
      ...f,
      facilities: f.facilities.includes(code) ? f.facilities.filter((c) => c !== code) : [...f.facilities, code],
    }));

  function addFiles(fileList) {
    setPhotoError("");
    const incoming = Array.from(fileList);
    const room = MAX_PHOTOS - existing.length - newFiles.length;
    const accepted = [];
    const problems = [];
    for (const file of incoming) {
      if (!OK_TYPES.includes(file.type)) problems.push(`${file.name}: শুধু JPG, PNG বা WebP`);
      else if (file.size > MAX_BYTES) problems.push(`${file.name}: ৫ MB এর বেশি`);
      else if (accepted.length >= room) { problems.push(`সর্বোচ্চ ${MAX_PHOTOS}টি ছবি`); break; }
      else accepted.push({ file, url: URL.createObjectURL(file) });
    }
    if (accepted.length) setNewFiles((prev) => [...prev, ...accepted]);
    if (problems.length) setPhotoError(problems.slice(0, 3).join(" · "));
  }

  function removeNew(url) {
    URL.revokeObjectURL(url);
    setNewFiles((prev) => prev.filter((f) => f.url !== url));
  }

  async function removeExisting(imageId) {
    if (!window.confirm("এই ছবিটি মুছে ফেলবেন?")) return;
    try {
      await deleteImage(id, imageId);
      setExisting((prev) => prev.filter((i) => i.id !== imageId));
    } catch (e) {
      setPhotoError(e.message);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const area = areas.find((a) => a.name.toLowerCase() === form.areaText.trim().toLowerCase());
    const rent = Number(form.rent);
    const local = {};
    if (form.title.trim().length < 5) local.title = "শিরোনাম কমপক্ষে ৫ অক্ষর";
    if (!area) local.areaText = "তালিকা থেকে একটি এলাকা বেছে নিন";
    if (!form.rent || rent < 1000 || rent > 1000000) local.rent = "ভাড়া ১,০০০ থেকে ১০,০০,০০০ টাকার মধ্যে দিন";
    if (!(Number(form.bedrooms) >= 1)) local.bedrooms = "শোবার ঘর দিন (কমপক্ষে ১)";
    if (!(Number(form.bathrooms) >= 1)) local.bathrooms = "বাথরুম দিন (কমপক্ষে ১)";
    if (form.description.trim().length < 10) local.description = "বিবরণ কমপক্ষে ১০ অক্ষর";
    if (Object.keys(local).length) {
      setErrors(local);
      return setFormError("লাল চিহ্নিত ঘরগুলো ঠিক করুন।");
    }

    const payload = {
      title: form.title.trim(),
      area_id: area.id,
      property_type: form.property_type,
      tenant_type: form.tenant_type,
      rent,
      service_charge: Number(form.service_charge || 0),
      advance_months: Number(form.advance_months || 0),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      sqft: form.sqft ? Number(form.sqft) : null,
      floor: form.floor !== "" ? Number(form.floor) : null,
      available_from: form.available_from || null,
      facilities: form.facilities,
      description: form.description.trim(),
    };

    setBusy(true);
    let saved;
    try {
      saved = editing ? await updateMyProperty(id, payload) : await createMyProperty(payload);
    } catch (err) {
      const fields = { ...err.fields };
      if (fields.area_id) { fields.areaText = fields.area_id; delete fields.area_id; }
      setErrors(fields);
      setFormError(err.message);
      setBusy(false);
      return;
    }

    if (newFiles.length) {
      try {
        await uploadImages(saved.id, newFiles.map((f) => f.file));
      } catch (err) {
        // The listing is saved; go to its edit page so a retry can't create a duplicate
        newFiles.forEach((f) => URL.revokeObjectURL(f.url));
        setNewFiles([]);
        setBusy(false);
        navigate(`/dashboard/properties/${saved.id}/edit`, {
          replace: true,
          state: { notice: `বিজ্ঞাপন সেভ হয়েছে, কিন্তু ছবি আপলোড হয়নি: ${err.message}` },
        });
        return;
      }
    }

    newFiles.forEach((f) => URL.revokeObjectURL(f.url));
    navigate("/dashboard", {
      state: { notice: editing ? "পরিবর্তন সেভ হয়েছে ✅" : "বিজ্ঞাপন প্রকাশিত হয়েছে ✅" },
    });
  }

  if (loading) return <p className="py-20 text-center text-slate-500">লোড হচ্ছে...</p>;
  if (loadError) {
    return (
      <main className="py-20 text-center">
        <p className="text-red-700">{loadError}</p>
        <Link to="/dashboard" className="mt-3 inline-block text-emerald-700 underline">ড্যাশবোর্ডে ফিরুন</Link>
      </main>
    );
  }

  const preview = {
    id: 0,
    title: form.title.trim() || "আপনার বিজ্ঞাপনের শিরোনাম",
    area: form.areaText.trim() || "এলাকা",
    rent: Number(form.rent) || 0,
    bedrooms: Number(form.bedrooms) || 0,
    bathrooms: Number(form.bathrooms) || 0,
    sqft: Number(form.sqft) || null,
    tenant_type: form.tenant_type,
    facilities: form.facilities,
    image_url: existing[0]?.url || newFiles[0]?.url || null,
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/dashboard" className="text-sm text-emerald-700">← ড্যাশবোর্ডে ফিরুন</Link>
      <h1 className="mt-2 text-2xl font-bold">
        {editing ? "বিজ্ঞাপন এডিট করুন" : "নতুন বাসা যোগ করুন"}
        <span className="ml-2 text-sm font-normal text-slate-400">{editing ? "Edit listing" : "Add property"}</span>
      </h1>
      {notice && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}

      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="ছবি" sub="Photos">
            <PhotoUploader
              existing={existing} newFiles={newFiles} max={MAX_PHOTOS} error={photoError}
              onAdd={addFiles} onRemoveNew={removeNew} onRemoveExisting={removeExisting}
            />
          </Section>

          <Section title="মূল তথ্য" sub="Basics">
            <div className="space-y-4">
              <Field id="title" bn="শিরোনাম" en="Title" error={errors.title}>
                <input id="title" className={inputClass} value={form.title} onChange={set("title")} maxLength={150} placeholder="যেমন: ধানমন্ডিতে ২ বেডরুমের ফ্ল্যাট" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="area" bn="এলাকা" en="Area" error={errors.areaText} hint="টাইপ করে তালিকা থেকে বেছে নিন">
                  <input id="area" list="form-area-options" className={inputClass} value={form.areaText} onChange={set("areaText")} placeholder="যেমন: Mirpur 10" autoComplete="off" />
                  <datalist id="form-area-options">
                    {areas.map((a) => <option key={a.id} value={a.name} label={`${a.thana} thana`} />)}
                  </datalist>
                </Field>

                <Field id="ptype" bn="ধরন" en="Type" error={errors.property_type}>
                  <select id="ptype" className={inputClass} value={form.property_type} onChange={set("property_type")}>
                    {PROPERTY_TYPES.map((t) => <option key={t.code} value={t.code}>{t.bn} ({t.en})</option>)}
                  </select>
                </Field>
              </div>

              <Field bn="কাদের জন্য" en="Suitable for" error={errors.tenant_type}>
                <div className="flex flex-wrap gap-2">
                  {TENANT_TYPES.map((t) => (
                    <button type="button" key={t.code} aria-pressed={form.tenant_type === t.code} onClick={() => setForm((f) => ({ ...f, tenant_type: t.code }))} className={chip(form.tenant_type === t.code)}>
                      {t.bn}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          <Section title="ভাড়া ও খরচ" sub="Rent & costs">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="rent" bn="মাসিক ভাড়া (৳)" en="Monthly rent" error={errors.rent}>
                <input id="rent" type="number" min="0" inputMode="numeric" className={inputClass} value={form.rent} onChange={set("rent")} placeholder="18000" />
              </Field>
              <Field id="service" bn="সার্ভিস চার্জ (৳)" en="Service charge" error={errors.service_charge}>
                <input id="service" type="number" min="0" inputMode="numeric" className={inputClass} value={form.service_charge} onChange={set("service_charge")} />
              </Field>
              <Field id="advance" bn="অগ্রিম (মাস)" en="Advance months" error={errors.advance_months}>
                <input id="advance" type="number" min="0" max="12" className={inputClass} value={form.advance_months} onChange={set("advance_months")} />
              </Field>
              <Field id="avail" bn="কবে থেকে খালি" en="Available from" error={errors.available_from} hint="ফাঁকা রাখলে 'এখনই' দেখাবে">
                <input id="avail" type="date" className={inputClass} value={form.available_from} onChange={set("available_from")} />
              </Field>
            </div>
          </Section>

          <Section title="বাসার তথ্য" sub="Property facts">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="beds" bn="শোবার ঘর" en="Bedrooms" error={errors.bedrooms}>
                <input id="beds" type="number" min="1" max="20" className={inputClass} value={form.bedrooms} onChange={set("bedrooms")} />
              </Field>
              <Field id="baths" bn="বাথরুম" en="Bathrooms" error={errors.bathrooms}>
                <input id="baths" type="number" min="1" max="20" className={inputClass} value={form.bathrooms} onChange={set("bathrooms")} />
              </Field>
              <Field id="sqft" bn="আয়তন (বর্গফুট)" en="Sqft" error={errors.sqft}>
                <input id="sqft" type="number" min="0" className={inputClass} value={form.sqft} onChange={set("sqft")} placeholder="900" />
              </Field>
              <Field id="floor" bn="তলা" en="Floor" error={errors.floor} hint="নিচতলা হলে 0">
                <input id="floor" type="number" min="0" max="100" className={inputClass} value={form.floor} onChange={set("floor")} />
              </Field>
            </div>
          </Section>

          <Section title="সুবিধা" sub="Facilities">
            <div className="flex flex-wrap gap-2">
              {FACILITIES.map((f) => {
                const active = form.facilities.includes(f.code);
                return (
                  <button type="button" key={f.code} aria-pressed={active} onClick={() => toggleFacility(f.code)} className={chip(active)}>
                    {f.icon} {f.bn}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="বিবরণ" sub="Description">
            <Field id="desc" bn="বাসা সম্পর্কে লিখুন" en="Describe your home" error={errors.description}>
              <textarea id="desc" rows="5" className={inputClass} value={form.description} onChange={set("description")} maxLength={3000} placeholder="আশেপাশে কী আছে, কেমন পরিবেশ, কী কী সুবিধা..." />
              <p className="mt-1 text-right text-xs text-slate-400">{form.description.length}/3000</p>
            </Field>
          </Section>

          {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "অপেক্ষা করুন..." : editing ? "পরিবর্তন সেভ করুন" : "বিজ্ঞাপন প্রকাশ করুন"}
            </button>
            <Link to="/dashboard" className={secondaryBtn}>বাতিল</Link>
          </div>
          {!editing && <p className="text-xs text-slate-500">প্রকাশ করলে বিজ্ঞাপনটি সাথে সাথে সবাই দেখতে পাবে।</p>}
        </div>

        <aside>
          <div className="lg:sticky lg:top-24">
            <p className="mb-2 text-sm font-semibold text-slate-600">প্রিভিউ <span className="font-normal text-slate-400">Preview</span></p>
            <PropertyCard property={preview} preview />
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              প্রকাশ হলে বিজ্ঞাপনটি এভাবেই দেখা যাবে।
            </p>
          </div>
        </aside>
      </form>
    </main>
  );
}