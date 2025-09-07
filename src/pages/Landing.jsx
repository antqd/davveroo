export default function Landing() {
  return (
    <div className="card space-y-3">
      <h1 className="text-3xl font-bold">Davveroo</h1>
      <p className="text-gray-600">
        Programma referral: invita un amico, quando acquista sblocchi 100€.
      </p>
      <div className="flex gap-3">
        <a className="btn-primary" href="/dashboard">Dashboard Agente</a>
        <a className="btn" href="/account">Il mio Account</a>
      </div>
    </div>
  )
}