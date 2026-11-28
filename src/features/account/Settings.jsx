import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import { useTheme } from "../../lib/theme";
import { S } from "../../lib/strings";
import { ScreenTitle, SurfaceCard } from "../../components/ui.jsx";

const OPTIONS = [
  { value: "light", label: S.themeLight },
  { value: "dark", label: S.themeDark },
  { value: "system", label: S.themeSystem },
];

export default function Settings() {
  const nav = useNavigate();
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
      <h2 className="px-4 mt-5 mb-2 font-bold">{S.notifications}</h2>
      <SurfaceCard className="mx-4">
        <button
          onClick={() => nav("/settings/notifications")}
          className="w-full flex items-center gap-3 px-3.5 py-3.5 text-start active:bg-surface2"
        >
          <Icon name="bell" className="text-goldInk" />
          <span className="flex-1 font-semibold">{S.notificationSettings}</span>
          <Icon name="chevron" className="text-muted" />
        </button>
      </SurfaceCard>
    </div>
  );
}
