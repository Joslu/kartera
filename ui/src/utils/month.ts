const STORAGE_KEY = "activeMonthId";

export function getStoredMonthId(defaultId: string) {
  if (typeof window === "undefined") return defaultId;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored || defaultId;
}

export function setStoredMonthId(monthId: string) {
  if (typeof window === "undefined") return;
  if (!monthId) return;
  window.localStorage.setItem(STORAGE_KEY, monthId);
}
