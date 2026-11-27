import { useState } from "react";
import { Api } from "../api/endpoints";
import { S } from "../lib/strings";
import { toast } from "./Toast.jsx";
import { Dialog, ErrorBanner, GoldButton, GhostButton, TextArea } from "./ui.jsx";

const KINDS = {
  firm: {
    approve: Api.approveFirm,
    reject: Api.rejectFirm,
    rejectTitle: S.rejectFirmTitle,
    approved: S.firmApproved,
    rejected: S.firmRejected,
  },
  article: {
    approve: Api.approveArticle,
    reject: Api.rejectArticle,
    rejectTitle: S.rejectArticleTitle,
    approved: S.articleApproved,
    rejected: S.articleRejected,
  },
};

/**
 * Approve / reject for a reviewer, on a record that is waiting for review. Render it only when the
 * server says so (`can.review`); the policy still decides the request. Rejecting needs a reason,
 * which the author sees. `onChanged(updatedRecord)` gets the server's new version.
 */
export default function ReviewControls({ kind, id, onChanged }) {
  const k = KINDS[kind];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(null);

  const run = async (call, message) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await call();
      toast(message);
      setRejecting(false);
      onChanged?.(res.data);
    } catch (e) {
      setError(e);
      setRejecting(false);
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = () => {
    if (!reason.trim()) return setReasonError(S.rejectReasonRequired);
    run(() => k.reject(id, reason.trim()), k.rejected);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <GoldButton className="flex-1" disabled={busy} onClick={() => run(() => k.approve(id), k.approved)}>
          {S.approve}
        </GoldButton>
        <GhostButton className="flex-1" disabled={busy} onClick={() => setRejecting(true)}>
          {S.reject}
        </GhostButton>
      </div>
      <ErrorBanner error={error} />
      {rejecting && (
        <Dialog
          danger
          title={k.rejectTitle}
          confirm={S.reject}
          busy={busy}
          onConfirm={confirmReject}
          onCancel={() => setRejecting(false)}
        >
          <div className="mt-3">
            <TextArea
              label={S.rejectReason}
              rows={3}
              value={reason}
              error={reasonError}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError(null);
              }}
            />
          </div>
        </Dialog>
      )}
    </div>
  );
}
