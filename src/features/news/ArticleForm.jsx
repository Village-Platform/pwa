import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Api } from "../../api/endpoints";
import { useLoad } from "../../lib/hooks";
import { useForm } from "../../lib/useForm";
import { S } from "../../lib/strings";
import { toast } from "../../components/Toast.jsx";
import {
  AlertBox,
  DangerButton,
  Dialog,
  FieldLabel,
  FormField,
  FormPage,
  Segmented,
  SwitchRow,
  TextArea,
} from "../../components/ui.jsx";

const KINDS = ["news", "announcement", "article"];

/** Create (/articles/new) or edit (/articles/:id/edit) a news item / announcement / article. */
export default function ArticleForm() {
  const { id } = useParams();
  const articleId = id ? Number(id) : null;
  const nav = useNavigate();
  const [reviewDialog, setReviewDialog] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState({ busy: false, error: null });

  const load = useLoad(
    () => (articleId ? Api.article(articleId).then((r) => r.data) : Promise.resolve(null)),
    [articleId],
  );

  const done = (savedId) => (articleId ? nav(-1) : nav(`/news/${savedId}`, { replace: true }));

  const form = useForm({
    initial: { title: "", body: "", kind: "news", published: true, publishedAt: null },
    validate: (f) => {
      const errs = {};
      if (!f.title.trim()) errs.title = S.errorRequired;
      if (!f.body.trim()) errs.body = S.errorRequired;
      return errs;
    },
    submit: (f) => {
      // Published: keep the original date, or publish now. Draft: no date (Android ArticleFormViewModel).
      const published_at = f.published ? f.publishedAt || new Date().toISOString() : null;
      const body = { title: f.title.trim(), body: f.body.trim(), kind: f.kind, published_at };
      return articleId ? Api.updateArticle(articleId, body) : Api.createArticle(body);
    },
    onSuccess: (res) => {
      if (res.data.review_status === "pending" || !res.data.published_at) setReviewDialog(res.data.id);
      else {
        toast(S.saved);
        done(res.data.id);
      }
    },
  });
  const { values: f, set, errors, reset } = form;

  // Fill the form once the article to edit has loaded.
  const loaded = load.data;
  useEffect(() => {
    if (!loaded) return;
    reset({
      title: loaded.title,
      body: loaded.body,
      kind: loaded.kind,
      published: !!loaded.published_at,
      publishedAt: loaded.published_at,
    });
  }, [loaded, reset]);

  const remove = async () => {
    setConfirmDelete(false);
    setDeleting({ busy: true, error: null });
    try {
      await Api.deleteArticle(articleId);
      toast(S.deleted);
      // The article page under the form is gone too.
      nav("/news", { replace: true });
    } catch (error) {
      setDeleting({ busy: false, error });
    }
  };
  const busy = form.busy || deleting.busy;

  return (
    <>
      <FormPage
        title={articleId ? S.editArticle : S.addArticle}
        loading={!!articleId && load.loading && !load.data}
        loadError={load.error && !load.data ? load.error : null}
        onRetry={load.reload}
        error={form.error || deleting.error}
        submitting={busy}
        onSave={form.save}
        extra={
          articleId && (
            <DangerButton type="button" className="w-full" onClick={() => setConfirmDelete(true)} disabled={busy}>
              {S.delete}
            </DangerButton>
          )
        }
      >
        <FormField
          label={S.articleTitle}
          value={f.title}
          onChange={(e) => set({ title: e.target.value })}
          error={errors.title}
        />
        <div>
          <FieldLabel>{S.articleKind}</FieldLabel>
          <Segmented
            options={KINDS.map((k) => ({ value: k, label: S.kind[k] }))}
            selected={f.kind}
            onSelect={(k) => set({ kind: k })}
          />
        </div>
        {!articleId && <p className="text-sm text-muted">{S.articleReviewNote}</p>}
        <SwitchRow label={S.published} checked={f.published} onChange={(v) => set({ published: v })} />
        <TextArea
          label={S.articleBody}
          rows={10}
          value={f.body}
          onChange={(e) => set({ body: e.target.value })}
          error={errors.body}
        />
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
