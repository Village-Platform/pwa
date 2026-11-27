import { useCallback, useRef, useState } from "react";
import { fieldErrors } from "./errors";

/**
 * State for a form that validates, submits and shows what the server said.
 *
 *   const form = useForm({
 *     initial: { name: "" },
 *     validate: (v) => (v.name.trim() ? {} : { name: S.errorRequired }),   // { field: message }
 *     submit: (v) => Api.save(v),                                          // may throw ApiError
 *     onSuccess: (result, values) => nav(-1),
 *     fieldMap: { working_hours: "workingHours" },                         // server field -> form field
 *   });
 *
 *   form.values, form.set({ name }), form.errors, form.error (not tied to a field), form.busy,
 *   form.save(), form.reset(values)
 *
 * Editing any field clears the shown errors. A 422 `validation_failed` is spread over the fields it
 * names; the banner error is kept only when none of them is a field of this form.
 */
/** { field: message } */
export type FieldErrors = Record<string, string>;

export interface UseFormOptions<V, R> {
  initial: V;
  /** Returns { field: message } for what is wrong; empty when the values are fine. */
  validate?: (values: V) => FieldErrors;
  /** Sends the values. May throw an ApiError. */
  submit: (values: V) => Promise<R>;
  onSuccess?: (result: R, values: V) => void;
  /** Server field name -> form field name. */
  fieldMap?: Record<string, string>;
}

export function useForm<V extends object, R = unknown>({
  initial,
  validate,
  submit,
  onSuccess,
  fieldMap,
}: UseFormOptions<V, R>) {
  const [values, setValues] = useState<V>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<{ busy: boolean; error: Error | null }>({ busy: false, error: null });
  // Latest callbacks without re-creating save() on every render.
  const latest = useRef({ values, validate, submit, onSuccess, fieldMap, busy: state.busy });
  latest.current = { values, validate, submit, onSuccess, fieldMap, busy: state.busy };

  const set = useCallback((patch: Partial<V>) => {
    setValues((v) => ({ ...v, ...patch }));
    setErrors({});
    setState((s) => (s.error ? { ...s, error: null } : s));
  }, []);

  const reset = useCallback((next: V) => {
    setValues(next);
    setErrors({});
    setState({ busy: false, error: null });
  }, []);

  const save = useCallback(async () => {
    const { values, validate, submit, onSuccess, fieldMap, busy } = latest.current;
    if (busy) return;
    const found = validate?.(values) ?? {};
    setErrors(found);
    if (Object.keys(found).length) return;
    setState({ busy: true, error: null });
    try {
      const result = await submit(values);
      setState({ busy: false, error: null });
      onSuccess?.(result, values);
    } catch (e) {
      const error = e as Error;
      const server = fieldErrors(error, fieldMap);
      const known = Object.keys(server).filter((f) => f in values);
      if (known.length) {
        setErrors(Object.fromEntries(known.map((f) => [f, server[f]])));
        setState({ busy: false, error: null });
      } else {
        setState({ busy: false, error });
      }
    }
  }, []);

  return {
    values,
    set,
    errors,
    error: state.error,
    busy: state.busy,
    save,
    reset,
    setError: (error: Error | null) => setState((s) => ({ ...s, error })),
  };
}
