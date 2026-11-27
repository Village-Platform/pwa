import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import { initTheme } from "./lib/theme";
import { startFeatureFlags } from "./lib/features";
import { initAnalytics, installErrorReporting, setAnalyticsUser } from "./lib/analytics";
import { session } from "./lib/session";
import "./index.css";

initTheme();
startFeatureFlags();
// Firebase Analytics. Does nothing when the build has no Firebase config.
initAnalytics();
installErrorReporting();
let signedInAs = session.get().user?.id ?? null;
setAnalyticsUser(signedInAs, session.get().user?.role);
// Sign-in, sign-out or another account: re-tag analytics.
session.subscribe(() => {
  const user = session.get().user;
  if ((user?.id ?? null) === signedInAs) return;
  signedInAs = user?.id ?? null;
  setAnalyticsUser(signedInAs, user?.role);
});
// New deploys take over on the next launch (autoUpdate): no "reload?" prompt in v1.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
