import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Api } from "../api/endpoints.js";
import { session } from "../lib/session.js";
import { S } from "../lib/strings.js";
import { toast } from "../components/Toast.jsx";
import { DangerButton, Dialog, ErrorBanner, FormField, FormPage, ScreenTitle } from "../components/ui.jsx";

export function ChangePassword() {
  const nav = useNavigate();
  const [f, setF] = useState({ password: "", confirmation: "" });
  const [errors, setErrors] = useState({});
  const [submit, setSubmit] = useState({ busy: false, error: null });

  const save = async () => {
    const errs = {};
    if (f.password.length < 8) errs.password = S.errorPasswordShort;
    if (f.password !== f.confirmation) errs.confirmation = S.errorPasswordMismatch;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmit({ busy: true, error: null });
    try {
      const res = await Api.changePassword(f.password, f.confirmation);
      // The server revokes every older token on a password change and returns a fresh one.
      if (res?.meta?.token) session.signIn({ token: res.meta.token, user: res.data ?? session.get().user });
      toast(S.passwordChanged);
      nav(-1);
    } catch (error) {
      setSubmit({ busy: false, error });
    }
  };

  return (
    <FormPage title={S.changePassword} error={submit.error} submitting={submit.busy} onSave={save}>
      <FormField
        label={S.newPassword}
        type="password"
        autoComplete="new-password"
        value={f.password}
        onChange={(e) => setF({ ...f, password: e.target.value })}
        error={errors.password}
      />
      <FormField
        label={S.passwordConfirmation}
        type="password"
        autoComplete="new-password"
        value={f.confirmation}
        onChange={(e) => setF({ ...f, confirmation: e.target.value })}
        error={errors.confirmation}
      />
    </FormPage>
  );
}

/** Same flow as Android: explain, ask for the password, confirm, then DELETE me and sign out. */
export function DeleteAccount() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setConfirm(false);
    setBusy(true);
    setError(null);
    try {
      await Api.deleteAccount(password);
      // Leave the signed-in-only page first, and commit that now: the session store re-renders
      // synchronously, so clearing it while this page is still shown makes RequireUser send the
      // user to Login instead.
      flushSync(() => nav("/account", { replace: true }));
      session.clear();
      toast(S.accountDeleted);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <div className="pb-10">
      <ScreenTitle title={S.deleteAccount} />
      <div className="p-4 space-y-4">
        <p className="leading-relaxed">{S.deleteAccountBody}</p>
        <FormField
          label={S.deleteAccountPasswordHint}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldError(null);
          }}
          error={fieldError}
        />
        <ErrorBanner error={error} />
        <DangerButton
          className="w-full"
          disabled={busy}
          onClick={() => (password ? setConfirm(true) : setFieldError(S.errorPasswordRequired))}
        >
          {busy ? S.loading : S.deleteAccount}
        </DangerButton>
      </div>
      {confirm && (
        <Dialog
          danger
          title={S.deleteAccountConfirmTitle}
          body={S.deleteAccountConfirmBody}
          confirm={S.deleteAccountConfirm}
          onConfirm={remove}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
