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

      <aside
        className="relative hidden min-h-[720px] overflow-hidden rounded-3xl bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-end"
        style={{ backgroundImage: "url('/login-city.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#082744]/95 via-[#0d2a47]/60 to-[#0d2a47]/20" />
        <div className="absolute inset-0 bg-brand-900/20" />
        <p className="relative mb-6 text-3xl font-bold leading-snug drop-shadow-md">
          ব্রোকার ছাড়া,<br />সরাসরি ভাড়াটিয়া।
        </p>
        <div className="relative rounded-2xl bg-white/95 p-6 text-slate-800 shadow-xl backdrop-blur-sm">
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