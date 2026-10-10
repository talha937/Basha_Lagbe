import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PropertyDetails from './pages/PropertyDetails'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
      </Routes>
      <footer id="contact" className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        © Basha Finder. Contact details coming soon.
      </footer>
    </div>
  )
}
