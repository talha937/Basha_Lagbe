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
  const cta = "rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-emerald-700">🏠 বাসা ফাইন্ডার</Link>

        <div className="flex items-center gap-3 text-sm font-medium sm:gap-5">
          <a href="/#listings" className={`hidden md:inline ${link}`}>বিজ্ঞাপন</a>

          {!user && (
            <>
              <Link to="/login" className={link}>লগইন</Link>
              <Link to="/register" className={cta}>রেজিস্টার</Link>
            </>
          )}

          {user?.role === "tenant" && (
            <>
              <Link to="/my-requests" className={link}>আমার অনুরোধ</Link>
              <button onClick={handleLogout} className={link}>লগআউট</button>
            </>
          )}

          {user?.role === "landlord" && (
            <>
              <Link to="/dashboard" className={link}>ড্যাশবোর্ড</Link>
              <Link to="/dashboard/requests" className={`hidden sm:inline ${link}`}>অনুরোধ</Link>
              <Link to="/my-requests" className={`hidden lg:inline ${link}`}>আমার পাঠানো</Link>
              <Link to="/dashboard/new" className={cta}>+ বাসা যোগ করুন</Link>
              <button onClick={handleLogout} className={link}>লগআউট</button>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <Link to="/admin" className={link}>অ্যাডমিন প্যানেল</Link>
              <button onClick={handleLogout} className={link}>লগআউট</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
