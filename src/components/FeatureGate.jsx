import { useFlag, useRefreshFeatures } from "../lib/features";
import { S } from "../lib/strings";
import { MessageBox, ScreenTitle } from "./ui.jsx";

/**
 * Puts a whole screen behind one of the server's feature flags. Entry points should be hidden with
 * `useFlag` while the flag is off; this covers a screen opened from a link or left open when the flag
 * was switched off. It shows a message rather than redirecting, like Android's PlansGate. While the
 * flag is still unknown (null) the screen shows: only a known "off" closes it.
 */
export default function FeatureGate({ flag, children }) {
  useRefreshFeatures();
  const on = useFlag(flag);
  if (on === false) {
    return (
      <>
        <ScreenTitle title="" />
        <MessageBox text={S.featureUnavailable} />
      </>
    );
  }
  return children;
}
