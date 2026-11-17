import { useTheme } from "../lib/theme.js";
import { S } from "../lib/strings.js";
import { ScreenTitle, SurfaceCard } from "../components/ui.jsx";

const OPTIONS = [
  { value: "light", label: S.themeLight },
  { value: "dark", label: S.themeDark },
  { value: "system", label: S.themeSystem },
];

export default function Settings() {
  const [theme, setTheme] = useTheme();
  return (
    <div className="pb-8">
      <ScreenTitle title={S.settings} />
      <h2 className="px-4 mt-5 mb-2 font-bold">{S.appearance}</h2>
      <SurfaceCard className="mx-4 p-1 grid grid-cols-3 gap-1">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            className={`h-11 rounded-xl font-semibold ${theme === o.value ? "bg-gold text-black" : "text-ink"}`}
          >
            {o.label}
          </button>
        ))}
      </SurfaceCard>
      <p className="px-4 mt-2 text-sm text-muted">{S.themeSystemHint}</p>
    </div>
  );
}
