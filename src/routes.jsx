import RequireUser from "./components/RequireUser.jsx";
import RequireReviewer from "./components/RequireReviewer.jsx";
import FeatureGate from "./components/FeatureGate.jsx";
import { routes as home } from "./features/home/routes.jsx";
import { routes as firms } from "./features/firms/routes.jsx";
import { routes as news } from "./features/news/routes.jsx";
import { routes as account } from "./features/account/routes.jsx";
import { routes as notifications } from "./features/notifications/routes.jsx";
import { routes as plans } from "./features/plans/routes.jsx";
import { routes as review } from "./features/review/routes.jsx";

/**
 * Every screen, composed from the features. Each feature owns its screens and its `routes.jsx`
 * (src/features/<name>/). To add a feature: create its folder, export `routes` from it, add one
 * import and one spread here.
 *
 * A route entry is { path, element, guards?, tab? }:
 *   path    React Router path. URL paths double as deep links: a shared /firms/12 opens the firm.
 *   element the screen
 *   guards  wrappers, outermost first (see GUARDS below):
 *           "user"  signed-in users only (guests are sent to Login, then back here)
 *           "reviewer" admin or super_admin only (a hint; the server authorizes)
 *           "plans" behind the server's `plans` flag
 *   tab     true: shown with the bottom tab bar (an exact path match, so only top-level screens)
 *
 * Order does not matter: React Router ranks routes by specificity (/firms/new beats /firms/:id).
 * Tab order in the bar is set by components/TabBar.jsx, not here.
 */
export const routes = [...home, ...firms, ...news, ...account, ...notifications, ...plans, ...review];

const GUARDS = {
  user: ({ children }) => <RequireUser>{children}</RequireUser>,
  reviewer: ({ children }) => <RequireReviewer>{children}</RequireReviewer>,
  plans: ({ children }) => <FeatureGate flag="plans">{children}</FeatureGate>,
  // A new flag-gated screen: add `name: ({ children }) => <FeatureGate flag="name">{children}</FeatureGate>`.
};

/** Wraps a route's element in its guards, outermost first. */
export function guarded({ element, guards = [] }) {
  return guards.reduceRight((el, name) => {
    const Guard = GUARDS[name];
    if (!Guard) throw new Error(`Unknown route guard: ${name}`);
    return <Guard>{el}</Guard>;
  }, element);
}

export const TAB_PATHS = routes.filter((r) => r.tab).map((r) => r.path);
