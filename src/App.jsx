import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TabBar from "./components/TabBar.jsx";
import ToastHost from "./components/Toast.jsx";
import RequireUser from "./components/RequireUser.jsx";
import PlansGate from "./components/PlansGate.jsx";
import { useOnline } from "./lib/hooks.js";
import { S } from "./lib/strings.js";
import Welcome, { welcomeDone } from "./screens/Welcome.jsx";
import Home from "./screens/Home.jsx";
import Explore from "./screens/Explore.jsx";
import Firm from "./screens/Firm.jsx";
import News from "./screens/News.jsx";
import Article from "./screens/Article.jsx";
import { Login, Register } from "./screens/Auth.jsx";
import Account from "./screens/Account.jsx";
import Notifications from "./screens/Notifications.jsx";
import Settings from "./screens/Settings.jsx";
import MyFirms from "./screens/MyFirms.jsx";
import FirmForm from "./screens/FirmForm.jsx";
import ArticleForm from "./screens/ArticleForm.jsx";
import Plans from "./screens/Plans.jsx";
import Pay from "./screens/Pay.jsx";
import Payments from "./screens/Payments.jsx";
import { ChangePassword, DeleteAccount } from "./screens/AccountSecurity.jsx";
import { MessageBox, ScreenTitle } from "./components/ui.jsx";

// URL paths double as deep links: a shared /firms/12 opens the firm, like Android's FirmRoute(12).
const TAB_PATHS = ["/", "/explore", "/news", "/account"];
const user = (el) => <RequireUser>{el}</RequireUser>;
const plans = (el) => <PlansGate>{el}</PlansGate>;

function Shell() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const online = useOnline();
  // Welcome once, on the first visit to the start page only: a shared deep link opens directly.
  const [showWelcome, setShowWelcome] = useState(() => !welcomeDone() && pathname === "/");
  const showTabs = TAB_PATHS.includes(pathname);
  // Block body: newer Chrome returns a Promise from scrollTo, which React would take as a cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/news" element={<News />} />
        <Route path="/account" element={<Account />} />

        <Route path="/firms/:id" element={<Firm />} />
        <Route path="/news/:id" element={<Article />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />

        {/* Signed-in users: owners manage their firms and submit news (the server reviews both). */}
        <Route path="/my-firms" element={user(<MyFirms />)} />
        <Route path="/firms/new" element={user(<FirmForm />)} />
        <Route path="/firms/:id/edit" element={user(<FirmForm />)} />
        <Route path="/articles/new" element={user(<ArticleForm />)} />
        <Route path="/articles/:id/edit" element={user(<ArticleForm />)} />
        <Route path="/change-password" element={user(<ChangePassword />)} />
        <Route path="/delete-account" element={user(<DeleteAccount />)} />

        {/* Behind the server's `plans` flag. Plans is open to guests; paying needs an account. */}
        <Route path="/plans" element={plans(<Plans />)} />
        <Route path="/pay/:planId" element={plans(user(<Pay />))} />
        <Route path="/payments" element={plans(user(<Payments />))} />

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
