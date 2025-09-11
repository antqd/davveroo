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
                 "pointer-events-auto flex items-start gap-2 rounded-xl px-4 py-3 shadow-lg " +
                 (t.type === "success" ? "bg-green-50 text-green-800 border border-green-200" :
                  t.type === "error"   ? "bg-red-50 text-red-800 border border-red-200" :
                                         "bg-slate-50 text-slate-800 border border-slate-200")
               }>
            <span className="mt-0.5">
              {t.type === "success" ? "✅" : t.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <div className="text-sm">{t.msg}</div>
            <button onClick={() => remove(t.id)} className="ml-2 text-xs opacity-60 hover:opacity-100">chiudi</button>
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
