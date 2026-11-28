import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { usePaged } from "../../lib/hooks";
import { relativeTime } from "../../lib/format";
import { S } from "../../lib/strings";
import PagedList from "../../components/PagedList.jsx";
import PullToRefresh from "../../components/PullToRefresh.jsx";
import { FirmRow, NewsRow, ScreenTitle, Segmented } from "../../components/ui.jsx";

/** What is waiting for a decision. Tap a row to open it: the approve / reject controls are on its page. */
export default function ReviewQueue() {
  const [tab, setTab] = useState("firms");
  return (
    <div className="pb-6">
      <ScreenTitle title={S.reviewQueue} />
      <div className="px-4 pt-3">
        <Segmented
          options={[
            { value: "firms", label: S.reviewFirmsTab },
            { value: "articles", label: S.reviewArticlesTab },
          ]}
          selected={tab}
          onSelect={setTab}
        />
      </div>
      {/* key: each tab starts with its own list state */}
      {tab === "firms" ? <PendingFirms key="firms" /> : <PendingArticles key="articles" />}
    </div>
  );
}

function PendingFirms() {
  const nav = useNavigate();
  const list = usePaged((page) => Api.pendingFirms({ page }), []);
  return (
    <PullToRefresh onRefresh={list.refresh}>
      <PagedList
        list={list}
        empty={S.noPendingFirms}
        className="px-4 pt-4 space-y-2"
        renderItem={(f) => <FirmRow key={f.id} firm={f} onClick={() => nav(`/firms/${f.id}`)} />}
      />
    </PullToRefresh>
  );
}

function PendingArticles() {
  const nav = useNavigate();
  const list = usePaged((page) => Api.pendingArticles({ page }), []);
  return (
    <PullToRefresh onRefresh={list.refresh}>
      <PagedList
        list={list}
        empty={S.noPendingArticles}
        className="px-4 pt-4 space-y-2"
        renderItem={(a) => (
          <NewsRow
            key={a.id}
            article={a}
            relative={relativeTime(a.published_at || a.created_at)}
            onClick={() => nav(`/news/${a.id}`)}
          />
        )}
      />
    </PullToRefresh>
  );
}
