import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

export default function Account() {
  const [customerId, setCustomerId] = useState("");
  const [credit, setCredit] = useState(null);
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Aggiungi amico
  const [friendName, setFriendName] = useState("");
  const [friendEmail, setFriendEmail] = useState("");

  function note(ok, text) {
    ok ? setMsg(text) : setErr(text);
    setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 4000);
  }

  async function loadAll(id) {
    setLoading(true);
    try {
      const c = await apiGet(`/api/customers/${id}/credit`);
      setCredit(c.credit_eur);
      const r = await apiGet(`/api/customers/${id}/referrals`);
      setRefs(r.items || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addFriend(e) {
    e.preventDefault();
    try {
      if (!customerId) return note(false, "Inserisci prima il tuo ID cliente");
      const body = {
        referrer_customer_id: Number(customerId),
        friend_full_name: friendName,
        friend_email: friendEmail || null,
      };
      await apiPost("/api/referrals", body);
      note(true, "Amico aggiunto! (referral pending)");
      setFriendName("");
      setFriendEmail("");
      loadAll(customerId);
    } catch (e) {
      note(false, e.message);
    }
  }

  async function redeem(referralId, method) {
    try {
      await apiPost(`/api/referrals/${referralId}/redeem`, { method });
      note(true, "Richiesta di riscatto inviata");
      loadAll(customerId);
    } catch (e) {
      note(false, e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Cliente</h1>

      {msg && (
        <div className="p-3 rounded bg-green-50 text-green-700">{msg}</div>
      )}
      {err && <div className="p-3 rounded bg-red-50 text-red-700">{err}</div>}

      <div className="card">
        <div className="flex gap-3 items-end">
          <input
            className="input w-60"
            placeholder="Tuo ID cliente"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <button
            className="btn"
            onClick={() => customerId && loadAll(customerId)}
          >
            Carica
          </button>
        </div>

        {!loading && credit != null && (
          <div className="mt-4">
            <div className="text-lg">
              Credito disponibile:{" "}
              <b>{credit.toFixed ? credit.toFixed(2) : credit} €</b>
            </div>
          </div>
        )}
      </div>

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

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">I tuoi amici</h2>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Amico</th>
                <th className="th">Stato</th>
                <th className="th">Credito</th>
                <th className="th">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id}>
                  <td className="td">{r.amico || "-"}</td>
                  <td className="td">{r.status}</td>
                  <td className="td">
                    {(r.promised_credit_cents / 100).toFixed(2)} €
                  </td>
                  <td className="td">
                    {r.status === "unlocked" ? (
                      <div className="flex gap-2">
                        <button
                          className="btn"
                          onClick={() => redeem(r.id, "bonifico")}
                        >
                          Riscatta bonifico
                        </button>
                        <button
                          className="btn"
                          onClick={() => redeem(r.id, "gift")}
                        >
                          Gift
                        </button>
                        <button
                          className="btn"
                          onClick={() => redeem(r.id, "bolletta")}
                        >
                          Bolletta
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
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
    </div>
  );
}
