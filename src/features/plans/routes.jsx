import Plans from "./Plans.jsx";
import Pay from "./Pay.jsx";
import Payments from "./Payments.jsx";

// Behind the server's `plans` flag. Plans is open to guests; paying needs an account.
export const routes = [
  { path: "/plans", element: <Plans />, guards: ["plans"] },
  { path: "/pay/:planId", element: <Pay />, guards: ["plans", "user"] },
  { path: "/payments", element: <Payments />, guards: ["plans", "user"] },
];
