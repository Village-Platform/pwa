import { Link, useLocation, useNavigate } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { useForm } from "../../lib/useForm";
import { track } from "../../lib/analytics";
import { session } from "../../lib/session";
import { normalizeDigits, validPhone } from "../../lib/format";
import { S } from "../../lib/strings";
import { BrandMark, ErrorBanner, FormField, GoldButton, ScreenTitle } from "../../components/ui.jsx";

// <form onSubmit> handler for a useForm form.
const onSubmit = (form) => (e) => {
  e.preventDefault();
  form.save();
};

// Login and Register return to the screen that asked for them (location.state.from), like Android.
function useFinish(event) {
  const nav = useNavigate();
  const from = useLocation().state?.from || "/account";
  return (payload) => {
    track(event, { method: "phone" });
    session.signIn(payload.data);
    nav(from, { replace: true });
  };
}

export function Login() {
  const finish = useFinish("login");
  const location = useLocation();
  const form = useForm({
    initial: { phone: "", password: "" },
    validate: (v) => {
      const errs = {};
      if (!validPhone(v.phone)) errs.phone = S.errorPhoneInvalid;
      if (!v.password) errs.password = S.errorPasswordRequired;
      return errs;
    },
    submit: (v) => Api.login(v.phone.trim(), v.password),
    onSuccess: finish,
  });
  const { values: f, set, errors } = form;

  return (
    <div className="pb-8">
      <ScreenTitle title={S.login} />
      <form onSubmit={onSubmit(form)} className="px-4 pt-6 space-y-4 max-w-md mx-auto" noValidate>
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
          value={f.phone}
          onChange={(e) => set({ phone: normalizeDigits(e.target.value) })}
          error={errors.phone}
        />
        <FormField
          label={S.password}
          type="password"
          autoComplete="current-password"
          value={f.password}
          onChange={(e) => set({ password: e.target.value })}
          error={errors.password}
        />
        <ErrorBanner error={form.error} />
        <GoldButton type="submit" disabled={form.busy} className="w-full">
          {form.busy ? S.loading : S.login}
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
  const finish = useFinish("sign_up");
  const location = useLocation();
  const form = useForm({
    initial: { name: "", phone: "", email: "", password: "", password_confirmation: "" },
    validate: (f) => {
      const errs = {};
      if (!f.name.trim()) errs.name = S.errorNameRequired;
      if (!validPhone(f.phone)) errs.phone = S.errorPhoneInvalid;
      if (f.password.length < 8) errs.password = S.errorPasswordShort;
      if (f.password !== f.password_confirmation) errs.password_confirmation = S.errorPasswordMismatch;
      return errs;
    },
    submit: (f) =>
      Api.register({ ...f, name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined }),
    onSuccess: finish,
  });
  const { values: f, set, errors } = form;
  // Phone digits typed on an Arabic keyboard become 0-9.
  const bind = (k) => ({
    value: f[k],
    onChange: (e) => set({ [k]: k === "phone" ? normalizeDigits(e.target.value) : e.target.value }),
    error: errors[k],
  });

  return (
    <div className="pb-8">
      <ScreenTitle title={S.register} />
      <form onSubmit={onSubmit(form)} className="px-4 pt-6 space-y-4 max-w-md mx-auto" noValidate>
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
        <ErrorBanner error={form.error} />
        <GoldButton type="submit" disabled={form.busy} className="w-full">
          {form.busy ? S.loading : S.createAccount}
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
