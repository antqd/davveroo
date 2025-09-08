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
  const required = import.meta.env.VITE_TOP_SELLERS_TOKEN || "davveroo";
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/account" element={<Account />} />

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
          <Route
            path="/topsellersadmin"
            element={
              <TokenGate>
                <TopSellersAdmin />
              </TokenGate>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
