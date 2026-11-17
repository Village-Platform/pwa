import { useNavigate } from "react-router-dom";
import { Api } from "../api/endpoints.js";
import { useOnVisible, usePaged } from "../lib/hooks.js";
import { firmStatusTone } from "../lib/format.js";
import { S } from "../lib/strings.js";
import Icon from "../components/Icon.jsx";
import PullToRefresh from "../components/PullToRefresh.jsx";
import { Badge, ErrorBanner, FirmRow, MessageBox, ScreenTitle, SkeletonRows } from "../components/ui.jsx";

/** The owner's own firms, pending and suspended ones included, each with its status. */
export default function MyFirms() {
  const nav = useNavigate();
  const list = usePaged((page) => Api.myFirms({ page }), []);
  const sentinel = useOnVisible(() => list.loadMore());
  return (
    <div className="pb-6">
      <ScreenTitle
        title={S.myFirms}
        action={
          <button onClick={() => nav("/firms/new")} className="p-2 text-goldInk" aria-label={S.addFirm}>
            <Icon name="plus" size={26} />
          </button>
        }
      />
      <PullToRefresh
        onRefresh={() => {
          list.refresh();
          return new Promise((r) => setTimeout(r, 700));
        }}
      >
        <div className="px-4 pt-4 space-y-2.5">
          {list.items.map((f) => (
            <div key={f.id} className="space-y-1">
              <Badge tone={firmStatusTone(f.status)}>{S.firmStatus[f.status] || f.status}</Badge>
              <FirmRow firm={f} onClick={() => nav(`/firms/${f.id}`)} />
            </div>
          ))}
        </div>
        {list.loading && <SkeletonRows count={list.items.length ? 1 : 3} />}
        <ErrorBanner error={list.error} onRetry={list.retry} />
        {!list.loading && !list.error && list.items.length === 0 && <MessageBox text={S.noMyFirms} />}
        <div ref={sentinel} className="h-1" />
      </PullToRefresh>
    </div>
  );
}
