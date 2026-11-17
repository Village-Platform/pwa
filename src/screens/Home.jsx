import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api/endpoints.js";
import { useLoad } from "../lib/hooks.js";
import { useSession } from "../lib/session.js";
import { useFeatures } from "../lib/features.js";
import { greeting, relativeTime } from "../lib/format.js";
import { S } from "../lib/strings.js";
import Icon from "../components/Icon.jsx";
import InstallBanner from "../components/InstallBanner.jsx";
import PullToRefresh from "../components/PullToRefresh.jsx";
import { BrandMark, ErrorBanner, FirmRow, IconTile, NewsRow, SearchPill, SectionHeader, SkeletonRows } from "../components/ui.jsx";

export default function Home() {
  const nav = useNavigate();
  const { user } = useSession();
  const { plans: plansOn } = useFeatures();
  const [tick, setTick] = useState(0);

  const cats = useLoad(() => Api.categories().then((r) => r.data), [tick]);
  // Featured firms and news are bonus sections: the page still works if they fail.
  const firms = useLoad(() => Api.firms({ perPage: 4 }).then((r) => r.data), [tick]);
  const news = useLoad(() => Api.articles({ perPage: 3 }).then((r) => r.data), [tick]);
  // The bell is shown to guests too: their install has its own broadcast inbox.
  const unread = useLoad(() => Api.notifications({ perPage: 1 }).then((r) => r.meta?.unread_count ?? 0), [tick, user?.id]);

  // Signed in → add a firm directly (the server answers if the plan does not allow it);
  // guests → the plans when they are on; otherwise the banner is only artwork.
  const onAddFirm = user ? () => nav("/firms/new") : plansOn ? () => nav("/plans") : null;

  return (
    <PullToRefresh
      onRefresh={() => {
        setTick((t) => t + 1);
        return new Promise((r) => setTimeout(r, 700));
      }}
    >
      <div className="pb-6 pt-safe">
        <div className="px-5 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted">{greeting(S)}</p>
              <p className="text-lg font-bold truncate">{user ? `${user.name.split(" ")[0]} 👋` : S.heyGuest}</p>
            </div>
            <button
              onClick={() => nav("/notifications")}
              className="relative w-[42px] h-[42px] rounded-[14px] bg-surface2 border border-line grid place-items-center"
              aria-label={S.notifications}
            >
              <Icon name="bell" />
              {unread.data > 0 && (
                <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-bad text-white text-[10px] font-black grid place-items-center border-[1.5px] border-surface">
                  {unread.data > 9 ? "9+" : unread.data}
                </span>
              )}
            </button>
            <BrandMark className="h-10 w-10 object-contain" />
          </div>
          <div className="mt-3" onClick={() => nav("/explore?focus=1")}>
            <SearchPill placeholder={S.searchHint} readOnly />
          </div>
        </div>

        <InstallBanner />

        <div className="mt-4">
          <ErrorBanner error={!cats.data && cats.error} onRetry={() => setTick((t) => t + 1)} />
          {cats.loading && !cats.data ? (
            <div className="flex gap-3 px-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="w-[50px] h-[50px] rounded-2xl bg-surface2 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4">
              {(cats.data || []).map((c) => (
                <button key={c.id} onClick={() => nav(`/explore?category=${c.id}`)} className="w-[62px] shrink-0 flex flex-col items-center">
                  <IconTile url={c.icon_url} size={50} />
                  <span className="mt-1 text-[11px] font-bold text-center w-full truncate">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 mt-4">
          {onAddFirm ? (
            <button onClick={onAddFirm} className="block w-full" aria-label={S.addYourFirm}>
              <img src="/brand/cover_banner.jpg" alt="" className="w-full aspect-[2/1] object-cover rounded-2xl" />
            </button>
          ) : (
            <img src="/brand/cover_banner.jpg" alt="" className="w-full aspect-[2/1] object-cover rounded-2xl" />
          )}
        </div>

        {firms.data?.length > 0 && (
          <>
            <SectionHeader title={S.featuredFirms} onSeeAll={() => nav("/explore")} />
            <div className="px-4 space-y-2">
              {firms.data.map((f) => (
                <FirmRow key={f.id} firm={f} onClick={() => nav(`/firms/${f.id}`)} />
              ))}
            </div>
          </>
        )}

        {news.data?.length > 0 && (
          <>
            <SectionHeader title={S.sectionLatestNews} onSeeAll={() => nav("/news")} />
            <div className="px-4 space-y-2">
              {news.data.map((a) => (
                <NewsRow key={a.id} article={a} relative={relativeTime(a.published_at)} onClick={() => nav(`/news/${a.id}`)} />
              ))}
            </div>
          </>
        )}

        {(firms.loading || news.loading) && !firms.data && (
          <div className="mt-4">
            <SkeletonRows count={3} />
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
