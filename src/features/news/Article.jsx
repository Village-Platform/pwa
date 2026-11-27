import { useNavigate, useParams } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { useLoad, useShare } from "../../lib/hooks";
import { formatDate, kindTone } from "../../lib/format";
import { S } from "../../lib/strings";
import Icon from "../../components/Icon.jsx";
import { Badge, ErrorBanner, ScreenTitle, SkeletonRows } from "../../components/ui.jsx";

export default function Article() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: a, error, loading, reload } = useLoad(() => Api.article(id).then((r) => r.data), [id]);

  const shareArticle = useShare();
  const share = () => shareArticle({ title: a.title });

  return (
    <div className="pb-8">
      <ScreenTitle
        title={S.newsTitle}
        action={
          a && (
            <div className="flex">
              {/* The author (while it is under review) or the super admin; the server sends `can`. */}
              {a.can?.update && (
                <button onClick={() => nav(`/articles/${a.id}/edit`)} className="px-3 text-sm font-bold text-goldInk">
                  {S.edit}
                </button>
              )}
              <button onClick={share} className="p-2 rounded-full active:bg-surface2" aria-label={S.share}>
                <Icon name="share" />
              </button>
            </div>
          )
        }
      />
      {loading && !a && <SkeletonRows count={3} />}
      <ErrorBanner error={error} onRetry={reload} />
      {a && (
        <article className="px-4 pt-4">
          <div className="flex items-center gap-2">
            <Badge tone={kindTone(a.kind)}>{S.kind[a.kind] || a.kind}</Badge>
            {(a.review_status === "pending" || !a.published_at) && <Badge tone="gold">{S.underReview}</Badge>}
            <span className="text-sm text-muted">{formatDate(a.published_at)}</span>
          </div>
          <h2 className="text-2xl font-extrabold leading-snug mt-3">{a.title}</h2>
          <p className="text-sm text-muted mt-1">{a.author?.name}</p>
          {/* Plain text from the API, rendered as text (never as HTML). */}
          <p className="mt-5 leading-loose whitespace-pre-line text-[17px]">{a.body}</p>
        </article>
      )}
    </div>
  );
}
