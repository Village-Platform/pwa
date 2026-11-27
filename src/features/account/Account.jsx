import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { isReviewer } from "../../components/RequireReviewer.jsx";
import { useLoad } from "../../lib/hooks";
import { session, useSession } from "../../lib/session";
import { useFlag } from "../../lib/features";
import { S } from "../../lib/strings";
import Icon from "../../components/Icon.jsx";
import InstallBanner from "../../components/InstallBanner.jsx";
import {
  AlertBox,
  Badge,
  BrandMark,
  CheckLine,
  DangerButton,
  Dialog,
  GhostButton,
  GoldButton,
  LetterAvatar,
  SurfaceCard,
} from "../../components/ui.jsx";

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.aghourservices";
const VERSION = import.meta.env.VITE_APP_VERSION || "web";

export default function Account() {
  const { user } = useSession();
  const [about, setAbout] = useState(false);
  return (
    <div className="pb-8 pt-safe">
      {user ? <Profile user={user} onAbout={() => setAbout(true)} /> : <GuestProfile onAbout={() => setAbout(true)} />}
      {about && (
        <AlertBox body={`${S.aboutAppBody}\n${VERSION}`} onClose={() => setAbout(false)}>
          <div className="flex justify-center mb-3">
            <BrandMark className="h-24" />
          </div>
        </AlertBox>
      )}
    </div>
  );
}

function GuestProfile({ onAbout }) {
  const nav = useNavigate();
  return (
    <div className="px-5 pt-5 space-y-4">
      <div className="flex justify-center">
        <BrandMark className="h-28" />
      </div>
      <h1 className="text-2xl font-black">{S.guestProfileTitle}</h1>
      <p className="text-muted">{S.guestProfileBodyFull}</p>
      <div className="space-y-2">
        <CheckLine>{S.benefitFirms}</CheckLine>
        <CheckLine>{S.benefitNotifications}</CheckLine>
        <CheckLine>{S.benefitFree}</CheckLine>
      </div>
      <GoldButton className="w-full" onClick={() => nav("/login", { state: { from: "/account" } })}>
        {S.login}
      </GoldButton>
      <GhostButton className="w-full" onClick={() => nav("/register", { state: { from: "/account" } })}>
        {S.register}
      </GhostButton>
      <InstallBanner />
      <SurfaceCard className="overflow-hidden divide-y divide-line">
        <Row icon="bell" label={S.notifications} onClick={() => nav("/notifications")} />
        <Row icon="palette" label={S.appearanceMenu} onClick={() => nav("/settings")} />
        <Row icon="android" label={S.androidApp} href={PLAY_URL} />
        <Row icon="info" label={S.aboutApp} onClick={onAbout} />
      </SurfaceCard>
    </div>
  );
}

function Profile({ user, onAbout }) {
  const nav = useNavigate();
  const plansOn = useFlag("plans");
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Each time the profile is shown: role / subscription / firms may have changed on the server.
  // Failures leave the counts at zero rather than blocking the screen.
  const { data: loaded } = useLoad(async () => {
    Api.me()
      .then((r) => session.setUser(r.data))
      .catch(() => {});
    const [firms, subs] = await Promise.all([
      Api.myFirms({ perPage: 50 })
        .then((r) => r.data)
        .catch(() => []),
      plansOn
        ? Api.subscriptions({ perPage: 50 })
            .then((r) => r.data)
            .catch(() => [])
        : [],
    ]);
    return {
      firms,
      current: subs.find((s) => s.state === "current") || null,
      pending: subs.find((s) => s.state === "pending") || null,
    };
  }, [user.id, plansOn]);
  const data = loaded ?? { firms: [], current: null, pending: null };

  return (
    <>
      <div className="flex items-center gap-3 px-5 pt-3 pb-3.5 border-b border-line">
        <LetterAvatar name={user.name} />
        <div className="min-w-0 space-y-0.5">
          <p className="font-bold text-lg truncate">{user.name}</p>
          <p className="text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>
            {user.email || user.phone}
          </p>
          {user.role === "super_admin" && <Badge tone="gold">{S.roleSuperAdmin}</Badge>}
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {plansOn && <SubscriptionCard data={data} onPlans={() => nav("/plans")} />}
        <InstallBanner />
        <SurfaceCard className="overflow-hidden divide-y divide-line">
          <Row
            icon="storefront"
            label={S.myFirms}
            trailing={String(data.firms.length)}
            onClick={() => nav("/my-firms")}
          />
          {isReviewer(user) && <Row icon="verified" label={S.reviewQueue} onClick={() => nav("/review")} />}
          <Row icon="addBusiness" label={S.addFirm} onClick={() => nav("/firms/new")} />
          <Row icon="news" label={S.myArticles} onClick={() => nav("/my-articles")} />
          <Row icon="postAdd" label={S.addArticle} onClick={() => nav("/articles/new")} />
          {plansOn && <Row icon="card" label={S.subscriptionAndPlans} onClick={() => nav("/plans")} />}
          {plansOn && <Row icon="payments" label={S.paymentsHistory} onClick={() => nav("/payments")} />}
          <Row icon="bell" label={S.notifications} onClick={() => nav("/notifications")} />
          <Row icon="palette" label={S.appearanceMenu} onClick={() => nav("/settings")} />
          <Row icon="person" label={S.editProfile} onClick={() => nav("/edit-profile")} />
          <Row icon="lock" label={S.changePassword} onClick={() => nav("/change-password")} />
          <Row icon="android" label={S.androidApp} href={PLAY_URL} />
          <Row icon="info" label={S.aboutApp} onClick={onAbout} />
          <Row icon="deleteForever" label={S.deleteAccount} onClick={() => nav("/delete-account")} />
        </SurfaceCard>
        <DangerButton className="w-full" onClick={() => setConfirmLogout(true)}>
          {S.logout}
        </DangerButton>
      </div>

      {confirmLogout && (
        <Dialog
          danger
          title={S.logoutConfirmTitle}
          body={S.logoutConfirmBody}
          confirm={S.logout}
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => {
            // Android also detaches its push device here; the web app has none until web push lands.
            session.clear();
            setConfirmLogout(false);
          }}
        />
      )}
    </>
  );
}

/** Current plan with days left, a pending request, or a call to subscribe (Android SubscriptionCard). */
function SubscriptionCard({ data, onPlans }) {
  const { current, pending, firms } = data;
  const total = Math.max(current?.plan.duration_days || 1, 1);
  const left = Math.min(Math.max(current?.days_left ?? 0, 0), total);
  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center gap-2">
        <p className="font-bold flex-1 truncate">{firms[0]?.name || S.subscriptionAndPlans}</p>
        {current ? (
          <Badge icon="verified">{S.verified}</Badge>
        ) : pending ? (
          <Badge tone="gold">{S.underReview}</Badge>
        ) : null}
      </div>
      <div className="mt-2.5">
        {current ? (
          <div className="rounded-[10px] bg-gold/10 p-3">
            <div className="flex text-sm font-bold">
              <span className="flex-1">{S.planNamed(current.plan.name)}</span>
              <span className="font-normal">{S.daysLeft(left)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-line overflow-hidden">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(left / total) * 100}%` }} />
            </div>
          </div>
        ) : pending ? (
          <p className="text-muted text-sm">{S.paymentSentBody}</p>
        ) : (
          <>
            <p className="text-muted text-sm">{S.noSubscription}</p>
            <GoldButton className="w-full mt-2.5" onClick={onPlans}>
              {S.subscribeNow}
            </GoldButton>
          </>
        )}
      </div>
    </SurfaceCard>
  );
}

function Row({ icon, label, onClick, href, trailing }) {
  const inner = (
    <>
      <Icon name={icon} className="text-goldInk" />
      <span className="flex-1 font-semibold">{label}</span>
      {trailing && <span className="text-muted">{trailing}</span>}
      <Icon name="chevron" className="text-muted" />
    </>
  );
  const cls = "w-full flex items-center gap-3 px-3.5 py-3.5 text-start active:bg-surface2";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
