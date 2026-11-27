import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { useLoad } from "../../lib/hooks";
import { track } from "../../lib/analytics";
import { egp, normalizeDigits } from "../../lib/format";
import { S } from "../../lib/strings";
import Icon from "../../components/Icon.jsx";
import { toast } from "../../components/Toast.jsx";
import {
  AlertBox,
  ErrorBanner,
  FormField,
  GoldButton,
  MessageBox,
  ScreenTitle,
  SkeletonRows,
} from "../../components/ui.jsx";

/** "إتمام الدفع": plan summary, InstaPay / Vodafone Cash account, transfer reference → request for review. */
export default function Pay() {
  const { planId } = useParams();
  const nav = useNavigate();
  const { data, error, loading, reload } = useLoad(
    () =>
      Promise.all([Api.plans(), Api.paymentMethods()]).then(([plans, methods]) => ({
        plan: plans.data.find((p) => p.id === Number(planId)) || null,
        methods: methods.data,
      })),
    [planId],
  );
  const [method, setMethod] = useState(null);
  const [reference, setReference] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [refError, setRefError] = useState(null);
  const [submit, setSubmit] = useState({ busy: false, error: null });
  const [done, setDone] = useState(false);

  const selected = method ?? data?.methods[0]?.key ?? null;
  const plan = data?.plan;

  const send = async () => {
    if (!selected || submit.busy) return;
    if (!reference.trim()) return setRefError(S.errorReferenceRequired);
    setSubmit({ busy: true, error: null });
    try {
      // One tap = one request: the button is disabled while it runs. A retry after a network error
      // can still create a second pending request; the admin review catches it (no idempotency key yet).
      await Api.subscribe({ planId: Number(planId), method: selected, reference, payerPhone });
      setSubmit({ busy: false, error: null });
      track("subscription_request", { plan_id: Number(planId), method: selected });
      setDone(true);
    } catch (e) {
      setSubmit({ busy: false, error: e });
    }
  };

  return (
    <div className="pb-10">
      <ScreenTitle title={S.payTitle} />
      {loading && !data ? (
        <SkeletonRows count={3} />
      ) : !plan ? (
        <>
          <ErrorBanner error={error} onRetry={reload} />
          {!error && <MessageBox text={S.noSubscription} />}
        </>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center rounded-2xl bg-gold/15 border border-gold/40 p-4">
            <div className="flex-1">
              <p className="text-xs text-goldInk">{S.planLabel}</p>
              <p className="font-bold">{`${plan.name} · ${plan.duration_days} ${S.daysUnit}`}</p>
            </div>
            <p className="text-2xl font-black">{egp(plan.price_cents)}</p>
          </div>

          <div role="radiogroup" aria-label={S.paymentMethodLabel} className="space-y-3">
            {data.methods.map((pm) => {
              const on = pm.key === selected;
              return (
                <div
                  key={pm.key}
                  className={`rounded-2xl bg-surface p-3 ${on ? "border-2 border-gold" : "border border-line"}`}
                >
                  {/* A real button, so the card works with the keyboard and screen readers. */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMethod(pm.key)}
                    className="w-full flex items-center gap-2 text-start"
                  >
                    <Icon name={pm.key === "instapay" ? "bank" : "phoneAndroid"} size={20} className="text-goldInk" />
                    <span className="flex-1 font-bold">{pm.name}</span>
                    <span
                      className={`w-5 h-5 rounded-full border-2 grid place-items-center ${on ? "border-goldInk" : "border-muted"}`}
                    >
                      {on && <span className="w-2.5 h-2.5 rounded-full bg-goldInk" />}
                    </span>
                  </button>
                  {on && pm.account && (
                    <div className="mt-2 rounded-[10px] bg-surface2 p-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex-1 font-bold">
                          {S.transferTo} <span dir="ltr">{pm.account}</span>
                        </span>
                        <button
                          type="button"
                          className="font-bold text-goldInk px-2"
                          onClick={() => navigator.clipboard?.writeText(pm.account).then(() => toast(S.copied))}
                        >
                          {S.copy}
                        </button>
                      </div>
                      <p>{S.amount(egp(plan.price_cents))}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <FormField
            label={S.transferReference}
            placeholder={S.transferReferenceHint}
            dir="ltr"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              setRefError(null);
            }}
            error={refError}
          />
          <FormField
            label={S.payerPhone}
            placeholder={S.phonePlaceholder}
            type="tel"
            inputMode="numeric"
            dir="ltr"
            value={payerPhone}
            onChange={(e) => setPayerPhone(normalizeDigits(e.target.value).replace(/\D/g, "").slice(0, 11))}
          />
          <ErrorBanner error={submit.error} />
          <GoldButton className="w-full" onClick={send} disabled={!selected || submit.busy}>
            {submit.busy ? S.loading : S.sendForReview}
          </GoldButton>
          <p className="text-center text-xs text-muted">{S.payActivationNote}</p>
        </div>
      )}
      {done && (
        <AlertBox
          title={S.paymentSentTitle}
          body={S.paymentSentBody}
          onClose={() => nav("/payments", { replace: true })}
        />
      )}
    </div>
  );
}
