import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { usePaged } from "../../lib/hooks";
import { useSession } from "../../lib/session";
import { useFlag } from "../../lib/features";
import { notificationAction, notificationIcon, relativeTime } from "../../lib/format";
import { S } from "../../lib/strings";
import Icon from "../../components/Icon.jsx";
import PullToRefresh from "../../components/PullToRefresh.jsx";
import PagedList from "../../components/PagedList.jsx";
import { FilterChipsRow, ScreenTitle } from "../../components/ui.jsx";

// Signed in: the user's inbox. Guest: this install's broadcast inbox (X-Installation-Id). The
// server fills a guest inbox only for installs it knows, i.e. after web push registers the device.
export default function Notifications() {
  const { user } = useSession();
  return <Inbox key={user?.id ?? "guest"} />;
}

function Inbox() {
  const nav = useNavigate();
  const plansOn = useFlag("plans");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [readIds, setReadIds] = useState(() => new Set());
  const [allRead, setAllRead] = useState(false);
  const list = usePaged((page) => Api.notifications({ page }), []);

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
          return list.refresh();
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
        <PagedList
          list={list}
          items={visible}
          skeletons={[4, 1]}
          empty={S.noNotifications}
          renderItem={(n) => {
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
          }}
        />
      </PullToRefresh>
    </div>
  );
}
