import { useFeatures, useRefreshFeatures } from "../lib/features.js";
import { S } from "../lib/strings.js";
import { MessageBox, ScreenTitle } from "./ui.jsx";

/**
 * Plans, pay and payments live behind the server's `plans` flag. Entry points are hidden while it is
 * off; this covers a screen opened from a link or left open when the flag was switched off. A message
 * rather than a redirect, like Android's PlansGate. While the flag is still loading (null) the screen
 * shows: only a known "off" closes it.
 */
export default function PlansGate({ children }) {
  useRefreshFeatures();
  const { plans } = useFeatures();
  if (plans === false) {
    return (
      <>
        <ScreenTitle title="" />
        <MessageBox text={S.featureUnavailable} />
      </>
    );
  }
  return children;
}
