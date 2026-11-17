import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Api } from "../api/endpoints.js";
import { useSession } from "../lib/session.js";
import { S } from "../lib/strings.js";
import LocationPicker from "../components/LocationPicker.jsx";
import { toast } from "../components/Toast.jsx";
import { AlertBox, FieldLabel, FilterChipsRow, FormField, FormPage, Segmented, TextArea } from "../components/ui.jsx";

const STATUSES = ["active", "pending", "suspended"];
const EMPTY = { categoryId: null, name: "", description: "", phone: "", whatsapp: "", address: "", latitude: "", longitude: "", workingHours: "", status: "active" };

/** Create (/firms/new) or edit (/firms/:id/edit). Owners never send a status; the super admin may. */
export default function FirmForm() {
  const { id } = useParams();
  const firmId = id ? Number(id) : null;
  const nav = useNavigate();
  const { user } = useSession();
  const canSetStatus = user?.role === "super_admin";

  const [f, setF] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [load, setLoad] = useState({ loading: true, error: null, tick: 0 });
  const [errors, setErrors] = useState({});
  const [submit, setSubmit] = useState({ busy: false, error: null });
  const [reviewDialog, setReviewDialog] = useState(null); // saved firm id

  useEffect(() => {
    let alive = true;
    setLoad((l) => ({ ...l, loading: true, error: null }));
    Promise.all([Api.categories(), firmId ? Api.firm(firmId) : Promise.resolve(null)])
      .then(([cats, firm]) => {
        if (!alive) return;
        setCategories(cats.data);
        if (firm) {
          const d = firm.data;
          setF({
            categoryId: d.category.id,
            name: d.name,
            description: d.description || "",
            phone: d.phone || "",
            whatsapp: d.whatsapp || "",
            address: d.address || "",
            latitude: d.latitude?.toString() ?? "",
            longitude: d.longitude?.toString() ?? "",
            workingHours: d.working_hours || "",
            status: d.status,
          });
        }
        setLoad((l) => ({ ...l, loading: false }));
      })
      .catch((error) => alive && setLoad((l) => ({ ...l, loading: false, error })));
    return () => {
      alive = false;
    };
  }, [firmId, load.tick]);

  const set = (patch) => {
    setF((x) => ({ ...x, ...patch }));
    setErrors({});
    setSubmit((s) => ({ ...s, error: null }));
  };

  // New firm: open it in place of the form. Edit: back to the firm page.
  const done = (savedId) => (firmId ? nav(-1) : nav(`/firms/${savedId}`, { replace: true }));

  const save = async () => {
    if (submit.busy) return;
    const lat = f.latitude.trim();
    const lng = f.longitude.trim();
    const coordsOk = (lat === "" && lng === "") || (lat !== "" && lng !== "" && !isNaN(Number(lat)) && !isNaN(Number(lng)));
    const errs = {};
    if (!f.name.trim()) errs.name = S.errorRequired;
    if (!f.categoryId) errs.category = S.errorCategoryRequired;
    if (!coordsOk) errs.coords = S.errorCoordinates;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Same body as Android's FirmInput.toBody(): empty strings become null so a cleared field clears.
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
    setSubmit({ busy: true, error: null });
    try {
      const res = firmId ? await Api.updateFirm(firmId, body) : await Api.createFirm(body);
      setSubmit({ busy: false, error: null });
      if (res.data.status === "pending") setReviewDialog(res.data.id);
      else {
        toast(S.firmSaved);
        done(res.data.id);
      }
    } catch (error) {
      setSubmit({ busy: false, error });
    }
  };

  return (
    <>
      <FormPage
        title={firmId ? S.editFirm : S.addFirm}
        loading={load.loading}
        loadError={load.error}
        onRetry={() => setLoad((l) => ({ ...l, tick: l.tick + 1 }))}
        error={submit.error}
        submitting={submit.busy}
        onSave={save}
      >
        <FormField label={S.firmName} value={f.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
        <div>
          <FieldLabel>{S.firmCategory}</FieldLabel>
          <div className="-mx-4">
            <FilterChipsRow
              items={categories.map((c) => ({ value: c.id, label: c.name }))}
              selected={f.categoryId}
              onSelect={(v) => set({ categoryId: v })}
            />
          </div>
          {errors.category && <p className="text-sm text-bad">{errors.category}</p>}
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

        <FormField label={S.phone} type="tel" inputMode="tel" dir="ltr" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
        <FormField label={S.whatsapp} type="tel" inputMode="tel" dir="ltr" value={f.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />
        <FormField label={S.address} value={f.address} onChange={(e) => set({ address: e.target.value })} />
        <FormField label={S.workingHours} value={f.workingHours} onChange={(e) => set({ workingHours: e.target.value })} />
        <LocationPicker
          latitude={f.latitude}
          longitude={f.longitude}
          onChange={(latitude, longitude) => set({ latitude, longitude })}
          error={errors.coords}
        />
        <TextArea label={S.description} value={f.description} onChange={(e) => set({ description: e.target.value })} />
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
