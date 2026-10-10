import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold text-emerald-700">
          🏠 Basha Finder
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-emerald-700">Home</Link>
          <a href="/#listings" className="hover:text-emerald-700">Listings</a>
          <a href="#contact" className="hover:text-emerald-700">Contact</a>
        </div>
      </nav>
    </header>
  )
}