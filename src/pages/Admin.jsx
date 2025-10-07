// src/pages/Admin.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import { useToast } from "../components/Toast";
import { getUser } from "../lib/auth";
import { itemsArray } from "../lib/apiUtils";

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
  const normalizeCustomer = (c) => ({
    ...c,
    full_name:
      c?.full_name ||
      c?.fullName ||
      c?.name ||
      c?.display_name ||
      c?.displayName ||
      "",
  });

  const normalizeAgent = (a) => ({
    ...a,
    display_name:
      a?.display_name ||
      a?.displayName ||
      a?.name ||
      a?.full_name ||
      a?.fullName ||
      a?.email ||
      "",
  });

  const normalizeProduct = (p) => ({
    ...p,
    name: p?.name || p?.label || p?.title || p?.product_name || "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [p, c, a] = await Promise.all([
          apiGet("/products"),
          apiGet("/customers"),
          apiGet("/agents"),
        ]);
        setProducts(itemsArray(p).map(normalizeProduct));
        setCustomers(itemsArray(c).map(normalizeCustomer));
        setAgents(itemsArray(a).map(normalizeAgent));
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
        name: fullName,
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
      setCustomers(itemsArray(d).map(normalizeCustomer));
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
      setProducts(itemsArray(d).map(normalizeProduct));
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

  const productPreview = products
    .map((p) => p.name)
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");
  const agentPreview = agents
    .map((a) => `${a.id} — ${a.display_name}`)
    .filter(Boolean)
    .slice(0, 4)
    .join(" • ");
  const customerPreview = customers
    .map((c) => `${c.id} — ${c.full_name}`)
    .filter(Boolean)
    .slice(0, 4)
    .join(" • ");

  return (
    <div className="space-y-10">
      <div className="card border-slate-200 bg-gradient-to-br from-white via-emerald-50/40 to-white p-8 shadow-xl shadow-emerald-100/40">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4 text-slate-700">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-500/80">
              Centro di controllo admin
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Ciao {me?.name || "Admin"}!
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Gestisci clienti, prodotti e contratti in un&apos;unica vista.
              Coordina il team, assegna gli agenti giusti e fai crescere la
              community Davveroo con pochi clic.
            </p>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                Prodotti {products.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                Clienti {customers.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                Agenti {agents.length}
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Prodotti pronti
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">
                {products.length}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">
                Contratti potenziali
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {customers.length ? Math.round(customers.length * 1.5) : 0}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-700 shadow-sm sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-500">
                Simboli rapidi
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Usa i filtri rapidi nelle schede sotto per assegnare agenti,
                collegare referrer e registrare acquisti in pochi secondi.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900">Nuovo prodotto</h2>
          <p className="mt-2 text-sm text-slate-600">
            Pubblica un prodotto o servizio da associare agli acquisti degli
            agenti.
          </p>
          <form className="mt-6 space-y-4" onSubmit={createProduct}>
            <input
              className="input"
              placeholder="Nome prodotto *"
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              required
            />
            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              <input
                type="checkbox"
                checked={newProdActive}
                onChange={(e) => setNewProdActive(e.target.checked)}
              />
              Attivo (disponibile subito agli agenti)
            </label>
            <button
              className="btn btn-primary w-full justify-center md:w-auto"
              type="submit"
            >
              Crea prodotto
            </button>
          </form>
          {!!productPreview && (
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">
              Prodotti attuali: {productPreview}
              {products.length > 5 ? "…" : ""}
            </p>
          )}
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900">Stato ecosistema</h2>
          <p className="mt-2 text-sm text-slate-600">
            Una panoramica rapida di cosa hai già a disposizione.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Clienti
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">
                {customers.length}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">
                Agenti
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {agents.length}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-500">
                Prodotti
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {products.length}
              </p>
            </div>
          </div>
          {!!agentPreview && (
            <p className="mt-5 text-xs text-slate-500">
              Agenti attivi: {agentPreview}
              {agents.length > 4 ? "…" : ""}
            </p>
          )}
          {!!customerPreview && (
            <p className="mt-2 text-xs text-slate-500">
              Clienti top: {customerPreview}
              {customers.length > 4 ? "…" : ""}
            </p>
          )}
          <ul className="mt-6 grid gap-3 text-sm text-slate-600">
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              ✔️ Ricorda di assegnare l&apos;agente corretto per abilitare il
              monitoraggio.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              🔁 Aggiorna gli acquisti quando il contratto passa a stato
              <span className="ml-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                active
              </span>
              .
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900">Crea cliente</h2>
          <p className="mt-2 text-sm text-slate-600">
            Registra un nuovo cliente e collega immediatamente agente e
            referrer.
          </p>
          <form className="mt-6 space-y-4" onSubmit={createCustomer}>
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

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder="Filtra agenti (nome/id)"
                  value={agentFilterCreate}
                  onChange={(e) => setAgentFilterCreate(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
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

            <div className="space-y-3">
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

            <button
              className="btn btn-primary w-full justify-center md:w-auto"
              type="submit"
            >
              Salva cliente
            </button>
          </form>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Registra acquisto / contratto
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Collega un acquisto a un cliente e decidi quando sbloccare il
            referral.
          </p>
          <form className="mt-6 space-y-4" onSubmit={createPurchase}>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input flex-1 min-w-[220px]"
                placeholder="Cerca cliente per nome"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
              />
              <button
                ref={lookupBtnRef}
                className="btn btn-ghost"
                type="button"
                onClick={resolveByEmail}
              >
                Trova
              </button>
            </div>

            <div className="space-y-3">
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

            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">pending</option>
              <option value="active">active (sblocca referral)</option>
              <option value="cancelled">cancelled</option>
            </select>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="flex-1 text-sm text-slate-300">
                  Assegna/override agente (opz.)
                </label>
                <button
                  type="button"
                  className="btn btn-ghost"
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

            <input
              className="input"
              placeholder="Importo (opz.)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button
              className="btn btn-primary w-full justify-center md:w-auto"
              type="submit"
            >
              Salva acquisto
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
