import { useNavigate } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { usePaged } from "../../lib/hooks";
import { firmStatusTone } from "../../lib/format";
import { S } from "../../lib/strings";
import Icon from "../../components/Icon.jsx";
import PullToRefresh from "../../components/PullToRefresh.jsx";
import PagedList from "../../components/PagedList.jsx";
import { Badge, FirmRow, ScreenTitle } from "../../components/ui.jsx";

/** The owner's own firms, pending and suspended ones included, each with its status. */
export default function MyFirms() {
  const nav = useNavigate();
  const list = usePaged((page) => Api.myFirms({ page }), []);
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
      <PullToRefresh onRefresh={list.refresh}>
        <PagedList
          list={list}
          skeletons={[3, 1]}
          empty={S.noMyFirms}
          className="px-4 pt-4 space-y-2.5"
          renderItem={(f) => (
            <div key={f.id} className="space-y-1">
              <Badge tone={firmStatusTone(f.status)}>{S.firmStatus[f.status] || f.status}</Badge>
              <FirmRow firm={f} onClick={() => nav(`/firms/${f.id}`)} />
            </div>
          )}
        />
      </PullToRefresh>
    </div>
  );
}
