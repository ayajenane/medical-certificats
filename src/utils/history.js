const KEY = "action_history";
const MAX = 100;

export function logAction(action, description) {
  const entries = JSON.parse(localStorage.getItem(KEY) || "[]");
  entries.unshift({
    id: `h_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    description,
  });
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
}

export function getHistory() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
