import { useEffect, useState } from "react";

// A short message at the bottom, like Android's Toast. toast("…") from anywhere.
let push = () => {};
export const toast = (text) => push(text);

export default function ToastHost() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t;
    push = (text) => {
      setMsg(text);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 2500);
    };
    return () => clearTimeout(t);
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-6 pointer-events-none" role="status">
      <div className="rounded-full bg-ink text-page px-5 py-2.5 text-sm font-semibold shadow-lg">{msg}</div>
    </div>
  );
}
