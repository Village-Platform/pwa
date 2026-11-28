import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Api } from "../api/endpoints.js";
import { session } from "../lib/session.js";
import { validPhone } from "../lib/format.js";
import { S } from "../lib/strings.js";
import { BrandMark, ErrorBanner, FormField, GoldButton, ScreenTitle } from "../components/ui.jsx";

// Login and Register return to the screen that asked for them (location.state.from), like Android.
function useFinish() {
  const nav = useNavigate();
  const from = useLocation().state?.from || "/account";
  return (payload) => {
    session.signIn(payload.data);
    nav(from, { replace: true });
  };
}

export function Login() {
  const finish = useFinish();
  const location = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!validPhone(phone)) errs.phone = S.errorPhoneInvalid;
    if (!password) errs.password = S.errorPasswordRequired;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setApiError(null);
    try {
      finish(await Api.login(phone.trim(), password));
    } catch (err) {
      setApiError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-8">
      <ScreenTitle title={S.login} />
      <form onSubmit={submit} className="px-4 pt-6 space-y-4 max-w-md mx-auto" noValidate>
        <div className="flex flex-col items-center gap-2 mb-2">
          <BrandMark className="h-16" />
          <h2 className="text-2xl font-extrabold">{S.loginTitle}</h2>
          <p className="text-muted">{S.loginHint}</p>
        </div>
        <FormField
          label={S.phoneNumber}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />
        <FormField
          label={S.password}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <ErrorBanner error={apiError} />
        <GoldButton type="submit" disabled={busy} className="w-full">
          {busy ? S.loading : S.login}
        </GoldButton>
        <p className="text-center text-sm">
          {S.noAccountQ}{" "}
          <Link to="/register" replace state={location.state} className="font-bold text-goldInk">
            {S.createAccountLink}
          </Link>
        </p>
      </form>
    </div>
  );
}

export function Register() {
  const finish = useFinish();
  const location = useLocation();
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState(null);
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }), error: errors[k] });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!f.name.trim()) errs.name = S.errorNameRequired;
    if (!validPhone(f.phone)) errs.phone = S.errorPhoneInvalid;
    if (f.password.length < 8) errs.password = S.errorPasswordShort;
    if (f.password !== f.password_confirmation) errs.password_confirmation = S.errorPasswordMismatch;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setApiError(null);
    try {
      finish(
        await Api.register({ ...f, name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined }),
      );
    } catch (err) {
      setApiError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-8">
      <ScreenTitle title={S.register} />
      <form onSubmit={submit} className="px-4 pt-6 space-y-4 max-w-md mx-auto" noValidate>
        <div className="text-center mb-2">
          <h2 className="text-2xl font-extrabold">{S.registerTitle}</h2>
          <p className="text-muted">{S.registerHint}</p>
        </div>
        <FormField label={S.name} autoComplete="name" {...bind("name")} />
        <FormField
          label={S.phoneNumber}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          {...bind("phone")}
        />
        <FormField label={S.emailOptional} type="email" autoComplete="email" dir="ltr" {...bind("email")} />
        <FormField label={S.password} type="password" autoComplete="new-password" {...bind("password")} />
        <FormField
          label={S.passwordConfirmation}
          type="password"
          autoComplete="new-password"
          {...bind("password_confirmation")}
        />
        <ErrorBanner error={apiError} />
        <GoldButton type="submit" disabled={busy} className="w-full">
          {busy ? S.loading : S.createAccount}
        </GoldButton>
        <p className="text-center text-sm">
          {S.haveAccountQ}{" "}
          <Link to="/login" replace state={location.state} className="font-bold text-goldInk">
            {S.login}
          </Link>
        </p>
      </form>
    </div>
  );
}
