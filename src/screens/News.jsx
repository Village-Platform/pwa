import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Api } from "../api/endpoints.js";
import { useOnVisible, usePaged } from "../lib/hooks.js";
import { relativeTime } from "../lib/format.js";
import { S } from "../lib/strings.js";
import { ErrorBanner, FilterChipsRow, MessageBox, NewsRow, ScreenTitle, SkeletonRows } from "../components/ui.jsx";

const KINDS = [
  { value: null, label: S.all },
  { value: "news", label: S.filterNews },
  { value: "announcement", label: S.filterAnnouncements },
  { value: "article", label: S.filterArticles },
];

export default function News() {
  const nav = useNavigate();
  const [kind, setKind] = useState(null);
  const list = usePaged((page) => Api.articles({ kind, page }), [kind]);
  const sentinel = useOnVisible(() => list.loadMore());

  return (
    <div className="pb-6">
      <ScreenTitle title={S.newsTitle} back={false} />
      <FilterChipsRow items={KINDS} selected={kind} onSelect={setKind} />
      <div className="px-4 space-y-2">
        {list.items.map((a) => (
          <NewsRow key={a.id} article={a} relative={relativeTime(a.published_at)} onClick={() => nav(`/news/${a.id}`)} />
        ))}
      </div>
      {list.loading && <SkeletonRows count={list.items.length ? 2 : 5} />}
      <ErrorBanner error={list.error} onRetry={list.retry} />
      {!list.loading && !list.error && list.items.length === 0 && <MessageBox text={S.noNews} />}
      <div ref={sentinel} className="h-1" />
    </div>
  );
}
