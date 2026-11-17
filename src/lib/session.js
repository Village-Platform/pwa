import { useSyncExternalStore } from "react";

// The signed-in user and tokens, kept in localStorage.
// v1 trade-off: localStorage is readable by any script on this origin (XSS risk), unlike an
// httpOnly cookie. Accepted for now because the API is bearer-only and the app renders no HTML
// from the server; see the README for the cookie options.
const K = { token: "aghour.token", user: "aghour.user", guest: "aghour.guest" };

const read = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(K.user) || "null");
  } catch {}
  return { token: localStorage.getItem(K.token), user, guestToken: localStorage.getItem(K.guest) };
};

let state = read();
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (key, value) => (value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value));

export const session = {
  get: () => state,
  subscribe: (l) => (listeners.add(l), () => listeners.delete(l)),
  signIn({ token, user }) {
    set(K.token, token);
    set(K.user, JSON.stringify(user));
    state = { ...state, token, user };
    emit();
  },
  setUser(user) {
    set(K.user, JSON.stringify(user));
    state = { ...state, user };
    emit();
  },
  setGuestToken(token) {
    set(K.guest, token);
    state = { ...state, guestToken: token };
  },
  clear() {
    set(K.token, null);
    set(K.user, null);
    state = { ...state, token: null, user: null };
    emit();
  },
};

// Another tab signed in or out: follow it.
window.addEventListener("storage", (e) => {
  if (Object.values(K).includes(e.key)) {
    state = read();
    emit();
  }
});

export const useSession = () => useSyncExternalStore(session.subscribe, session.get);
