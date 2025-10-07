import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

let idSeq = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((payload) => {
    const id = idSeq++;
    const t = { id, ...payload };
    setToasts((curr) => [...curr, t]);
    const ttl = payload.ttl ?? 2500;
    setTimeout(() => remove(id), ttl);
  }, [remove]);

  const api = useMemo(() => ({
    success(msg, opts) { push({ type: "success", msg, ...(opts || {}) }); },
    error(msg, opts)   { push({ type: "error",   msg, ...(opts || {}) }); },
    info(msg, opts)    { push({ type: "info",    msg, ...(opts || {}) }); },
  }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* container */}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
        {toasts.map(t => (
          <div key={t.id}
               className={
                 "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-slate-200/60 bg-white/95 " +
                 (t.type === "success"
                   ? "border-emerald-200 text-emerald-700"
                   : t.type === "error"
                   ? "border-rose-200 text-rose-700"
                   : "border-sky-200 text-sky-700")
               }>
            <span className="mt-0.5 text-lg leading-none">
              {t.type === "success" ? "✨" : t.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <div className="text-sm">{t.msg}</div>
            <button
              onClick={() => remove(t.id)}
              className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-opacity hover:text-slate-700"
            >
              chiudi
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
