import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Api } from "../../api/endpoints";
import { useDebounced, useLoad, usePaged } from "../../lib/hooks";
import { S } from "../../lib/strings";
import PagedList from "../../components/PagedList.jsx";
import { FilterChipsRow, FirmRow, ScreenTitle, SearchPill } from "../../components/ui.jsx";

export default function Explore() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("category") ? Number(params.get("category")) : null;
  const [q, setQ] = useState("");
  const query = useDebounced(q.trim());

  const cats = useLoad(() => Api.categories().then((r) => r.data));
  const list = usePaged((page) => Api.firms({ q: query, categoryId, page }), [query, categoryId]);

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
      <PagedList
        list={list}
        skeletons={[6, 2]}
        empty={query ? S.searchNoResults(query) : S.noFirms}
        renderItem={(f) => <FirmRow key={f.id} firm={f} onClick={() => nav(`/firms/${f.id}`)} />}
      />
    </div>
  );
}
