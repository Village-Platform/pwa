import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Api } from "../../api/endpoints";
import { usePaged } from "../../lib/hooks";
import { relativeTime } from "../../lib/format";
import { S } from "../../lib/strings";
import PagedList from "../../components/PagedList.jsx";
import { FilterChipsRow, NewsRow, ScreenTitle } from "../../components/ui.jsx";

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

  return (
    <div className="pb-6">
      <ScreenTitle title={S.newsTitle} back={false} />
      <FilterChipsRow items={KINDS} selected={kind} onSelect={setKind} />
      <PagedList
        list={list}
        empty={S.noNews}
        renderItem={(a) => (
          <NewsRow
            key={a.id}
            article={a}
            relative={relativeTime(a.published_at)}
            onClick={() => nav(`/news/${a.id}`)}
          />
        )}
      />
    </div>
  );
}
