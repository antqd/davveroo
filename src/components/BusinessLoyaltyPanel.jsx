import { useEffect, useMemo, useRef, useState } from "react";
import { apiBusinesses } from "../lib/api";
import { itemsArray } from "../lib/apiUtils";
import { useToast } from "./Toast";
import { getUser } from "../lib/auth";

const LOYALTY_ERR_KEY = "davveroo_loyalty_setup_err";

function formatDate(ts) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_e) {
    return String(ts);
  }
}

export default function BusinessLoyaltyPanel() {
  const toast = useToast();
  const user = getUser();
  const isSeller = !!(user?.roles || []).includes("seller");
  const isAdmin = !!(user?.roles || []).includes("admin");
  const aliveRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    description: "",
  });
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customerForm, setCustomerForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [customerBusy, setCustomerBusy] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    title: "",
    cost_credits: "",
    description: "",
  });
  const [savingReward, setSavingReward] = useState(false);
  const [creditDialog, setCreditDialog] = useState(null);
  const [redeemDialog, setRedeemDialog] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const msg = localStorage.getItem(LOYALTY_ERR_KEY);
      if (msg) {
        toast.error(msg);
        localStorage.removeItem(LOYALTY_ERR_KEY);
      }
    } catch (_e) {}
  }, [toast]);

  useEffect(() => {
    if (!isSeller && !isAdmin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await reloadBusinessAndData();
      } finally {
        if (!cancelled && aliveRef.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller, isAdmin]);

  async function syncBusiness(showErrors = true) {
    try {
      const res = await apiBusinesses.me();
      const biz = res?.business || null;
      if (!aliveRef.current) return biz;
      setBusiness(biz);
      if (biz) {
        setForm({
          name: biz.name || "",
          contact_email: biz.contact_email || "",
          contact_phone: biz.contact_phone || "",
          description: biz.description || "",
        });
      } else {
        setForm({
          name: "",
          contact_email: "",
          contact_phone: "",
          description: "",
        });
      }
      return biz;
    } catch (err) {
      const msg = err?.message ? String(err.message) : "";
      if (msg.includes("404")) {
        if (aliveRef.current) {
          setBusiness(null);
          setForm({
            name: "",
            contact_email: "",
            contact_phone: "",
            description: "",
          });
        }
        return null;
      }
      if (showErrors && aliveRef.current) {
        toast.error("Impossibile recuperare l'attività");
      }
      throw err;
    }
  }

  async function refreshDataOnly(bizId) {
    if (!bizId) {
      if (aliveRef.current) {
        setCustomers([]);
        setRewards([]);
        setTransactions([]);
      }
      return;
    }
    try {
      const [custRes, rewardsRes, txRes] = await Promise.all([
        apiBusinesses.listCustomers(bizId),
        apiBusinesses.listRewards(bizId),
        apiBusinesses.listTransactions(bizId),
      ]);
      if (!aliveRef.current) return;
      setCustomers(itemsArray(custRes));
      setRewards(itemsArray(rewardsRes));
      setTransactions(itemsArray(txRes));
    } catch (_err) {
      if (aliveRef.current) {
        toast.error("Impossibile aggiornare i dati dell'attività");
      }
    }
  }

  async function reloadBusinessAndData() {
    const biz = await syncBusiness(false);
    if (!aliveRef.current) return;
    if (biz && biz.id) {
      await refreshDataOnly(biz.id);
    } else {
      setCustomers([]);
      setRewards([]);
      setTransactions([]);
    }
  }

  async function handleRefresh() {
    if (!isSeller && !isAdmin) return;
    setRefreshing(true);
    try {
      await reloadBusinessAndData();
      if (aliveRef.current) {
        toast.success("Dati aggiornati");
      }
    } catch (_err) {
      // gli errori sono già gestiti nei singoli metodi
    } finally {
      if (aliveRef.current) setRefreshing(false);
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveBusiness(e) {
    e.preventDefault();
    if (!form.name || !form.name.trim()) {
      toast.error("Il nome dell'attività è obbligatorio");
      return;
    }
    setSavingBusiness(true);
    try {
      const payload = {
        name: form.name.trim(),
      };
      if (form.contact_email && form.contact_email.trim())
        payload.contact_email = form.contact_email.trim();
      if (form.contact_phone && form.contact_phone.trim())
        payload.contact_phone = form.contact_phone.trim();
      if (form.description && form.description.trim())
        payload.description = form.description.trim();

      const res = await apiBusinesses.save(payload);
      const biz = res?.business || null;
      if (!aliveRef.current) return;
      setBusiness(biz);
      if (biz) {
        setForm({
          name: biz.name || "",
          contact_email: biz.contact_email || "",
          contact_phone: biz.contact_phone || "",
          description: biz.description || "",
        });
        toast.success("Attività salvata");
        await refreshDataOnly(biz.id);
      }
    } catch (err) {
      const msg = err?.message ? String(err.message) : "";
      if (msg.includes("name_required")) {
        toast.error("Inserisci il nome dell'attività");
      } else {
        toast.error("Salvataggio attività non riuscito");
      }
    } finally {
      if (aliveRef.current) setSavingBusiness(false);
    }
  }

  async function addCustomer(e) {
    e.preventDefault();
    if (!business?.id) {
      toast.error("Crea prima l'attività");
      return;
    }
    if (!customerForm.full_name || !customerForm.full_name.trim()) {
      toast.error("Il nome del cliente è obbligatorio");
      return;
    }
    setCustomerBusy(true);
    try {
      const payload = {
        full_name: customerForm.full_name.trim(),
      };
      if (customerForm.email && customerForm.email.trim())
        payload.email = customerForm.email.trim();
      if (customerForm.phone && customerForm.phone.trim())
        payload.phone = customerForm.phone.trim();

      const res = await apiBusinesses.addCustomer(business.id, payload);
      const wallet = res?.customer || null;
      if (!aliveRef.current) return;

      if (wallet) {
        setCustomers((prev) => {
          const others = prev.filter(
            (c) => c.customer_id !== wallet.customer_id
          );
          return [wallet, ...others];
        });
        toast.success("Cliente salvato");
      }
      setCustomerForm({ full_name: "", email: "", phone: "" });
      await refreshDataOnly(business.id);
    } catch (err) {
      const msg = err?.message ? String(err.message) : "";
      if (msg.includes("customer_full_name_required")) {
        toast.error("Il nome del cliente è obbligatorio");
      } else {
        toast.error("Impossibile salvare il cliente");
      }
    } finally {
      if (aliveRef.current) setCustomerBusy(false);
    }
  }

  function openCredit(wallet) {
    setCreditDialog({
      wallet,
      customer_id: wallet.customer_id,
      customer_name:
        wallet.customer?.full_name || `Cliente #${wallet.customer_id}`,
      amount: 5,
      reason: "",
    });
  }

  async function submitCredit(e) {
    e.preventDefault();
    if (!business?.id || !creditDialog) return;
    const amountInt = Number(creditDialog.amount);
    if (!Number.isInteger(amountInt) || amountInt <= 0) {
      toast.error("Inserisci un importo valido");
      return;
    }
    setActionBusy(true);
    try {
      await apiBusinesses.addTransaction(business.id, {
        customer_id: creditDialog.customer_id,
        direction: "earn",
        amount: amountInt,
        reason:
          creditDialog.reason && creditDialog.reason.trim()
            ? creditDialog.reason.trim()
            : undefined,
      });
      if (!aliveRef.current) return;
      toast.success("Crediti assegnati");
      setCreditDialog(null);
      await reloadBusinessAndData();
    } catch (err) {
      const msg = err?.message ? String(err.message) : "";
      if (msg.includes("invalid_amount")) {
        toast.error("Importo crediti non valido");
      } else {
        toast.error("Errore nell'assegnazione dei crediti");
      }
    } finally {
      if (aliveRef.current) setActionBusy(false);
    }
  }

  function openRedeem(wallet) {
    if (!rewards.length) {
      toast.error("Crea prima un premio da assegnare");
      return;
    }
    setRedeemDialog({
      wallet,
      customer_id: wallet.customer_id,
      customer_name:
        wallet.customer?.full_name || `Cliente #${wallet.customer_id}`,
      rewardId: rewards[0]?.id || null,
      note: "",
    });
  }

  async function submitRedeem(e) {
    e.preventDefault();
    if (!business?.id || !redeemDialog?.rewardId) {
      toast.error("Seleziona un premio da riscattare");
      return;
    }
    setActionBusy(true);
    try {
      await apiBusinesses.redeemReward(
        business.id,
        redeemDialog.rewardId,
        {
          customer_id: redeemDialog.customer_id,
          reason:
            redeemDialog.note && redeemDialog.note.trim()
              ? redeemDialog.note.trim()
              : undefined,
        }
      );
      if (!aliveRef.current) return;
      toast.success("Premio riscattato");
      setRedeemDialog(null);
      await reloadBusinessAndData();
    } catch (err) {
      const msg = err?.message ? String(err.message) : "";
      if (msg.includes("insufficient_balance")) {
        toast.error("Credito insufficiente per il premio scelto");
      } else if (msg.includes("reward_not_found")) {
        toast.error("Premio non valido");
      } else if (msg.includes("reward_inactive")) {
        toast.error("Il premio selezionato non è più attivo");
      } else {
        toast.error("Errore nel riscatto del premio");
      }
    } finally {
      if (aliveRef.current) setActionBusy(false);
    }
  }

  function updateRewardForm(field, value) {
    setRewardForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveReward(e) {
    e.preventDefault();
    if (!business?.id) {
      toast.error("Crea prima l'attività");
      return;
    }
    if (!rewardForm.title || !rewardForm.title.trim()) {
      toast.error("Inserisci il nome del premio");
      return;
    }
    const costInt = Number(rewardForm.cost_credits);
    if (!Number.isInteger(costInt) || costInt <= 0) {
      toast.error("Il costo deve essere un numero intero positivo");
      return;
    }
    setSavingReward(true);
    try {
      await apiBusinesses.saveReward(business.id, {
        title: rewardForm.title.trim(),
        cost_credits: costInt,
        description:
          rewardForm.description && rewardForm.description.trim()
            ? rewardForm.description.trim()
            : undefined,
      });
      if (!aliveRef.current) return;
      toast.success("Premio salvato");
      setRewardForm({ title: "", cost_credits: "", description: "" });
      await refreshDataOnly(business.id);
    } catch (_err) {
      if (aliveRef.current) {
        toast.error("Impossibile salvare il premio");
      }
    } finally {
      if (aliveRef.current) setSavingReward(false);
    }
  }

  const stats = business?.stats || {};
  const activeRewards = useMemo(
    () => rewards.filter((r) => r && r.is_active !== false),
    [rewards]
  );

  const latestTransactions = useMemo(
    () => transactions.slice(0, 12),
    [transactions]
  );

  if (!isSeller && !isAdmin) return null;

  return (
    <div className="card border-slate-200 bg-white/80 p-6 shadow-lg shadow-blue-50/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Programma crediti attività
          </h2>
          <p className="text-sm text-slate-600">
            Registra i clienti della tua attività, assegna crediti fedeltà e
            gestisci premi personalizzati.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleRefresh}
          disabled={loading || refreshing}
        >
          {refreshing ? "Aggiornamento…" : "Aggiorna"}
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">
          Caricamento dati attività…
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          <form
            className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50/40 p-5"
            onSubmit={saveBusiness}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">
                  Dettagli attività
                </h3>
                <p className="text-sm text-slate-600">
                  Aggiorna le informazioni che appariranno nella dashboard crediti.
                </p>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingBusiness}
              >
                {savingBusiness ? "Salvataggio…" : "Salva attività"}
              </button>
            </div>
            <input
              className="input"
              placeholder="Nome attività"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input"
                type="email"
                placeholder="Email attività (opzionale)"
                value={form.contact_email}
                onChange={(e) => updateForm("contact_email", e.target.value)}
              />
              <input
                className="input"
                placeholder="Telefono attività (opzionale)"
                value={form.contact_phone}
                onChange={(e) => updateForm("contact_phone", e.target.value)}
              />
            </div>
            <textarea
              className="input min-h-[100px]"
              placeholder="Descrizione o regole del programma fedeltà (opzionale)"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </form>

          {business ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Clienti attivi
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                    {stats.customer_count ?? customers.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Credito totale
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                    {stats.balance_credits ?? 0} crediti
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Crediti assegnati
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                    {stats.total_earned ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Premi attivi
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
                    {stats.active_rewards ?? activeRewards.length}
                  </div>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[0.6fr_1.4fr]">
                <form
                  className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  onSubmit={addCustomer}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Aggiungi cliente
                  </h3>
                  <input
                    className="input"
                    placeholder="Nome completo cliente"
                    value={customerForm.full_name}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="Email cliente (opzionale)"
                    value={customerForm.email}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                  <input
                    className="input"
                    placeholder="Telefono cliente (opzionale)"
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="submit"
                    className="btn btn-primary w-full justify-center"
                    disabled={customerBusy}
                  >
                    {customerBusy ? "Salvataggio…" : "Registra cliente"}
                  </button>
                </form>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Clienti e crediti
                    </h3>
                    <div className="text-xs text-slate-500">
                      Totale: {customers.length}
                    </div>
                  </div>
                  {customers.length ? (
                    <div className="mt-4 overflow-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th className="th">Cliente</th>
                            <th className="th">Email</th>
                            <th className="th">Telefono</th>
                            <th className="th text-right">Crediti</th>
                            <th className="th text-right">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((row) => {
                            const balance = Number(row.balance_credits || 0);
                            return (
                              <tr key={row.id ?? `${row.customer_id}-wallet`}>
                                <td className="td">
                                  {row.customer?.full_name ||
                                    `Cliente #${row.customer_id}`}
                                </td>
                                <td className="td">
                                  {row.customer?.email || "—"}
                                </td>
                                <td className="td">
                                  {row.customer?.phone || "—"}
                                </td>
                                <td className="td text-right tabular-nums">
                                  {balance}
                                </td>
                                <td className="td text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-xs"
                                      onClick={() => openCredit(row)}
                                    >
                                      + Crediti
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-xs"
                                      onClick={() => openRedeem(row)}
                                      disabled={!rewards.length || balance <= 0}
                                    >
                                      Riscatta premio
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      Nessun cliente registrato per questa attività. Aggiungi il
                      primo per iniziare a raccogliere crediti.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr]">
                <form
                  className="space-y-4 rounded-3xl border border-amber-100 bg-amber-50/50 p-5"
                  onSubmit={saveReward}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
                    Nuovo premio fedeltà
                  </h3>
                  <input
                    className="input"
                    placeholder="Nome premio"
                    value={rewardForm.title}
                    onChange={(e) => updateRewardForm("title", e.target.value)}
                    required
                  />
                  <input
                    className="input"
                    type="number"
                    min="1"
                    placeholder="Crediti necessari"
                    value={rewardForm.cost_credits}
                    onChange={(e) =>
                      updateRewardForm("cost_credits", e.target.value)
                    }
                    required
                  />
                  <textarea
                    className="input min-h-[90px]"
                    placeholder="Descrizione o condizioni (opzionale)"
                    value={rewardForm.description}
                    onChange={(e) =>
                      updateRewardForm("description", e.target.value)
                    }
                  />
                  <button
                    type="submit"
                    className="btn btn-primary w-full justify-center"
                    disabled={savingReward}
                  >
                    {savingReward ? "Salvataggio…" : "Salva premio"}
                  </button>
                </form>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Premi attivi
                    </h3>
                    <div className="text-xs text-slate-500">
                      Totale: {rewards.length}
                    </div>
                  </div>
                  {rewards.length ? (
                    <ul className="mt-4 space-y-3 text-sm">
                      {rewards.map((reward) => (
                        <li
                          key={reward.id}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-800">
                                {reward.title}
                              </div>
                              {reward.description && (
                                <div className="text-xs text-slate-500">
                                  {reward.description}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-slate-800 tabular-nums">
                                {reward.cost_credits} crediti
                              </div>
                              {!reward.is_active && (
                                <div className="text-xs text-rose-500">
                                  Non attivo
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      Nessun premio configurato. Crea una ricompensa per motivare
                      i tuoi clienti a tornare.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Ultime transazioni
                  </h3>
                  <div className="text-xs text-slate-500">
                    Mostrate {latestTransactions.length} movimenti
                  </div>
                </div>
                {latestTransactions.length ? (
                  <div className="mt-4 overflow-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="th">Cliente</th>
                          <th className="th">Operazione</th>
                          <th className="th">Note</th>
                          <th className="th text-right">Crediti</th>
                          <th className="th">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="td">
                              {tx.customer?.full_name ||
                                `Cliente #${tx.customer_id}`}
                            </td>
                            <td className="td">
                              {tx.direction === "earn"
                                ? "Assegnazione"
                                : tx.direction === "spend"
                                ? "Riscatto"
                                : "Rettifica"}
                              {tx.reward_title
                                ? ` · ${tx.reward_title}`
                                : ""}
                            </td>
                            <td className="td text-sm text-slate-500">
                              {tx.reason || "—"}
                            </td>
                            <td className="td text-right tabular-nums">
                              {Number(tx.amount_credits || 0) > 0 ? "+" : ""}
                              {tx.amount_credits}
                            </td>
                            <td className="td text-sm text-slate-500">
                              {formatDate(tx.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Ancora nessun movimento registrato. Assegna crediti o
                    riscatta un premio per popolare lo storico.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-inner shadow-slate-100">
              <p className="font-semibold text-slate-700">
                Non hai ancora configurato la tua attività.
              </p>
              <p className="mt-2">
                Completa il modulo qui sopra per creare la dashboard crediti e
                iniziare a premiare i tuoi clienti.
              </p>
            </div>
          )}
        </div>
      )}

      {creditDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-md space-y-4 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Assegna crediti
              </h3>
              <p className="text-sm text-slate-600">
                {creditDialog.customer_name}
              </p>
            </div>
            <form className="space-y-4" onSubmit={submitCredit}>
              <input
                className="input"
                type="number"
                min="1"
                placeholder="Crediti da assegnare"
                value={creditDialog.amount}
                onChange={(e) =>
                  setCreditDialog((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                required
              />
              <textarea
                className="input min-h-[90px]"
                placeholder="Motivazione (opzionale)"
                value={creditDialog.reason}
                onChange={(e) =>
                  setCreditDialog((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setCreditDialog(null)}
                  disabled={actionBusy}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionBusy}
                >
                  {actionBusy ? "Salvataggio…" : "Conferma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {redeemDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-md space-y-4 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Riscatta premio
              </h3>
              <p className="text-sm text-slate-600">
                {redeemDialog.customer_name}
              </p>
            </div>
            <form className="space-y-4" onSubmit={submitRedeem}>
              <select
                className="input"
                value={redeemDialog.rewardId || ""}
                onChange={(e) =>
                  setRedeemDialog((prev) => ({
                    ...prev,
                    rewardId: Number(e.target.value),
                  }))
                }
                required
              >
                <option value="" disabled>
                  Seleziona un premio
                </option>
                {rewards.map((reward) => (
                  <option key={reward.id} value={reward.id}>
                    {reward.title} · {reward.cost_credits} crediti
                    {!reward.is_active ? " (non attivo)" : ""}
                  </option>
                ))}
              </select>
              <textarea
                className="input min-h-[90px]"
                placeholder="Nota interna (opzionale)"
                value={redeemDialog.note}
                onChange={(e) =>
                  setRedeemDialog((prev) => ({
                    ...prev,
                    note: e.target.value,
                  }))
                }
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setRedeemDialog(null)}
                  disabled={actionBusy}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionBusy}
                >
                  {actionBusy ? "Conferma…" : "Riscatta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
