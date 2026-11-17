import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api/endpoints.js";
import { useOnVisible, usePaged } from "../lib/hooks.js";
import { useSession } from "../lib/session.js";
import { useFeatures } from "../lib/features.js";
import { notificationAction, notificationIcon, relativeTime } from "../lib/format.js";
import { S } from "../lib/strings.js";
import Icon from "../components/Icon.jsx";
import PullToRefresh from "../components/PullToRefresh.jsx";
import { ErrorBanner, FilterChipsRow, MessageBox, ScreenTitle, SkeletonRows } from "../components/ui.jsx";

// Signed in: the user's inbox. Guest: this install's broadcast inbox (X-Installation-Id). The
// server fills a guest inbox only for installs it knows, i.e. after web push registers the device.
export default function Notifications() {
  const { user } = useSession();
  return <Inbox key={user?.id ?? "guest"} />;
}

function Inbox() {
  const nav = useNavigate();
  const { plans: plansOn } = useFeatures();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [readIds, setReadIds] = useState(() => new Set());
  const [allRead, setAllRead] = useState(false);
  const list = usePaged((page) => Api.notifications({ page }), []);
  const sentinel = useOnVisible(() => list.loadMore());

  const isRead = (n) => n.read || allRead || readIds.has(n.id);
  const unreadCount = list.items.filter((n) => !isRead(n)).length;
  const visible = unreadOnly ? list.items.filter((n) => !isRead(n)) : list.items;

  // Optimistic: shown as read right away, then the server is told (same as Android).
  const open = (n) => {
    if (!isRead(n)) {
      setReadIds((s) => new Set(s).add(n.id));
      Api.readNotification(n.id).catch(() => {});
    }
    const to = notificationAction(n, { plansOn });
    if (to) nav(to);
  };

  return (
    <div className="pb-6">
      <ScreenTitle
        title={S.notifications}
        action={
          unreadCount > 0 && (
            <button
              className="text-sm font-bold text-goldInk px-2"
              onClick={() => {
                setAllRead(true);
                Api.readAllNotifications().catch(() => {});
              }}
            >
              {S.markAllRead}
            </button>
          )
        }
      />
      <PullToRefresh
        onRefresh={() => {
          setReadIds(new Set());
          setAllRead(false);
          list.refresh();
          return new Promise((r) => setTimeout(r, 700));
        }}
      >
        {list.items.length > 0 && (
          <FilterChipsRow
            items={[
              { value: false, label: S.all },
              { value: true, label: S.unreadCount(unreadCount) },
            ]}
            selected={unreadOnly}
            onSelect={setUnreadOnly}
          />
        )}
        <div className="px-4 space-y-2">
          {visible.map((n) => {
            const read = isRead(n);
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`w-full text-start rounded-[14px] border p-3 flex gap-3 ${
                  read ? "bg-surface border-line" : "bg-gold/10 border-gold/40"
                }`}
              >
                <span className="w-[38px] h-[38px] rounded-full bg-surface2 grid place-items-center shrink-0">
                  <Icon name={notificationIcon(n.kind)} size={20} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold flex-1">{n.title}</p>
                    {!read && <span className="w-2 h-2 rounded-full bg-gold" />}
                  </div>
                  <p className="text-sm text-muted mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted mt-1 text-end">{relativeTime(n.created_at)}</p>
                </div>
              </button>
            );
          })}
        </div>
        {list.loading && <SkeletonRows count={list.items.length ? 1 : 4} />}
        <ErrorBanner error={list.error} onRetry={list.retry} />
        {!list.loading && !list.error && visible.length === 0 && <MessageBox text={S.noNotifications} />}
        <div ref={sentinel} className="h-1" />
      </PullToRefresh>
    </div>
  );
}
