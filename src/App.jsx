import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Account from './pages/Account'
import TopSellersAdmin from './pages/TopSellersAdmin'

export default function App() {
  return (
    <>
      <header className="border-b bg-white">
        <div className="container flex items-center gap-4 h-14">
          <Link to="/" className="font-bold">Davveroo</Link>
          <nav className="ml-auto flex gap-3">
            <NavLink className="btn" to="/dashboard">Dashboard Agente</NavLink>
            <NavLink className="btn" to="/admin">Admin</NavLink>
            <NavLink className="btn" to="/account">Account Cliente</NavLink>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/account" element={<Account />} />
          // <Route path="/topsellers-admin" element={<TopSellersAdmin />} />
        </Routes>
      </main>

      <footer className="container py-10 text-sm text-gray-500">
        © {new Date().getFullYear()} Davveroo
      </footer>
    </>
  )
}