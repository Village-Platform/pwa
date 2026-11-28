import { useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { S } from "../lib/strings";
import { assetUrl } from "../api/client";
import { kindTone } from "../lib/format";
import { asset } from "../lib/asset";
import { errorAction } from "../lib/errors";
import { useFlag } from "../lib/features";
import { useModal } from "../lib/useModal";

// Web counterparts of the Android ui/components widgets (same names where they exist there).

export function ScreenTitle({ title, back = true, action }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-20 bg-page/95 backdrop-blur pt-safe border-b border-line">
      <div className="flex items-center gap-2 h-14 px-2">
        {back && (
          <button
            onClick={() => (history.length > 1 ? nav(-1) : nav("/"))}
            className="p-2 rounded-full active:bg-surface2"
            aria-label={S.back}
          >
            <Icon name="back" />
          </button>
        )}
        <h1 className={`flex-1 text-lg font-bold truncate ${back ? "" : "px-2"}`}>{title}</h1>
        {action}
      </div>
    </header>
  );
}

export function GoldButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`h-12 rounded-xl bg-gold text-black font-bold px-5 active:opacity-80 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`h-12 rounded-xl border border-line text-ink font-semibold px-5 active:bg-surface2 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`h-12 rounded-xl bg-bad/10 text-bad font-bold px-5 active:bg-bad/20 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SurfaceCard({ children, className = "", ...props }) {
  return (
    <div {...props} className={`rounded-2xl bg-surface border border-line ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, onSeeAll }) {
  return (
    <div className="flex items-center justify-between px-4 mt-6 mb-2">
      <h2 className="text-base font-bold">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-sm font-semibold text-goldInk">
          {S.seeAll}
        </button>
      )}
    </div>
  );
}

// Tones as in Android's BadgeTone.
const TONES = {
  green: "text-goldInk bg-gold/15",
  gold: "text-[#9A6700] bg-[#D4A72C]/20 dark:text-[#E3B341]",
  red: "text-bad bg-bad/15",
  gray: "text-muted bg-surface2",
};
export function Badge({ children, tone = "green", icon }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold rounded-full px-2 py-0.5 ${TONES[tone]}`}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export function ErrorBanner({ error, onRetry }) {
  const action = errorAction(error);
  // Hide an action whose screen is behind a flag that is known to be off.
  const flagOn = useFlag(action?.needs ?? "");
  const actionAllowed = !action?.needs || flagOn !== false;
  if (!error) return null;
  return (
    <div className="mx-4 my-3 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm" role="alert">
      <p className="text-bad">{error.message || S.genericError}</p>
      {action && actionAllowed && (
        <Link to={action.to} className="mt-2 inline-block font-bold text-ink underline">
          {action.label}
        </Link>
      )}
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-bold text-ink underline">
          {S.retry}
        </button>
      )}
    </div>
  );
}

export function MessageBox({ text }) {
  return <p className="text-center text-muted py-12 px-6">{text}</p>;
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="px-4 space-y-3 py-2" aria-label={S.loading}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[72px] rounded-2xl bg-surface2 animate-pulse" />
      ))}
    </div>
  );
}

/** Category image from the API; no image or a failed load = the app logo. */
export function IconTile({ url, size = 48 }) {
  const src = assetUrl(url);
  return (
    <div
      className="rounded-xl bg-surface2 grid place-items-center overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      <img
        src={src || asset("brand/mark_green.png")}
        alt=""
        loading="lazy"
        className={src ? "w-full h-full object-cover" : "w-2/3 h-2/3 object-contain dark:hidden"}
        onError={(e) => (e.currentTarget.src = asset("brand/mark_green.png"))}
      />
      {!src && (
        <img src={asset("brand/mark_cream.png")} alt="" className="w-2/3 h-2/3 object-contain hidden dark:block" />
      )}
    </div>
  );
}

export function FirmRow({ firm, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-start">
      <SurfaceCard className="flex items-center gap-3 p-3 active:bg-surface2">
        <IconTile url={firm.category?.icon_url} />
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{firm.name}</p>
          <p className="text-sm text-muted truncate">
            {firm.category?.name}
            {firm.address ? ` · ${firm.address}` : ""}
          </p>
        </div>
        <Icon name="chevron" className="text-muted" />
      </SurfaceCard>
    </button>
  );
}

export function NewsRow({ article, onClick, relative }) {
  return (
    <button onClick={onClick} className="w-full text-start">
      <SurfaceCard className="p-4 active:bg-surface2">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone={kindTone(article.kind)}>{S.kind[article.kind] || article.kind}</Badge>
          <span className="text-xs text-muted">{relative}</span>
        </div>
        <p className="font-bold leading-snug">{article.title}</p>
        <p className="text-sm text-muted mt-1 line-clamp-2">{article.body}</p>
      </SurfaceCard>
    </button>
  );
}

export function FilterChipsRow({ items, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
      {items.map((it) => {
        const on = it.value === selected;
        return (
          <button
            type="button"
            key={String(it.value)}
            aria-pressed={on}
            onClick={() => onSelect(it.value)}
            className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold border ${
              on ? "bg-ink text-page border-ink" : "bg-surface text-ink border-line"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function SearchPill({ value, onChange, placeholder, autoFocus, onClick, readOnly }) {
  return (
    <label className="flex items-center gap-2 h-12 rounded-full bg-surface2 px-4 text-muted" onClick={onClick}>
      <Icon name="search" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        readOnly={readOnly}
        enterKeyHint="search"
        className="flex-1 bg-transparent outline-none text-ink placeholder:text-muted text-base"
      />
    </label>
  );
}

export function FieldLabel({ children }) {
  return <span className="block text-sm font-semibold mb-1">{children}</span>;
}

export function FormField({ label, error, ...props }) {
  const errorId = useId();
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full h-12 rounded-xl bg-surface2 px-4 text-base outline-none border ${
          error ? "border-bad" : "border-transparent focus:border-gold"
        }`}
      />
      {error && (
        <span id={errorId} className="block text-sm text-bad mt-1">
          {error}
        </span>
      )}
    </label>
  );
}

export function TextArea({ label, error, rows = 5, ...props }) {
  const errorId = useId();
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={rows}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-xl bg-surface2 px-4 py-3 text-base outline-none border resize-y ${
          error ? "border-bad" : "border-transparent focus:border-gold"
        }`}
      />
      {error && (
        <span id={errorId} className="block text-sm text-bad mt-1">
          {error}
        </span>
      )}
    </label>
  );
}

/** Segmented control (Android Segmented). */
export function Segmented({ options, selected, onSelect }) {
  return (
    <div role="group" className="inline-flex rounded-xl bg-surface2 p-1 gap-1">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          aria-pressed={selected === o.value}
          onClick={() => onSelect(o.value)}
          className={`h-9 px-4 rounded-lg text-sm font-semibold ${selected === o.value ? "bg-gold text-black" : "text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SwitchRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="font-semibold">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors ${checked ? "bg-gold" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${checked ? "start-[22px]" : "start-0.5"}`}
        />
      </button>
    </div>
  );
}

export function CheckLine({ children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-gold/15 text-goldInk grid place-items-center shrink-0">
        <Icon name="check" size={16} />
      </span>
      <span>{children}</span>
    </div>
  );
}

export function LetterAvatar({ name, size = 56 }) {
  return (
    <div
      className="rounded-full bg-gold/20 text-goldInk grid place-items-center font-extrabold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name || "?").trim()[0]}
    </div>
  );
}

/** Confirm dialog. `danger` paints the confirm button red (delete, logout). */
/** The backdrop and panel shared by Dialog and AlertBox: role=dialog, focus kept inside, Escape closes. */
function Modal({ title, lead, onClose, className = "", children }) {
  const ref = useModal(onClose);
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-6" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`w-full max-w-sm rounded-2xl bg-surface p-5 outline-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {lead}
        {title && (
          <h3 id={titleId} className="text-lg font-bold">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}

export function Dialog({ title, body, confirm, onConfirm, onCancel, danger, busy }) {
  return (
    <Modal title={title} onClose={onCancel}>
      {body && <p className="text-muted mt-2 leading-relaxed">{body}</p>}
      <div className="flex gap-2 mt-5">
        {danger ? (
          <DangerButton className="flex-1" onClick={onConfirm} disabled={busy}>
            {confirm}
          </DangerButton>
        ) : (
          <GoldButton className="flex-1" onClick={onConfirm} disabled={busy}>
            {confirm}
          </GoldButton>
        )}
        {onCancel && (
          <GhostButton className="flex-1" onClick={onCancel}>
            {S.cancel}
          </GhostButton>
        )}
      </div>
    </Modal>
  );
}

export function AlertBox({ title, body, onClose, children }) {
  return (
    <Modal title={title} lead={children} onClose={onClose} className="text-center">
      {body && <p className="text-muted mt-2 leading-relaxed whitespace-pre-line">{body}</p>}
      <GoldButton className="w-full mt-5" onClick={onClose}>
        {S.ok}
      </GoldButton>
    </Modal>
  );
}

/** Form page shell: title bar, fields, save button (Android AdminFormScaffold). */
export function FormPage({
  title,
  loading,
  loadError,
  onRetry,
  error,
  submitting,
  onSave,
  saveLabel = S.save,
  children,
  extra,
}) {
  return (
    <div className="pb-28">
      <ScreenTitle title={title} />
      {loading ? (
        <SkeletonRows count={4} />
      ) : loadError ? (
        <ErrorBanner error={loadError} onRetry={onRetry} />
      ) : (
        <form
          className="px-4 pt-4 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          {children}
          <ErrorBanner error={error} />
          <GoldButton type="submit" disabled={submitting} className="w-full">
            {submitting ? S.loading : saveLabel}
          </GoldButton>
          {extra}
        </form>
      )}
    </div>
  );
}

export function BrandMark({ className = "h-10" }) {
  return (
    <>
      <img src={asset("brand/mark_green.png")} alt="" className={`${className} dark:hidden`} />
      <img src={asset("brand/mark_cream.png")} alt="" className={`${className} hidden dark:block`} />
    </>
  );
}
