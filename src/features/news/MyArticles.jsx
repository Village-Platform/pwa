import { useNavigate } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { usePaged } from "../../lib/hooks";
import { relativeTime } from "../../lib/format";
import { S } from "../../lib/strings";
import Icon from "../../components/Icon.jsx";
import PagedList from "../../components/PagedList.jsx";
import PullToRefresh from "../../components/PullToRefresh.jsx";
import { Badge, NewsRow, ScreenTitle } from "../../components/ui.jsx";

const TONE = { approved: "green", pending: "gold", rejected: "red" };

/** The author's own articles in every state, each with its review status and any rejection reason. */
export default function MyArticles() {
  const nav = useNavigate();
  const list = usePaged((page) => Api.myArticles({ page }), []);
  return (
    <div className="pb-6">
      <ScreenTitle
        title={S.myArticles}
        action={
          <button onClick={() => nav("/articles/new")} className="p-2 text-goldInk" aria-label={S.addArticle}>
            <Icon name="plus" size={26} />
          </button>
        }
      />
      <PullToRefresh onRefresh={list.refresh}>
        <PagedList
          list={list}
          skeletons={[3, 1]}
          empty={S.noMyArticles}
          className="px-4 pt-4 space-y-2.5"
          renderItem={(a) => (
            <div key={a.id} className="space-y-1">
              <Badge tone={TONE[a.review_status] ?? "gold"}>{S.reviewStatus[a.review_status] || a.review_status}</Badge>
              <NewsRow
                article={a}
                relative={relativeTime(a.published_at || a.created_at)}
                onClick={() => nav(`/news/${a.id}`)}
              />
              {a.rejection_reason && <p className="text-sm text-bad px-1">{a.rejection_reason}</p>}
            </div>
          )}
        />
      </PullToRefresh>
    </div>
  );
}
