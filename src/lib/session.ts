import { useSyncExternalStore } from "react";
import type { User } from "../api/types";

// The signed-in user and tokens, kept in localStorage.
// v1 trade-off: localStorage is readable by any script on this origin (XSS risk), unlike an
// httpOnly cookie. Accepted for now because the API is bearer-only and the app renders no HTML
// from the server; see the README for the cookie options.
const K = { token: "aghour.token", user: "aghour.user", guest: "aghour.guest" };

export interface SessionState {
  token: string | null;
  user: User | null;
  guestToken: string | null;
}

const read = (): SessionState => {
  let user: User | null = null;
  try {
    user = JSON.parse(localStorage.getItem(K.user) || "null");
  } catch {}
  return { token: localStorage.getItem(K.token), user, guestToken: localStorage.getItem(K.guest) };
};

let state = read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
// Cached API reads can differ per user (e.g. `can` flags), so drop them whenever the identity changes.
const dropApiCache = () => {
  try {
    caches?.delete("api-read");
  } catch {}
};
const set = (key: string, value: string | null | undefined) =>
  value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value);

export const session = {
  get: (): SessionState => state,
  subscribe: (l: () => void) => (listeners.add(l), () => listeners.delete(l)),
  signIn({ token, user }: { token: string; user: User }) {
    set(K.token, token);
    set(K.user, JSON.stringify(user));
    state = { ...state, token, user };
    dropApiCache();
    emit();
  },
  setUser(user: User) {
    set(K.user, JSON.stringify(user));
    state = { ...state, user };
    emit();
  },
  setGuestToken(token: string | null) {
    set(K.guest, token);
    state = { ...state, guestToken: token };
  },
  clear() {
    set(K.token, null);
    set(K.user, null);
    state = { ...state, token: null, user: null };
    dropApiCache();
    emit();
  },
};

// Another tab signed in or out: follow it.
window.addEventListener("storage", (e) => {
  if (e.key && Object.values(K).includes(e.key)) {
    state = read();
    emit();
  }
});

export const useSession = () => useSyncExternalStore(session.subscribe, session.get);
