// src/pages/Admin.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import { useToast } from "../components/Toast";
import { getUser } from "../lib/auth";

export default function Admin() {
  const toast = useToast();
  const me = getUser(); // { id, name, email, roles }

  // ======== CREA CLIENTE ========
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agentIdCreate, setAgentIdCreate] = useState("");
  const [referrerIdCreate, setReferrerIdCreate] = useState("");

  // ======== REGISTRA ACQUISTO ========
  const [customerIdBuy, setCustomerIdBuy] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("pending");
  const [amount, setAmount] = useState("");
  const [agentIdBuy, setAgentIdBuy] = useState("");

  // ======== CREA PRODOTTO ========
  const [newProdName, setNewProdName] = useState("");
  const [newProdActive, setNewProdActive] = useState(true);

  // ======== DATI ========
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);

  // filtri locali (solo UI)
  const [custFilterCreate, setCustFilterCreate] = useState("");
  const [custFilterBuy, setCustFilterBuy] = useState("");
  const [agentFilterCreate, setAgentFilterCreate] = useState("");
  const [agentFilterBuy, setAgentFilterBuy] = useState("");

  // lookup email (client-side)
  const [lookupEmail, setLookupEmail] = useState("");
  const lookupBtnRef = useRef(null);

  // ------- LOAD una volta -------
  useEffect(() => {
    (async () => {
      try {
        const [p, c, a] = await Promise.all([
          apiGet("/products"),
          apiGet("/customers"),
          apiGet("/agents"),
        ]);
        setProducts(p.items || []);
        setCustomers(c.items || []);
        setAgents(a.items || []);
      } catch (e) {
        toast.error(e.message || "Errore caricamento dati");
      }
    })();
  }, []); // eslint-disable-line

  // filtri client-side
  const filteredAgentsCreate = useMemo(() => {
    const q = agentFilterCreate.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) => {
      const s = `${a.id} ${a.display_name || ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [agentFilterCreate, agents]);

  const filteredAgentsBuy = useMemo(() => {
    const q = agentFilterBuy.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) => {
      const s = `${a.id} ${a.display_name || ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [agentFilterBuy, agents]);

  const filteredCustomersCreate = useMemo(() => {
    const q = custFilterCreate.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const s = `${c.id} ${c.full_name || ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [custFilterCreate, customers]);

  const filteredCustomersBuy = useMemo(() => {
    const q = custFilterBuy.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const s = `${c.id} ${c.full_name || ""}`.toLowerCase();
      return s.includes(q);
    });
  }, [custFilterBuy, customers]);

  // ------- ACTIONS -------
  async function createCustomer(e) {
    e.preventDefault();
    try {
      const body = {
        full_name: fullName,
        email: email || null,
        agent_id: agentIdCreate ? Number(agentIdCreate) : null,
        registered_by_customer_id: referrerIdCreate
          ? Number(referrerIdCreate)
          : null,
      };
      const r = await apiPost("/customers", body);
      toast.success(`Cliente creato (id ${r.id})`);
      setFullName("");
      setEmail("");
      setAgentIdCreate("");
      setReferrerIdCreate("");

      const d = await apiGet("/customers");
      setCustomers(d.items || []);
    } catch (e) {
      toast.error(e.message || "Errore");
    }
  }

  async function createPurchase(e) {
    e.preventDefault();
    try {
      const body = {
        customer_id: Number(customerIdBuy),
        product_id: Number(productId),
        status,
        amount: amount ? Number(amount) : null,
        agent_id: agentIdBuy ? Number(agentIdBuy) : null, // opzionale
      };
      const r = await apiPost("/purchases", body);
      toast.success(`Acquisto registrato (id ${r.id})`);
      setCustomerIdBuy("");
      setProductId("");
      setStatus("pending");
      setAmount("");
      setAgentIdBuy("");
    } catch (e) {
      toast.error(e.message || "Errore");
    }
  }

  function resolveByEmail() {
    const q = lookupEmail.trim().toLowerCase();
    if (!q) return;
    const first = customers.find((c) =>
      `${c.full_name || ""}`.toLowerCase().includes(q)
    );
    if (first && first.id) {
      setCustomerIdBuy(String(first.id));
      toast.info(`Trovato cliente #${first.id} (${first.full_name})`);
    } else {
      toast.error("Nessun cliente trovato");
    }
  }

  async function createProduct(e) {
    e.preventDefault();
    try {
      const r = await apiPost("/products", {
        name: newProdName.trim(),
        is_active: !!newProdActive,
      });
      toast.success(`Prodotto creato (id ${r.id})`);
      setNewProdName("");
      setNewProdActive(true);
      const d = await apiGet("/products");
      setProducts(d.items || []);
    } catch (e) {
      toast.error(e.message || "Errore");
    }
  }

  // helper: usa me come agente
  function useMeForCreate() {
    if (me?.id) setAgentIdCreate(String(me.id));
  }
  function useMeForBuy() {
    if (me?.id) setAgentIdBuy(String(me.id));
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin</h1>

      {/* ===== CREA PRODOTTO ===== */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Crea prodotto</h2>
        <form className="grid gap-3" onSubmit={createProduct}>
          <input
            className="input"
            placeholder="Nome prodotto *"
            value={newProdName}
            onChange={(e) => setNewProdName(e.target.value)}
            required
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newProdActive}
              onChange={(e) => setNewProdActive(e.target.checked)}
            />
            Attivo
          </label>
          <button className="btn" type="submit">
            Crea prodotto
          </button>
        </form>
        {!!products.length && (
          <div className="mt-4 text-sm text-gray-600">
            Prodotti attuali: {products.map((p) => p.name).join(", ")}
          </div>
        )}
      </div>

      {/* ===== CREA CLIENTE ===== */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Crea cliente</h2>
        <form className="grid gap-3" onSubmit={createCustomer}>
          <input
            className="input"
            placeholder="Nome completo *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Agente */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Filtra agenti (nome/id)"
                value={agentFilterCreate}
                onChange={(e) => setAgentFilterCreate(e.target.value)}
              />
              <button
                type="button"
                className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50"
                onClick={useMeForCreate}
                title="Usa il mio ID come agente"
              >
                Usa me
              </button>
            </div>
            <select
              className="input"
              value={agentIdCreate}
              onChange={(e) => setAgentIdCreate(e.target.value)}
            >
              <option value="">Assegna agente — opzionale</option>
              {filteredAgentsCreate.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Referrer (cliente) */}
          <div className="grid gap-2">
            <input
              className="input"
              placeholder="Filtra clienti (nome/id)"
              value={custFilterCreate}
              onChange={(e) => setCustFilterCreate(e.target.value)}
            />
            <select
              className="input"
              value={referrerIdCreate}
              onChange={(e) => setReferrerIdCreate(e.target.value)}
            >
              <option value="">Registrato da (cliente) — opzionale</option>
              {filteredCustomersCreate.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <button className="btn" type="submit">
            Crea
          </button>
        </form>
      </div>

      {/* ===== REGISTRA ACQUISTO ===== */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">
          Registra acquisto/contratto
        </h2>
        <form className="grid gap-3" onSubmit={createPurchase}>
          {/* Lookup semplice per nome (client-side) */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input flex-1 min-w-[220px]"
              placeholder="Cerca cliente per nome"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
            />
            <button
              ref={lookupBtnRef}
              className="btn"
              type="button"
              onClick={resolveByEmail}
            >
              Trova
            </button>
          </div>

          {/* Cliente */}
          <div className="grid gap-2">
            <input
              className="input"
              placeholder="Filtra clienti (nome/id)"
              value={custFilterBuy}
              onChange={(e) => setCustFilterBuy(e.target.value)}
            />
            <select
              className="input"
              value={customerIdBuy}
              onChange={(e) => setCustomerIdBuy(e.target.value)}
              required
            >
              <option value="">Cliente *</option>
              {filteredCustomersBuy.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Prodotto */}
          <select
            className="input"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Prodotto *</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Stato */}
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">pending</option>
            <option value="active">active (sblocca referral)</option>
            <option value="cancelled">cancelled</option>
          </select>

          {/* Override agente */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 flex-1">
                Assegna/override agente (opz.)
              </label>
              <button
                type="button"
                className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50"
                onClick={useMeForBuy}
                title="Usa il mio ID come agente"
              >
                Usa me
              </button>
            </div>
            <input
              className="input"
              placeholder="Filtra agenti (nome/id)"
              value={agentFilterBuy}
              onChange={(e) => setAgentFilterBuy(e.target.value)}
            />
            <select
              className="input"
              value={agentIdBuy}
              onChange={(e) => setAgentIdBuy(e.target.value)}
            >
              <option value="">Nessun override</option>
              {filteredAgentsBuy.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Importo */}
          <input
            className="input"
            placeholder="Importo (opz.)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button className="btn" type="submit">
            Salva acquisto
          </button>
        </form>
      </div>
    </div>
  );
}
