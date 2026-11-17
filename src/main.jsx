import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import { initTheme } from "./lib/theme.js";
import { startFeatureFlags } from "./lib/features.js";
import "./index.css";

initTheme();
startFeatureFlags();
// New deploys take over on the next launch (autoUpdate): no "reload?" prompt in v1.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
