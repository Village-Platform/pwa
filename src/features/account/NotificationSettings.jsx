import { useState } from "react";
import { Api } from "../../api/endpoints";
import { useLoad } from "../../lib/hooks";
import { useFlag } from "../../lib/features";
import { disablePush, enablePush, pushState } from "../../lib/push";
import { S } from "../../lib/strings";
import { toast } from "../../components/Toast.jsx";
import {
  ErrorBanner,
  GhostButton,
  GoldButton,
  MessageBox,
  ScreenTitle,
  SkeletonRows,
  SurfaceCard,
  SwitchRow,
} from "../../components/ui.jsx";

/** Opt in or out of push topics (news, announcements...). The choice is saved as soon as it is made. */
export default function NotificationSettings() {
  const { data, error, loading, reload } = useLoad(() => Api.topics().then((r) => r.data));
  // Optimistic: key -> subscribed, until the server answers (reverted on failure).
  const [pending, setPending] = useState({});

  const toggle = async (topic, on) => {
    setPending((p) => ({ ...p, [topic.key]: on }));
    try {
      await (on ? Api.optInTopic(topic.key) : Api.optOutTopic(topic.key));
    } catch (e) {
      toast(e.message || S.topicSaveFailed);
    } finally {
      // Whatever happened, the server's answer is the truth: reload, then drop the optimistic value.
      await reload();
      setPending(({ [topic.key]: _gone, ...rest }) => rest);
    }
  };

  return (
    <div className="pb-8">
      <ScreenTitle title={S.notificationSettings} />
      <PushOnThisDevice />
      <h2 className="px-4 mt-5 font-bold">{S.topicsTitle}</h2>
      <p className="px-4 mt-1 mb-3 text-sm text-muted">{S.topicsHint}</p>
      {loading && !data && <SkeletonRows count={3} />}
      <ErrorBanner error={!data && error} onRetry={reload} />
      {data?.length === 0 && <MessageBox text={S.noTopics} />}
      {data?.length > 0 && (
        <SurfaceCard className="mx-4 divide-y divide-line">
          {data.map((t) => (
            <div key={t.key} className="p-3">
              <SwitchRow
                label={t.name || t.title || t.key}
                checked={t.key in pending ? pending[t.key] : !!t.subscribed}
                onChange={(on) => toggle(t, on)}
              />
              {t.description && <p className="text-sm text-muted mt-1">{t.description}</p>}
            </div>
          ))}
        </SurfaceCard>
      )}
    </div>
  );
}

/**
 * Turns web push on or off for this browser. Shown only when the server's `web_push` flag is on: until the
 * backend accepts web devices, registering would fail.
 */
function PushOnThisDevice() {
  const enabled = useFlag("web_push");
  const [state, setState] = useState(() => pushState());
  const [busy, setBusy] = useState(false);
  if (!enabled) return null;

  const turnOn = async () => {
    setBusy(true);
    try {
      setState(await enablePush());
    } catch {
      toast(S.pushFailed);
    } finally {
      setBusy(false);
    }
  };
  const turnOff = async () => {
    setBusy(true);
    await disablePush();
    setState(pushState());
    setBusy(false);
  };

  return (
    <SurfaceCard className="mx-4 mt-5 p-4 space-y-3">
      <h2 className="font-bold">{S.pushTitle}</h2>
      {state === "on" ? (
        <>
          <p className="text-sm text-goldInk font-semibold">{S.pushOn}</p>
          <GhostButton className="w-full" disabled={busy} onClick={turnOff}>
            {S.pushDisable}
          </GhostButton>
        </>
      ) : state === "denied" ? (
        <p className="text-sm text-bad">{S.pushDenied}</p>
      ) : state === "unsupported" ? (
        <p className="text-sm text-muted">{S.pushUnsupported}</p>
      ) : (
        <>
          <p className="text-sm text-muted">{S.pushHint}</p>
          <GoldButton className="w-full" disabled={busy} onClick={turnOn}>
            {busy ? S.loading : S.pushEnable}
          </GoldButton>
        </>
      )}
    </SurfaceCard>
  );
}
