import { useNavigate } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { normalizeDigits, validPhone } from "../../lib/format";
import { session, useSession } from "../../lib/session";
import { S } from "../../lib/strings";
import { useForm } from "../../lib/useForm";
import { toast } from "../../components/Toast.jsx";
import { FormField, FormPage } from "../../components/ui.jsx";

/** Name, email and phone. Changing the phone also needs the current password (the server checks it). */
export default function EditProfile() {
  const nav = useNavigate();
  const { user } = useSession();
  const form = useForm({
    initial: { name: user.name ?? "", phone: user.phone ?? "", email: user.email ?? "", currentPassword: "" },
    fieldMap: { current_password: "currentPassword" },
    validate: (f) => {
      const errs = {};
      if (!f.name.trim()) errs.name = S.errorNameRequired;
      if (!validPhone(f.phone)) errs.phone = S.errorPhoneInvalid;
      if (f.phone.trim() !== user.phone && !f.currentPassword) errs.currentPassword = S.errorPasswordRequired;
      return errs;
    },
    submit: (f) => {
      const phoneChanged = f.phone.trim() !== user.phone;
      return Api.updateMe({
        name: f.name.trim(),
        phone: f.phone.trim(),
        // Empty clears it, like the other forms.
        email: f.email.trim() || null,
        ...(phoneChanged ? { current_password: f.currentPassword } : {}),
      });
    },
    onSuccess: (res) => {
      session.setUser(res.data);
      toast(S.profileSaved);
      nav(-1);
    },
  });
  const { values: f, set, errors } = form;
  const phoneChanged = f.phone.trim() !== user.phone;

  return (
    <FormPage title={S.editProfile} error={form.error} submitting={form.busy} onSave={form.save}>
      <FormField
        label={S.name}
        autoComplete="name"
        value={f.name}
        onChange={(e) => set({ name: e.target.value })}
        error={errors.name}
      />
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
        label={S.emailOptional}
        type="email"
        autoComplete="email"
        dir="ltr"
        value={f.email}
        onChange={(e) => set({ email: e.target.value })}
        error={errors.email}
      />
      {phoneChanged && (
        <>
          <p className="text-sm text-muted">{S.currentPasswordHint}</p>
          <FormField
            label={S.currentPassword}
            type="password"
            autoComplete="current-password"
            value={f.currentPassword}
            onChange={(e) => set({ currentPassword: e.target.value })}
            error={errors.currentPassword}
          />
        </>
      )}
    </FormPage>
  );
}
