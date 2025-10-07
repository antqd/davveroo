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

  const pendingCount = useMemo(
    () => refs.filter((r) => r.status === "pending").length,
    [refs]
  );
  const redeemedCount = useMemo(
    () => refs.filter((r) => r.status === "redeemed").length,
    [refs]
  );
  const totalReferralValue = useMemo(
    () => refs.reduce((sum, r) => sum + referralCreditCents(r), 0) / 100,
    [refs]
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

  function reloadData() {
    const base = customerId || me?.id;
    if (!base) return;
    loadAll(base);
  }

  const creditDisplay =
    credit != null && typeof credit === "number"
      ? credit.toFixed(2)
      : "--";
  const unlockedEuroDisplay = Number.isFinite(unlockedTotalEur)
    ? unlockedTotalEur.toFixed(2)
    : "0.00";
  const totalReferralValueDisplay = Number.isFinite(totalReferralValue)
    ? totalReferralValue.toFixed(2)
    : "0.00";

  return (
    <div className="space-y-10">
      <div className="card border-slate-200 bg-gradient-to-br from-white via-blue-50/40 to-white p-8 shadow-xl shadow-blue-100/40">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4 text-slate-700">
            <p className="text-xs uppercase tracking-[0.4em] text-blue-500/80">
              Il tuo spazio personale
            </p>
            <h1 className="text-3xl font-semibold leading-snug text-slate-900 md:text-4xl">
              Ciao {me?.name || "Davveroo friend"}!
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Qui trovi il tuo credito maturato, gli amici che hai coinvolto e
              tutti i dettagli per far crescere il programma referral Davveroo.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                ID utente #{me?.id ?? "?"}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                {me?.email || "email non disponibile"}
              </span>
              {customerId && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                  Cliente #{customerId}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white/90 px-6 py-6 text-right shadow-inner shadow-blue-100">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Credito disponibile
            </p>
            <p className="mt-3 text-5xl font-semibold text-slate-900 tabular-nums">
              {loading ? "···" : `${creditDisplay} €`}
            </p>
            <div className="mt-2 text-sm text-slate-500">
              Totale maturato: {totalReferralValueDisplay} € ·
              {"  "}
              <span className="text-emerald-500">
                {unlockedRefs.length} sbloccati
              </span>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={reloadData}
                disabled={loading}
              >
                Aggiorna dati
              </button>
              <button
                className="btn btn-primary"
                onClick={openRedeemFromCredit}
                disabled={!unlockedRefs.length || loading}
                title={
                  unlockedRefs.length
                    ? "Richiedi il riscatto del credito sbloccato"
                    : "Sblocca almeno un referral per riscattare"
                }
              >
                Riscatta
              </button>
            </div>
            {!loading && !!unlockedRefs.length && (
              <div className="mt-3 text-xs uppercase tracking-wide text-emerald-500">
                Pronti al riscatto: {unlockedEuroDisplay} €
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900">Invita un amico</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ogni amico attivo genera fino a 100€ di credito. Personalizza il
            messaggio e resta in contatto con il tuo network.
          </p>
          <form className="mt-6 space-y-4" onSubmit={addFriend}>
            <input
              className="input"
              placeholder="Nome amico *"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Email amico (opzionale)"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
            />
            <button className="btn btn-primary w-full justify-center" type="submit">
              Aggiungi amico
            </button>
          </form>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Statistiche referral
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Una panoramica rapida dei tuoi risultati e dello stato degli inviti.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Totali
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">
                {refs.length}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-500">
                In attesa
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">
                Sbloccati
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {unlockedRefs.length}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-700 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-500">
                Riscattati
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {redeemedCount}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">
            Valore referral complessivo: {totalReferralValueDisplay} €
          </p>
        </div>
      </div>

      <div className="card p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">I tuoi amici</h2>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm">
            {refs.length} referral
          </span>
        </div>
        <div className="mt-6 overflow-auto">
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
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                        in attesa
                      </span>
                    )}
                    {r.status === "unlocked" && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        sbloccato
                      </span>
                    )}
                    {r.status === "redeemed" && (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600">
                        riscattato
                      </span>
                    )}
                    {!["pending", "unlocked", "redeemed"].includes(
                      r.status
                    ) && (
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {r.status}
                      </span>
                    )}
                  </td>
                  <td className="td tabular-nums">
                    {(referralCreditCents(r) / 100).toFixed(2)} €
                  </td>
                  <td className="td">
                    {r.status === "unlocked" ? (
                      <span className="text-slate-600">
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
                  <td className="td text-center text-slate-500" colSpan={4}>
                    Nessun amico ancora. Invia il tuo primo invito!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {redeemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => !redeemBusy && setRedeemOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-blue-100/50">
            <h3 className="text-xl font-semibold text-slate-900">
              Riscatta credito
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Stai richiedendo il riscatto di{" "}
              <span className="font-semibold text-emerald-600">
                {unlockedEuroDisplay} €
              </span>{" "}
              ({unlockedRefs.length} referral sbloccati).
            </p>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <input
                  type="radio"
                  name="redeemMethod"
                  value="bonifico"
                  checked={redeemMethod === "bonifico"}
                  onChange={(e) => setRedeemMethod(e.target.value)}
                />
                Bonifico (IBAN)
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <input
                  type="radio"
                  name="redeemMethod"
                  value="gift"
                  checked={redeemMethod === "gift"}
                  onChange={(e) => setRedeemMethod(e.target.value)}
                />
                Gift card
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
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

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => setRedeemOpen(false)}
                disabled={redeemBusy}
              >
                Annulla
              </button>
              <button
                className="btn btn-primary"
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
