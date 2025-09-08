import React from "react";
import ReactDOM from "react-dom/client";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import App from "./App";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Account from "./pages/Account";
import TopSellersAdmin from "./pages/TopSellersAdmin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./index.css";

/** Estrae ?token= da search o dal segmento hash */
function getUrlToken() {
  // prima: query string classica
  const searchParams = new URL(window.location.href).searchParams;
  const q = searchParams.get("token");
  if (q) return q;

  // fallback: token passato dopo l'hash (es. #/top-sellers-admin?token=XYZ)
  const hash = window.location.hash || "";
  const idx = hash.indexOf("token=");
  if (idx >= 0) {
    const after = hash.slice(idx + "token=".length);
    return decodeURIComponent(after.split("&")[0]);
  }
  return null;
}

/** Guard semplice con localStorage + env */
function TokenGate({ children }) {
  const required = "Expo2026@@"; // evita env
  const incoming = getUrlToken();
  const cached = localStorage.getItem("ts_token");

  if (incoming && incoming === required) {
    localStorage.setItem("ts_token", incoming);
  }

  const ok = (incoming && incoming === required) || (cached && cached === required);
  const { pathname } = useLocation();

  if (!ok) {
    // torna alla dashboard mantenendo l'intento nel fragment
    return <Navigate to="/dashboard" replace state={{ from: pathname }} />;
  }
  return children;
}

function Router() {
  return (
    <HashRouter>
      <Routes>
        {/* Layout wrapper */}
        <Route element={<App />}>
          {/* Home decide in base ai ruoli: admin/seller -> dashboard, altrimenti account, oppure login */}
          <Route index element={<HomeRedirect />} />
          {/* Pubbliche */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private: seller OR admin */}
          <Route path="/dashboard" element={<RoleGate allow={["seller", "admin"]}><Dashboard /></RoleGate>} />
          {/* Private: admin only */}
          <Route path="/admin" element={<RoleGate allow={["admin"]}><Admin /></RoleGate>} />
          {/* Private: any authenticated role (customer, seller, admin) */}
          <Route path="/account" element={<AuthGate><Account /></AuthGate>} />

          {/* Protetta via token (?token=...) */}
          <Route
            path="/top-sellers-admin"
            element={
              <TokenGate>
                <TopSellersAdmin />
              </TokenGate>
            }
          />
          {/* Alias stessa pagina */}
          <Route path="/topsellersadmin" element={<RoleGate allow={["admin"]}><TopSellersAdmin /></RoleGate>} />

          {/* Catch-all */}
          <Route path="*" element={<HomeRedirect />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

// Evita doppia createRoot in HMR/dev
const rootEl = document.getElementById("root");
if (!rootEl._reactRoot) {
  rootEl._reactRoot = ReactDOM.createRoot(rootEl);
}
rootEl._reactRoot.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);

// ===== Helpers (placed at bottom to keep file self-contained)
import { isLoggedIn, hasAnyRole, defaultHome } from './lib/auth'

function HomeRedirect() {
  const to = defaultHome();
  return <Navigate to={to} replace />
}

function AuthGate({ children }) {
  const loc = useLocation();
  if (!isLoggedIn()) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return children;
}

function RoleGate({ allow = [], children }) {
  const loc = useLocation();
  if (!isLoggedIn()) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (!allow.length || hasAnyRole(allow)) return children;
  // Not authorized: send to their home
  return <Navigate to={defaultHome()} replace />
}
