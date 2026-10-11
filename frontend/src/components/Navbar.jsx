import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const link = "hover:text-emerald-700";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-emerald-700">🏠 বাসা ফাইন্ডার</Link>

        <div className="flex items-center gap-3 text-sm font-medium sm:gap-5">
          <a href="/#listings" className={`hidden md:inline ${link}`}>বিজ্ঞাপন</a>
          {user ? (
            <>
              <Link to="/dashboard" className={link}>ড্যাশবোর্ড</Link>
              <Link to="/dashboard/inquiries" className={`hidden sm:inline ${link}`}>ইনকোয়ারি</Link>
              <Link to="/dashboard/new" className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">
                + বাসা যোগ করুন
              </Link>
              <button onClick={handleLogout} className={link}>লগআউট</button>
            </>
          ) : (
            <>
              <Link to="/login" className={link}>লগইন</Link>
              <Link to="/register" className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">
                বাড়িওয়ালা? রেজিস্টার
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}