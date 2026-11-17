import { useRef, useState } from "react";

// Pull down at the top of the page to reload (Android's PullToRefreshBox). An installed iOS web app
// has no browser pull-to-refresh, so without this a page could only be refreshed by restarting.
const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const start = useRef(null);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);

  const onTouchStart = (e) => {
    start.current = window.scrollY <= 0 && !busy ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e) => {
    if (start.current == null) return;
    const dy = e.touches[0].clientY - start.current;
    setPull(dy > 0 ? Math.min(dy * 0.5, 110) : 0);
  };
  const onTouchEnd = async () => {
    if (start.current == null) return;
    start.current = null;
    if (pull >= THRESHOLD) {
      setBusy(true);
      setPull(50);
      try {
        await onRefresh();
      } finally {
        setBusy(false);
        setPull(0);
      }
    } else setPull(0);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="flex justify-center overflow-hidden transition-[height] duration-150" style={{ height: pull }}>
        <div
          className={`mt-3 w-7 h-7 rounded-full border-[3px] border-gold border-t-transparent ${busy ? "animate-spin" : ""}`}
          style={{ transform: busy ? undefined : `rotate(${pull * 4}deg)`, opacity: Math.min(pull / THRESHOLD, 1) }}
        />
      </div>
      {children}
    </div>
  );
}
