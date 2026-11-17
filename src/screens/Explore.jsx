import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Api } from "../api/endpoints.js";
import { useDebounced, useLoad, useOnVisible, usePaged } from "../lib/hooks.js";
import { S } from "../lib/strings.js";
import { ErrorBanner, FilterChipsRow, FirmRow, MessageBox, ScreenTitle, SearchPill, SkeletonRows } from "../components/ui.jsx";

export default function Explore() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("category") ? Number(params.get("category")) : null;
  const [q, setQ] = useState("");
  const query = useDebounced(q.trim());

  const cats = useLoad(() => Api.categories().then((r) => r.data));
  const list = usePaged((page) => Api.firms({ q: query, categoryId, page }), [query, categoryId]);
  const sentinel = useOnVisible(() => list.loadMore());

  const chips = [{ value: null, label: S.all }, ...(cats.data || []).map((c) => ({ value: c.id, label: c.name }))];

  return (
    <div className="pb-6">
      <ScreenTitle title={S.tabExplore} back={false} />
      <div className="px-4 pt-3">
        <SearchPill value={q} onChange={setQ} placeholder={S.exploreHint} autoFocus={params.get("focus") === "1"} />
      </div>
      <FilterChipsRow
        items={chips}
        selected={categoryId}
        onSelect={(v) => setParams(v ? { category: String(v) } : {}, { replace: true })}
      />
      {!list.loading && !list.error && list.items.length > 0 && (
        <p className="px-4 text-sm text-muted mb-2">{S.resultsCount(list.total)}</p>
      )}
      <div className="px-4 space-y-2">
        {list.items.map((f) => (
          <FirmRow key={f.id} firm={f} onClick={() => nav(`/firms/${f.id}`)} />
        ))}
      </div>
      {list.loading && <SkeletonRows count={list.items.length ? 2 : 6} />}
      <ErrorBanner error={list.error} onRetry={list.retry} />
      {!list.loading && !list.error && list.items.length === 0 && (
        <MessageBox text={query ? S.searchNoResults(query) : S.noFirms} />
      )}
      <div ref={sentinel} className="h-1" />
    </div>
  );
}
