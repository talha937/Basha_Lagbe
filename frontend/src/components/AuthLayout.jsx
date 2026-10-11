export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-bd-green to-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-bd-red/80" />
        <div className="absolute -left-10 top-1/3 h-40 w-40 rounded-full bg-white/10" />
        <p className="relative mb-6 text-3xl font-bold leading-snug">
          ব্রোকার ছাড়া,<br />সরাসরি ভাড়াটিয়া।
        </p>
        <div className="relative rounded-2xl bg-white p-6 text-slate-800 shadow-xl">
          <p className="mb-3 font-semibold">বাড়িওয়ালাদের জন্য</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✔ ছবি, ভাড়া ও সুবিধাসহ বিজ্ঞাপন দিন</li>
            <li>✔ ভাড়াটিয়ার ইনকোয়ারি ড্যাশবোর্ডে দেখুন</li>
            <li>✔ ভাড়া হয়ে গেলে এক ক্লিকে বিজ্ঞাপন বন্ধ করুন</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}