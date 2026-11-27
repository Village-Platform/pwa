import { Api } from "../../api/endpoints";
import { usePaged } from "../../lib/hooks";
import { egp, formatDate, subscriptionTone } from "../../lib/format";
import { S } from "../../lib/strings";
import PagedList from "../../components/PagedList.jsx";
import { Badge, ScreenTitle, SurfaceCard } from "../../components/ui.jsx";

export default function Payments() {
  const list = usePaged((page) => Api.subscriptions({ page }), []);
  return (
    <div className="pb-6">
      <ScreenTitle title={S.paymentsHistory} />
      <PagedList
        list={list}
        skeletons={[3, 1]}
        empty={S.noPayments}
        className="p-4 space-y-2.5"
        renderItem={(s) => (
          <SurfaceCard key={s.id} className="p-4 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-bold flex-1">{s.plan.name}</p>
              <Badge tone={subscriptionTone(s.state)}>{S.subscriptionState[s.state] || s.state}</Badge>
            </div>
            <p className="text-lg font-black">{egp(s.amount_cents)}</p>
            <p className="text-sm text-muted">
              {S.paymentMethod[s.payment_method] || s.payment_method} · {S.reference}{" "}
              <span dir="ltr">{s.transaction_reference}</span>
            </p>
            <p className="text-sm text-muted">
              {[formatDate(s.created_at), s.ends_at && S.until(formatDate(s.ends_at))].filter(Boolean).join(" · ")}
            </p>
            {s.rejection_reason && <p className="text-sm text-bad">{s.rejection_reason}</p>}
          </SurfaceCard>
        )}
      />
    </div>
  );
}
