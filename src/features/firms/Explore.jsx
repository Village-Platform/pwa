import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Api } from "../../api/endpoints";
import { useDebounced, useLoad, usePaged } from "../../lib/hooks";
import { S } from "../../lib/strings";
import PagedList from "../../components/PagedList.jsx";
import { FilterChipsRow, FirmRow, ScreenTitle, SearchPill } from "../../components/ui.jsx";

export default function Explore() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const categoryParam = Number(params.get("category"));
  const categoryId = Number.isInteger(categoryParam) && categoryParam > 0 ? categoryParam : null;
  // The search lives in the URL (?q=), so Back from a firm returns to the same results.
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const query = useDebounced(q.trim());
  const urlQuery = params.get("q") ?? "";
  useEffect(() => {
    if (urlQuery === query) return;
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (query) next.set("q", query);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [query, urlQuery, setParams]);

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
        onSelect={(v) =>
          setParams(
            (p) => {
              const next = new URLSearchParams(p);
              if (v) next.set("category", String(v));
              else next.delete("category");
              next.delete("focus");
              return next;
            },
            { replace: true },
          )
        }
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
