export function lGet(key, fb) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; }
  catch { return fb; }
}

export function lSet(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

export async function sGet(key) {
  try { const r = await window.storage.get(key, true); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}

export async function sSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); } catch {}
}
