import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Inquiries from "./pages/Inquiries";
import Login from "./pages/Login";
import PropertyDetails from "./pages/PropertyDetails";
import PropertyForm from "./pages/PropertyForm";
import Register from "./pages/Register";

const guard = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

function NotFound() {
  return (
    <main className="py-20 text-center">
      <p className="text-lg">পেজটি পাওয়া যায়নি।</p>
      <Link to="/" className="mt-3 inline-block text-emerald-700 underline">হোমে ফিরুন</Link>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={guard(<Dashboard />)} />
        <Route path="/dashboard/new" element={guard(<PropertyForm />)} />
        <Route path="/dashboard/properties/:id/edit" element={guard(<PropertyForm />)} />
        <Route path="/dashboard/inquiries" element={guard(<Inquiries />)} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer id="contact" className="mt-16 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        © Basha Finder · ব্রোকার ছাড়া, সরাসরি ভাড়াটিয়া
      </footer>
    </div>
  );
}
