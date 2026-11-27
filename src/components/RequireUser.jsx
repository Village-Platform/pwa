import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../lib/session";

/** Screens that need an account send guests to Login, then back here (Android: nav.go(LoginRoute)). */
export default function RequireUser({ children }) {
  const { user } = useSession();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}
