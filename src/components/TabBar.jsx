import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";
import { S } from "../lib/strings";

const TABS = [
  { to: "/", icon: "home", label: S.tabHome, end: true },
  { to: "/explore", icon: "explore", label: S.tabExplore },
  { to: "/news", icon: "news", label: S.tabNews },
  { to: "/account", icon: "person", label: S.tabAccount },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line pb-safe">
      <div className="max-w-xl mx-auto grid grid-cols-4">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            replace
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-xs font-semibold ${
                isActive ? "text-goldInk" : "text-muted"
              }`
            }
          >
            <Icon name={t.icon} size={24} />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
