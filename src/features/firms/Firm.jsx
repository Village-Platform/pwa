import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { useLoad, useShare } from "../../lib/hooks";
import { useSession } from "../../lib/session";
import { firmStatusTone, mapUrl, whatsappUrl } from "../../lib/format";
import { S } from "../../lib/strings";
import Icon from "../../components/Icon.jsx";
import { toast } from "../../components/Toast.jsx";
import {
  Badge,
  DangerButton,
  Dialog,
  ErrorBanner,
  GhostButton,
  ScreenTitle,
  SkeletonRows,
} from "../../components/ui.jsx";
import { asset } from "../../lib/asset";

/**
 * Which controls to show. The server sends them in `can` (its FirmPolicy); without it, the same
 * fallback as Android's FirmAccess: owner or super admin edit / delete, only the super admin moderates.
 * A UI hint only: the server still decides every request.
 */
function access(firm, user) {
  const isAdmin = user?.role === "super_admin";
  const owns = isAdmin || (user && firm.owner_id === user.id);
  return {
    edit: firm.can?.update ?? !!owns,
    destroy: firm.can?.destroy ?? !!owns,
    moderate: firm.can?.moderate ?? isAdmin,
  };
}

export default function Firm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useSession();
  const { data: loaded, error, loading, reload } = useLoad(() => Api.firm(id).then((r) => r.data), [id, user?.id]);
  const shareFirm = useShare();
  const [override, setOverride] = useState(null); // firm after approve / suspend
  const firm = override?.id === loaded?.id ? override : loaded;

  if (!firm) {
    return (
      <div>
        <ScreenTitle title="" />
        {loading ? <SkeletonRows count={3} /> : <ErrorBanner error={error} onRetry={reload} />}
      </div>
    );
  }

  const share = () =>
    shareFirm({ title: firm.name, text: [firm.name, firm.address, firm.phone].filter(Boolean).join("\n") });
  const phone = firm.phone?.trim() || null;
  const wa = firm.whatsapp?.trim() || phone;
  const hasCoords = firm.latitude != null && firm.longitude != null;
  const can = access(firm, user);

  return (
    <div className="pb-10">
      {/* Photo header with the back / share buttons on top (Android SheetLayout). */}
      <div className="relative h-[190px]">
        <img src={asset("brand/brand_scene.jpg")} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex justify-between p-3 pt-safe">
          <Overlay onClick={() => (history.length > 1 ? nav(-1) : nav("/"))} label={S.back} icon="back" />
          <Overlay onClick={share} label={S.share} icon="share" />
        </div>
      </div>

      <div className="-mt-6 relative rounded-t-3xl bg-page p-5 space-y-4">
        {firm.status !== "active" && (
          <Badge tone={firmStatusTone(firm.status)}>{S.firmStatus[firm.status] || firm.status}</Badge>
        )}
        <h1 className="text-2xl font-black">{firm.name}</h1>

        <div className="grid grid-cols-3 gap-2.5">
          <Tile icon="phone" label={S.call} href={phone && `tel:${phone}`} color="#1A7F37" dark="#3FB950" />
          <Tile icon="chat" label={S.whatsapp} href={wa && whatsappUrl(wa)} color="#25D366" dark="#25D366" />
          <Tile
            icon="place"
            label={S.location}
            href={hasCoords && mapUrl(firm.latitude, firm.longitude)}
            color="#D1242F"
            dark="#FF7B72"
          />
        </div>

        <hr className="border-line" />
        <div className="space-y-2.5">
          <Info icon="place" value={firm.address} />
          <Info icon="clock" value={firm.working_hours} />
          <Info icon="phoneAndroid" value={firm.phone} ltr />
        </div>

        {firm.description?.trim() && (
          <>
            <hr className="border-line" />
            <p className="leading-relaxed whitespace-pre-line">{firm.description}</p>
          </>
        )}

        {(can.edit || can.destroy) && (
          <>
            <hr className="border-line" />
            <ManageControls
              firm={firm}
              can={can}
              onEdit={() => nav(`/firms/${firm.id}/edit`)}
              onChanged={(f) => setOverride(f)}
              onDeleted={() => {
                toast(S.firmDeleted);
                nav(-1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ManageControls({ firm, can, onEdit, onChanged, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="font-bold">{S.manageFirm}</h2>
      <div className="flex gap-2">
        {can.edit && (
          <GhostButton className="flex-1" onClick={onEdit}>
            {S.edit}
          </GhostButton>
        )}
        {/* Owners cannot approve their own firm. */}
        {can.moderate && (
          <GhostButton
            className="flex-1"
            disabled={busy}
            onClick={() =>
              run(async () =>
                onChanged((await Api.setFirmStatus(firm.id, firm.status === "active" ? "suspended" : "active")).data),
              )
            }
          >
            {firm.status === "active" ? S.suspend : S.approve}
          </GhostButton>
        )}
        {can.destroy && (
          <DangerButton className="flex-1" disabled={busy} onClick={() => setConfirm(true)}>
            {S.delete}
          </DangerButton>
        )}
      </div>
      <ErrorBanner error={error} />
      {confirm && (
        <Dialog
          danger
          title={S.deleteFirmTitle}
          body={S.deleteFirmBody(firm.name)}
          confirm={S.delete}
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            run(async () => {
              await Api.deleteFirm(firm.id);
              onDeleted();
            });
          }}
        />
      )}
    </div>
  );
}

function Overlay({ onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-10 h-10 rounded-full bg-black/35 text-white grid place-items-center backdrop-blur"
    >
      <Icon name={icon} />
    </button>
  );
}

/** Call / WhatsApp / map tile in its own colour; grey and inert when the firm has no such data. */
function Tile({ icon, label, href, color, dark }) {
  const isDark = document.documentElement.classList.contains("dark");
  const c = isDark ? dark : color;
  if (!href) {
    return (
      <span className="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface py-3 text-sm font-bold text-muted">
        <Icon name={icon} className="text-line" /> {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex flex-col items-center gap-1 rounded-xl border py-3 text-sm font-bold active:opacity-70"
      style={{ background: `${c}${isDark ? "29" : "1A"}`, borderColor: `${c}59` }}
    >
      <span style={{ color: c }}>
        <Icon name={icon} />
      </span>
      {label}
    </a>
  );
}

function Info({ icon, value, ltr }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon name={icon} size={20} className="text-goldInk" />
      <span dir={ltr && value ? "ltr" : undefined}>{value?.trim() || "—"}</span>
    </div>
  );
}
