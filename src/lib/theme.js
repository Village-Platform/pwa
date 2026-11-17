import { useEffect, useState } from "react";

// light / dark / system, like the Android Settings screen. index.html applies it before first paint.
const KEY = "aghour.theme";
const media = matchMedia("(prefers-color-scheme: dark)");

function apply(choice) {
  const dark = choice === "dark" || (choice === "system" && media.matches);
  document.documentElement.classList.toggle("dark", dark);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute("content", dark ? "#0D1117" : "#FFFFFF");
    m.removeAttribute("media");
  });
}

export function useTheme() {
  const [choice, setChoice] = useState(() => localStorage.getItem(KEY) || "system");
  useEffect(() => {
    apply(choice);
    localStorage.setItem(KEY, choice);
    if (choice !== "system") return;
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);
  return [choice, setChoice];
}

export const initTheme = () => apply(localStorage.getItem(KEY) || "system");
