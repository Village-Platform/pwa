import { useNavigate } from "react-router-dom";
import { Api } from "../api/endpoints.js";
import { useLoad } from "../lib/hooks.js";
import { useSession } from "../lib/session.js";
import { egp } from "../lib/format.js";
import { S } from "../lib/strings.js";
import { Badge, CheckLine, ErrorBanner, GhostButton, GoldButton, MessageBox, ScreenTitle, SkeletonRows } from "../components/ui.jsx";

/** "اختر باقتك": the middle plan is highlighted as the most popular. Guests sign in first. */
export default function Plans() {
  const nav = useNavigate();
  const { user } = useSession();
  const { data: plans, error, loading, reload } = useLoad(() => Api.plans().then((r) => r.data));
  const highlighted = plans ? (plans.length >= 3 ? 1 : plans.length - 1) : -1;

  const subscribe = (plan) => (user ? nav(`/pay/${plan.id}`) : nav("/login", { state: { from: "/plans" } }));

  return (
    <div className="pb-8">
      <ScreenTitle title={S.plansTitle} />
      <p className="px-4 pt-3 text-muted">{S.plansSubtitle}</p>
      {loading && !plans && <SkeletonRows count={3} />}
      <ErrorBanner error={error} onRetry={reload} />
      {plans?.length === 0 && <MessageBox text={S.noSubscription} />}
      <div className="px-4 pt-3 space-y-3">
        {(plans || []).map((p, i) => {
          const hi = i === highlighted;
          return (
            <div key={p.id} className={`rounded-2xl border-2 p-4 space-y-3 ${hi ? "border-gold bg-gold/10" : "border-line bg-surface"}`}>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-bold flex-1 ${hi ? "text-goldInk" : ""}`}>{p.name}</h2>
                {hi && <Badge tone="gold">{S.mostPopular}</Badge>}
              </div>
              <p>
                <span className="text-2xl font-black">{egp(p.price_cents)}</span>
                <span className="text-muted"> / {S.planDuration(p.duration_days)}</span>
              </p>
              {p.description && <p className="text-muted text-sm whitespace-pre-line">{p.description}</p>}
              <div className="space-y-1.5 text-sm">
                <CheckLine>{S.planVisibility}</CheckLine>
                <CheckLine>{S.planDuration(p.duration_days)}</CheckLine>
                <CheckLine>{S.planMaxFirms(p.max_firms)}</CheckLine>
              </div>
              {hi ? (
                <GoldButton className="w-full" onClick={() => subscribe(p)}>{S.subscribe}</GoldButton>
              ) : (
                <GhostButton className="w-full" onClick={() => subscribe(p)}>{S.subscribe}</GhostButton>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
