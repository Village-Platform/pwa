import { BrowserRouter, Route, Routes, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useEffect, useState } from "react";
import TabBar from "./components/TabBar.jsx";
import ToastHost from "./components/Toast.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useOnline } from "./lib/hooks";
import { S } from "./lib/strings";
import { MessageBox, ScreenTitle } from "./components/ui.jsx";
import { routes, guarded, TAB_PATHS } from "./routes.jsx";
import Welcome, { welcomeDone } from "./features/welcome/Welcome.jsx";

function Shell() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const navType = useNavigationType();
  const online = useOnline();
  // Welcome once, on the first visit to the start page only: a shared deep link opens directly.
  const [showWelcome, setShowWelcome] = useState(() => !welcomeDone() && pathname === "/");
  const showTabs = TAB_PATHS.includes(pathname);
  // A new screen starts at the top; Back/Forward (POP) leaves the scroll alone so the list is where the
  // user left it. Block body: newer Chrome returns a Promise from scrollTo, which React would take as a cleanup.
  useEffect(() => {
    if (navType !== "POP") window.scrollTo(0, 0);
  }, [pathname, navType]);

  if (showWelcome) {
    return (
      <Welcome
        onDone={(login) => {
          setShowWelcome(false);
          if (login) nav("/login", { state: { from: "/" } });
        }}
      />
    );
  }

  return (
    <div className={`max-w-xl mx-auto min-h-screen ${showTabs ? "pb-24" : ""}`}>
      {!online && (
        <div className="sticky top-0 z-40 bg-ink text-page text-center text-sm py-1.5 pt-safe">{S.offline}</div>
      )}
      {/* key: navigating to another screen clears a previous crash */}
      <ErrorBoundary key={pathname}>
        <Routes>
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={guarded(r)} />
          ))}
          <Route
            path="*"
            element={
              <>
                <ScreenTitle title="" />
                <MessageBox text={S.notFound} />
              </>
            }
          />
        </Routes>
      </ErrorBoundary>
      {showTabs && <TabBar />}
      <ToastHost />
    </div>
  );
}

// Served from Vite's base URL ("/" on a custom domain, "/pwa/" as a GitHub Pages project site).
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <Shell />
    </BrowserRouter>
  );
}
