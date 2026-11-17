import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Api } from "../api/endpoints.js";
import { S } from "../lib/strings.js";
import { toast } from "../components/Toast.jsx";
import { AlertBox, DangerButton, Dialog, FieldLabel, FormField, FormPage, Segmented, SwitchRow, TextArea } from "../components/ui.jsx";

const KINDS = ["news", "announcement", "article"];

/** Create (/articles/new) or edit (/articles/:id/edit) a news item / announcement / article. */
export default function ArticleForm() {
  const { id } = useParams();
  const articleId = id ? Number(id) : null;
  const nav = useNavigate();
  const [f, setF] = useState({ title: "", body: "", kind: "news", published: true, publishedAt: null });
  const [load, setLoad] = useState({ loading: !!articleId, error: null, tick: 0 });
  const [errors, setErrors] = useState({});
  const [submit, setSubmit] = useState({ busy: false, error: null });
  const [reviewDialog, setReviewDialog] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    let alive = true;
    setLoad((l) => ({ ...l, loading: true, error: null }));
    Api.article(articleId)
      .then((r) => {
        if (!alive) return;
        const a = r.data;
        setF({ title: a.title, body: a.body, kind: a.kind, published: !!a.published_at, publishedAt: a.published_at });
        setLoad((l) => ({ ...l, loading: false }));
      })
      .catch((error) => alive && setLoad((l) => ({ ...l, loading: false, error })));
    return () => {
      alive = false;
    };
  }, [articleId, load.tick]);

  const set = (patch) => {
    setF((x) => ({ ...x, ...patch }));
    setErrors({});
    setSubmit((s) => ({ ...s, error: null }));
  };

  const done = (savedId) => (articleId ? nav(-1) : nav(`/news/${savedId}`, { replace: true }));

  const save = async () => {
    if (submit.busy) return;
    const errs = {};
    if (!f.title.trim()) errs.title = S.errorRequired;
    if (!f.body.trim()) errs.body = S.errorRequired;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    // Published: keep the original date, or publish now. Draft: no date (Android ArticleFormViewModel).
    const published_at = f.published ? f.publishedAt || new Date().toISOString() : null;
    const body = { title: f.title.trim(), body: f.body.trim(), kind: f.kind, published_at };
    setSubmit({ busy: true, error: null });
    try {
      const res = articleId ? await Api.updateArticle(articleId, body) : await Api.createArticle(body);
      setSubmit({ busy: false, error: null });
      if (res.data.review_status === "pending" || !res.data.published_at) setReviewDialog(res.data.id);
      else {
        toast(S.saved);
        done(res.data.id);
      }
    } catch (error) {
      setSubmit({ busy: false, error });
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    setSubmit({ busy: true, error: null });
    try {
      await Api.deleteArticle(articleId);
      toast(S.deleted);
      // The article page under the form is gone too.
      nav("/news", { replace: true });
    } catch (error) {
      setSubmit({ busy: false, error });
    }
  };

  return (
    <>
      <FormPage
        title={articleId ? S.editArticle : S.addArticle}
        loading={load.loading}
        loadError={load.error}
        onRetry={() => setLoad((l) => ({ ...l, tick: l.tick + 1 }))}
        error={submit.error}
        submitting={submit.busy}
        onSave={save}
        extra={
          articleId && (
            <DangerButton type="button" className="w-full" onClick={() => setConfirmDelete(true)} disabled={submit.busy}>
              {S.delete}
            </DangerButton>
          )
        }
      >
        <FormField label={S.articleTitle} value={f.title} onChange={(e) => set({ title: e.target.value })} error={errors.title} />
        <div>
          <FieldLabel>{S.articleKind}</FieldLabel>
          <Segmented options={KINDS.map((k) => ({ value: k, label: S.kind[k] }))} selected={f.kind} onSelect={(k) => set({ kind: k })} />
        </div>
        {!articleId && <p className="text-sm text-muted">{S.articleReviewNote}</p>}
        <SwitchRow label={S.published} checked={f.published} onChange={(v) => set({ published: v })} />
        <TextArea label={S.articleBody} rows={10} value={f.body} onChange={(e) => set({ body: e.target.value })} error={errors.body} />
      </FormPage>

      {reviewDialog && (
        <AlertBox
          title={S.submissionSuccessTitle}
          body={S.articleSentForReview}
          onClose={() => {
            const savedId = reviewDialog;
            setReviewDialog(null);
            done(savedId);
          }}
        />
      )}
      {confirmDelete && (
        <Dialog
          danger
          title={S.deleteArticleTitle}
          body={S.deleteArticleBody(f.title)}
          confirm={S.delete}
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
