import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import { useToast } from "../components/Toast";
import { getUser } from "../lib/auth";
import { itemsArray } from "../lib/apiUtils";

export default function Account() {
  const toast = useToast();

  const [me, setMe] = useState(null); // user {id, name, email}
  const [customerId, setCustomerId] = useState(""); // può essere users.id: il backend mappa
  const [credit, setCredit] = useState(null);
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Aggiungi amico
  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");

  // Modal riscatto (dal credito in alto)
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemMethod, setRedeemMethod] = useState("bonifico");
  const [redeemBusy, setRedeemBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = getUser();
        setMe(u || null);
        if (u?.id) {
          setCustomerId(String(u.id));
          await loadAll(u.id);
        }
      } catch (_e) {}
    })();
  }, []);

  async function loadAll(idAny) {
    setLoading(true);
    try {
      const c = await apiGet(`/customers/${idAny}/credit`);
      const creditValue =
        c?.credit_eur ?? c?.credit ?? c?.credito ?? c?.creditEuro ?? null;
      const numericCredit =
        typeof creditValue === "number"
          ? creditValue
          : Number.parseFloat(creditValue ?? "0");
      setCredit(Number.isFinite(numericCredit) ? numericCredit : 0);
      const r = await apiGet(`/customers/${idAny}/referrals`);
      setRefs(itemsArray(r));
    } catch (e) {
      toast.error(e.message || "Errore caricamento dati");
    } finally {
      setLoading(false);
    }
  }

  async function addFriend(e) {
    e.preventDefault();
    try {
      const refId = customerId || me?.id;
      if (!refId) return toast.error("Account non rilevato.");
      await apiPost("/referrals", {
        referrer_customer_id: Number(refId),
        friend_full_name: friendName,
        friend_email: friendEmail || null,
      });
      toast.success("Amico aggiunto!");
      setFriendName("");
      setFriendEmail("");
      await loadAll(refId);
    } catch (e) {
      toast.error(e.message || "Errore");
    }
  }

  function referralCreditCents(ref) {
    if (!ref || typeof ref !== "object") return 0;
    if (ref.promised_credit_cents != null)
      return Number(ref.promised_credit_cents) || 0;
    if (ref.promised_credit_eur != null)
      return Number(ref.promised_credit_eur) * 100 || 0;
    if (ref.promised_credit != null)
      return Number(ref.promised_credit) * 100 || 0;
    return 0;
  }

  // ==== Riscatto dal credito in alto ====
  const unlockedRefs = useMemo(
    () => refs.filter((r) => r.status === "unlocked"),
    [refs]
  );
  const unlockedTotalEur = useMemo(
    () =>
      unlockedRefs.reduce((sum, r) => sum + referralCreditCents(r), 0) / 100,
    [unlockedRefs]
  );

  function openRedeemFromCredit() {
    if (!unlockedRefs.length) return;
    setRedeemMethod("bonifico");
    setRedeemOpen(true);
  }

  async function confirmRedeemAll() {
    try {
      setRedeemBusy(true);
      // chiama il redeem per ciascun referral sbloccato
      await Promise.all(
        unlockedRefs.map((r) =>
          apiPost(`/referrals/${r.id}/redeem`, { method: redeemMethod })
        )
      );
      toast.success("Richiesta di riscatto inviata");
      setRedeemBusy(false);
      setRedeemOpen(false);
      await loadAll(customerId || me?.id);
    } catch (e) {
      setRedeemBusy(false);
      toast.error(e.message || "Errore nel riscatto");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Cliente</h1>

      {/* Credito + pulsante Riscatta */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div className="text-sm text-slate-700">
            Profilo: <b>{me?.name || "-"}</b> · {me?.email || "-"} (id #
            {me?.id ?? "?"})
          </div>
          {/* opzionale: potresti mostrare l'id cliente risolto */}
        </div>

        {!loading && credit != null && (
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="text-lg">
              Credito disponibile:{" "}
              <b>{credit.toFixed ? credit.toFixed(2) : credit} €</b>
            </div>

            <button
              className="btn disabled:opacity-50"
              onClick={openRedeemFromCredit}
              disabled={!unlockedRefs.length}
              title={
                unlockedRefs.length
                  ? ""
                  : "Nessun credito sbloccato da riscattare"
              }
            >
              Riscatta credito
            </button>
          </div>
        )}

        {/* hint piccoli */}
        {!loading && !!unlockedRefs.length && (
          <div className="mt-2 text-sm text-slate-600">
            Sbloccati: <b>{unlockedRefs.length}</b> amici — tot.{" "}
            <b>{unlockedTotalEur.toFixed(2)} €</b>
          </div>
        )}
      </div>

      {/* Invita amico */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Invita un amico</h2>
        <form className="grid gap-3" onSubmit={addFriend}>
          <input
            className="input"
            placeholder="Nome amico *"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Email amico (opz.)"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
          />
          <button className="btn" type="submit">
            Aggiungi amico
          </button>
        </form>
      </div>

      {/* Lista referral (senza bottoni di riscatto) */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">I tuoi amici</h2>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Amico</th>
                <th className="th">Stato</th>
                <th className="th">Credito</th>
                <th className="th">Note</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id}>
                  <td className="td">{r.amico || "-"}</td>
                  <td className="td">
                    {r.status === "pending" && (
                      <span className="px-2 py-1 rounded bg-yellow-50 text-yellow-800 text-xs">
                        in attesa
                      </span>
                    )}
                    {r.status === "unlocked" && (
                      <span className="px-2 py-1 rounded bg-green-50 text-green-800 text-xs">
                        sbloccato
                      </span>
                    )}
                    {r.status === "redeemed" && (
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-800 text-xs">
                        riscattato
                      </span>
                    )}
                    {!["pending", "unlocked", "redeemed"].includes(
                      r.status
                    ) && <span className="text-slate-500">{r.status}</span>}
                  </td>
                  <td className="td">
                    {(referralCreditCents(r) / 100).toFixed(2)} €
                  </td>
                  <td className="td">
                    {r.status === "unlocked" ? (
                      <span className="text-slate-500">
                        Incluso nel riscatto dal credito
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {refs.length === 0 && (
                <tr>
                  <td className="td" colSpan={4}>
                    Nessun amico ancora.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL RISCATTO (dal credito) */}
      {redeemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !redeemBusy && setRedeemOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-5 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-2">Riscatta credito</h3>
            <p className="text-sm text-slate-600 mb-4">
              Stai richiedendo il riscatto di{" "}
              <b>{unlockedTotalEur.toFixed(2)} €</b> ({unlockedRefs.length}{" "}
              referral sbloccati).
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="redeemMethod"
                  value="bonifico"
                  checked={redeemMethod === "bonifico"}
                  onChange={(e) => setRedeemMethod(e.target.value)}
                />
                Bonifico (IBAN)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="redeemMethod"
                  value="gift"
                  checked={redeemMethod === "gift"}
                  onChange={(e) => setRedeemMethod(e.target.value)}
                />
                Gift card
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="redeemMethod"
                  value="bolletta"
                  checked={redeemMethod === "bolletta"}
                  onChange={(e) => setRedeemMethod(e.target.value)}
                />
                Sconto bolletta
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setRedeemOpen(false)}
                disabled={redeemBusy}
              >
                Annulla
              </button>
              <button
                className="btn disabled:opacity-60"
                onClick={confirmRedeemAll}
                disabled={redeemBusy}
              >
                {redeemBusy ? "Invio..." : "Conferma riscatto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
