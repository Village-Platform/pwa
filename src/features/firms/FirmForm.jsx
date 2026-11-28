import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { normalizeDigits, validCoordinates } from "../../lib/format";
import { useLoad } from "../../lib/hooks";
import { track } from "../../lib/analytics";
import { useForm } from "../../lib/useForm";
import { useSession } from "../../lib/session";
import { S } from "../../lib/strings";
import LocationPicker from "./LocationPicker.jsx";
import { toast } from "../../components/Toast.jsx";
import {
  AlertBox,
  FieldLabel,
  FilterChipsRow,
  FormField,
  FormPage,
  Segmented,
  TextArea,
} from "../../components/ui.jsx";

const STATUSES = ["active", "pending", "suspended"];
const EMPTY = {
  categoryId: null,
  name: "",
  description: "",
  phone: "",
  whatsapp: "",
  address: "",
  latitude: "",
  longitude: "",
  workingHours: "",
  status: "active",
};

/** Create (/firms/new) or edit (/firms/:id/edit). Owners never send a status; the super admin may. */
export default function FirmForm() {
  const { id } = useParams();
  const firmId = id ? Number(id) : null;
  const nav = useNavigate();
  const { user } = useSession();
  const canSetStatus = user?.role === "super_admin";

  const [reviewDialog, setReviewDialog] = useState(null); // saved firm id

  // Categories, and the firm when editing.
  const load = useLoad(async () => {
    const [cats, firm] = await Promise.all([Api.categories(), firmId ? Api.firm(firmId) : null]);
    return { categories: cats.data, firm: firm?.data ?? null };
  }, [firmId]);
  const categories = load.data?.categories ?? [];

  // New firm: open it in place of the form. Edit: back to the firm page.
  const done = (savedId) => (firmId ? nav(-1) : nav(`/firms/${savedId}`, { replace: true }));

  const form = useForm({
    initial: EMPTY,
    fieldMap: { category_id: "categoryId", working_hours: "workingHours" },
    validate: (f) => {
      const coordsOk = validCoordinates(f.latitude, f.longitude);
      const errs = {};
      if (!f.name.trim()) errs.name = S.errorRequired;
      if (!f.categoryId) errs.categoryId = S.errorCategoryRequired;
      if (!coordsOk) errs.latitude = S.errorCoordinates;
      return errs;
    },
    // Same body as Android's FirmInput.toBody(): empty strings become null so a cleared field clears.
    submit: (f) => {
      const lat = f.latitude.trim();
      const lng = f.longitude.trim();
      const body = {
        category_id: f.categoryId,
        name: f.name.trim(),
        description: f.description.trim() || null,
        phone: f.phone.trim() || null,
        whatsapp: f.whatsapp.trim() || null,
        address: f.address.trim() || null,
        latitude: lat === "" ? null : Number(lat),
        longitude: lng === "" ? null : Number(lng),
        working_hours: f.workingHours.trim() || null,
        ...(canSetStatus ? { status: f.status } : {}),
      };
      return firmId ? Api.updateFirm(firmId, body) : Api.createFirm(body);
    },
    onSuccess: (res) => {
      track("firm_submit", { mode: firmId ? "edit" : "create", status: res.data.status });
      if (res.data.status === "pending") setReviewDialog(res.data.id);
      else {
        toast(S.firmSaved);
        done(res.data.id);
      }
    },
  });
  const { values: f, set, errors } = form;

  // Fill the form once the firm to edit has loaded.
  const loadedFirm = load.data?.firm;
  const { reset } = form;
  useEffect(() => {
    if (!loadedFirm) return;
    reset({
      categoryId: loadedFirm.category.id,
      name: loadedFirm.name,
      description: loadedFirm.description || "",
      phone: loadedFirm.phone || "",
      whatsapp: loadedFirm.whatsapp || "",
      address: loadedFirm.address || "",
      latitude: loadedFirm.latitude?.toString() ?? "",
      longitude: loadedFirm.longitude?.toString() ?? "",
      workingHours: loadedFirm.working_hours || "",
      status: loadedFirm.status,
    });
  }, [loadedFirm, reset]);

  return (
    <>
      <FormPage
        title={firmId ? S.editFirm : S.addFirm}
        loading={load.loading && !load.data}
        loadError={load.error && !load.data ? load.error : null}
        onRetry={load.reload}
        error={form.error}
        submitting={form.busy}
        onSave={form.save}
      >
        <FormField
          label={S.firmName}
          value={f.name}
          onChange={(e) => set({ name: e.target.value })}
          error={errors.name}
        />
        <div>
          <FieldLabel>{S.firmCategory}</FieldLabel>
          <div className="-mx-4">
            <FilterChipsRow
              items={categories.map((c) => ({ value: c.id, label: c.name }))}
              selected={f.categoryId}
              onSelect={(v) => set({ categoryId: v })}
            />
          </div>
          {errors.categoryId && <p className="text-sm text-bad">{errors.categoryId}</p>}
        </div>

        {canSetStatus ? (
          <div>
            <FieldLabel>{S.firmStatusLabel}</FieldLabel>
            <Segmented
              options={STATUSES.map((s) => ({ value: s, label: S.firmStatus[s] }))}
              selected={f.status}
              onSelect={(s) => set({ status: s })}
            />
          </div>
        ) : !firmId ? (
          <p className="text-sm text-muted">{S.firmReviewNote}</p>
        ) : f.status === "active" ? (
          <p className="text-sm text-muted">{S.firmEditReviewNote}</p>
        ) : null}

        <FormField
          label={S.phone}
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={f.phone}
          onChange={(e) => set({ phone: normalizeDigits(e.target.value) })}
          error={errors.phone}
        />
        <FormField
          label={S.whatsapp}
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={f.whatsapp}
          onChange={(e) => set({ whatsapp: normalizeDigits(e.target.value) })}
          error={errors.whatsapp}
        />
        <FormField
          label={S.address}
          value={f.address}
          onChange={(e) => set({ address: e.target.value })}
          error={errors.address}
        />
        <FormField
          label={S.workingHours}
          value={f.workingHours}
          onChange={(e) => set({ workingHours: e.target.value })}
          error={errors.workingHours}
        />
        <LocationPicker
          latitude={f.latitude}
          longitude={f.longitude}
          onChange={(latitude, longitude) =>
            set({ latitude: normalizeDigits(latitude), longitude: normalizeDigits(longitude) })
          }
          error={errors.latitude || errors.longitude}
        />
        <TextArea
          label={S.description}
          value={f.description}
          onChange={(e) => set({ description: e.target.value })}
          error={errors.description}
        />
      </FormPage>

      {reviewDialog && (
        <AlertBox
          title={S.submissionSuccessTitle}
          body={S.firmSentForReview}
          onClose={() => {
            const savedId = reviewDialog;
            setReviewDialog(null);
            done(savedId);
          }}
        />
      )}
    </>
  );
}
