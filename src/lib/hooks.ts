import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "../components/Toast.jsx";
import { S } from "./strings";
import type { Page } from "../api/types";

type DepList = readonly unknown[];

export interface LoadState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

/**
 * Loads one thing. `deps` re-run it; reload() runs it again (retry / pull to refresh) and returns a
 * promise that settles when the new answer is in, so a pull-to-refresh can wait for it.
 * A failed reload keeps the previous data.
 */
export function useLoad<T>(fn: () => Promise<T>, deps: DepList = []) {
  const [state, setState] = useState<LoadState<T>>({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0); // only the newest call may set state

  const run = useCallback((): Promise<void> => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    return fnRef.current().then(
      (data) => {
        if (id === seq.current) setState({ data, error: null, loading: false });
      },
      (error: Error) => {
        if (id === seq.current) setState((s) => ({ data: s.data, error, loading: false }));
      },
    );
  }, []);

  useEffect(() => {
    run();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- a counter, not a DOM ref
      seq.current++; // unmounted, or the deps changed: ignore the old answer
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run };
}

/**
 * A paged list (the Android Explore pattern: canLoadMore + loadMore, triggered by scrolling).
 * fetchPage(page) must resolve to the API's { data, meta } envelope.
 */
export interface PagedState<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  error: Error | null;
}

export function usePaged<T>(fetchPage: (page: number) => Promise<Page<T>>, deps: DepList = []) {
  const empty: PagedState<T> = { items: [], page: 0, totalPages: 1, total: 0, loading: true, error: null };
  const [s, setS] = useState<PagedState<T>>(empty);
  const gen = useRef(0);

  const load = useCallback(
    (page: number, g: number): Promise<void> => {
      setS((x) => ({ ...x, loading: true, error: null }));
      return fetchPage(page)
        .then((res) => {
          if (g !== gen.current) return; // a newer search replaced this one
          setS((x) => ({
            items: page === 1 ? res.data : [...x.items, ...res.data],
            page,
            totalPages: res.meta?.total_pages ?? 1,
            total: res.meta?.total ?? res.data.length,
            loading: false,
            error: null,
          }));
        })
        .catch((error: Error) => {
          if (g === gen.current) setS((x) => ({ ...x, loading: false, error }));
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    const g = ++gen.current;
    setS({ items: [], page: 0, totalPages: 1, total: 0, loading: true, error: null });
    load(1, g);
  }, [load]);

  const canLoadMore = !s.loading && !s.error && s.page < s.totalPages;
  return {
    ...s,
    canLoadMore,
    loadMore: async (): Promise<void> => {
      if (canLoadMore) await load(s.page + 1, gen.current);
    },

    retry: () => load(Math.max(1, s.page + (s.items.length ? 1 : 0)), gen.current),
    // Resolves when the first page is back (pull to refresh waits for it).
    refresh: () => load(1, ++gen.current),
  };
}

/** Calls onVisible when the returned ref's element scrolls into view. */
export function useOnVisible(onVisible: () => unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onVisible);
  cb.current = onVisible;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && cb.current(), {
      rootMargin: "400px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    addEventListener("online", on);
    addEventListener("offline", off);
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/**
 * Shares the current page: the system share sheet when there is one, else copies text and the link.
 * `text` is optional extra lines (a firm's name, address, phone). Pass the title and text at call time.
 */
export function useShare() {
  return useCallback(({ title, text }: { title?: string; text?: string } = {}) => {
    const url = location.href;
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText([text, url].filter(Boolean).join("\n")).then(() => toast(S.copied));
    }
  }, []);
}
