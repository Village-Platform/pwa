import Account from "./Account.jsx";
import { Login, Register } from "./Auth.jsx";
import { ChangePassword, DeleteAccount } from "./AccountSecurity.jsx";
import Settings from "./Settings.jsx";

export const routes = [
  { path: "/account", element: <Account />, tab: true },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/settings", element: <Settings /> },
  { path: "/change-password", element: <ChangePassword />, guards: ["user"] },
  { path: "/delete-account", element: <DeleteAccount />, guards: ["user"] },
];
