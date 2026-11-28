import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { GoldButton } from "./ui.jsx";
import { S } from "../lib/strings";

// iOS has no install prompt: the user must use Safari's Share → "Add to Home Screen", and only an
// installed web app can receive push on iOS (16.4+). Android Chrome fires beforeinstallprompt.
const ua = navigator.userAgent;
export const isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
const isIosSafari = isIos && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
export const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

const DISMISS_KEY = "aghour.installDismissedAt";
const recentlyDismissed = () => Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < 7 * 864e5;

let deferredPrompt = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  dispatchEvent(new Event("aghour:installable"));
});

export default function InstallBanner({ force = false }) {
  const [canPrompt, setCanPrompt] = useState(!!deferredPrompt);
  const [hidden, setHidden] = useState(() => !force && recentlyDismissed());

  useEffect(() => {
    const on = () => setCanPrompt(true);
    addEventListener("aghour:installable", on);
    return () => removeEventListener("aghour:installable", on);
  }, []);

  if (isStandalone() || hidden) return null;
  if (!isIos && !canPrompt) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  };

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-gold/50 bg-gold/10 p-4 relative">
      {!force && (
        <button onClick={dismiss} className="absolute top-2 inset-e-2 p-1 text-muted" aria-label={S.installLater}>
          <Icon name="close" size={20} />
        </button>
      )}
      <div className="flex items-center gap-2 font-bold">
        <Icon name="download" className="text-goldInk" />
        {S.installTitle}
      </div>

      {isIos ? (
        isIosSafari ? (
          <>
            <p className="text-sm text-muted mt-1">{S.installBodyIos}</p>
            <ol className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Step n={1} /> {S.installStep1} <Icon name="iosShare" size={20} className="text-[#0A84FF]" />
                <span className="text-muted">{S.installStep1b}</span>
              </li>
              <li className="flex items-center gap-2">
                <Step n={2} /> {S.installStep2} <Icon name="addBox" size={20} />
              </li>
              <li className="flex items-center gap-2">
                <Step n={3} /> {S.installStep3}
              </li>
            </ol>
          </>
        ) : (
          <p className="text-sm mt-2">{S.installIosNotSafari}</p>
        )
      ) : (
        <GoldButton
          className="mt-3 w-full"
          onClick={async () => {
            deferredPrompt?.prompt();
            await deferredPrompt?.userChoice;
            deferredPrompt = null;
            setCanPrompt(false);
          }}
        >
          {S.installButton}
        </GoldButton>
      )}
    </div>
  );
}

const Step = ({ n }) => (
  <span className="w-6 h-6 rounded-full bg-gold text-black text-xs font-bold grid place-items-center shrink-0">
    {n}
  </span>
);
