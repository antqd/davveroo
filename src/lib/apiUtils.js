// Normalizes API shapes that can either return a plain array or wrap it
// inside keys like items, data, results, rows, etc.
export function itemsArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    "items",
    "data",
    "results",
    "rows",
    "list",
    "records",
  ];

  for (const key of candidates) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }

  // Some backends nest the array under payload.data.items, etc.
  if (payload.data && typeof payload.data === "object") {
    for (const key of candidates) {
      const value = payload.data[key];
      if (Array.isArray(value)) return value;
    }
  }

  return [];
}
