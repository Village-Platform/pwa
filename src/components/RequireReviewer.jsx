import { useSession } from "../lib/session";
import { S } from "../lib/strings";
import RequireUser from "./RequireUser.jsx";
import { MessageBox, ScreenTitle } from "./ui.jsx";

export const isReviewer = (user) => user?.role === "admin" || user?.role === "super_admin";

/**
 * Screens for reviewers (admin, super_admin). Guests go to Login first. A presentation hint only:
 * the server still authorizes every request, so a stale role here cannot grant anything.
 */
export default function RequireReviewer({ children }) {
  const { user } = useSession();
  return (
    <RequireUser>
      {isReviewer(user) ? (
        children
      ) : (
        <>
          <ScreenTitle title="" />
          <MessageBox text={S.notAllowed} />
        </>
      )}
    </RequireUser>
  );
}
