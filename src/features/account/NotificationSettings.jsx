import { useState } from "react";
import { Api } from "../../api/endpoints";
import { useLoad } from "../../lib/hooks";
import { S } from "../../lib/strings";
import { toast } from "../../components/Toast.jsx";
import { ErrorBanner, MessageBox, ScreenTitle, SkeletonRows, SurfaceCard, SwitchRow } from "../../components/ui.jsx";

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
