import { useCallback, useEffect, useRef, useState } from "react";

/** Loads one thing. `deps` re-run it; reload() runs it again (retry / pull to refresh). */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState((s) => ({ data: s.data, error, loading: false })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: useCallback(() => setTick((t) => t + 1), []) };
}

/**
 * A paged list (the Android Explore pattern: canLoadMore + loadMore, triggered by scrolling).
 * fetchPage(page) must resolve to the API's { data, meta } envelope.
 */
export function usePaged(fetchPage, deps = []) {
  const [s, setS] = useState({ items: [], page: 0, totalPages: 1, total: 0, loading: true, error: null });
  const gen = useRef(0);

  const load = useCallback(
    (page, g) => {
      setS((x) => ({ ...x, loading: true, error: null }));
      fetchPage(page)
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
        .catch((error) => g === gen.current && setS((x) => ({ ...x, loading: false, error })));
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
    loadMore: () => canLoadMore && load(s.page + 1, gen.current),
    retry: () => load(Math.max(1, s.page + (s.items.length ? 1 : 0)), gen.current),
    refresh: () => load(1, ++gen.current),
  };
}

/** Calls onVisible when the returned ref's element scrolls into view. */
export function useOnVisible(onVisible) {
  const ref = useRef(null);
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

export function useDebounced(value, ms = 350) {
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
