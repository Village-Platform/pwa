import { api } from "./client";
import type { Article, Category, Envelope, Firm, Page } from "./types";

/**
 * Published = approved and published_at in the past (rule R5). The server already sends only these to
 * guests and users, but reviewers get every article from GET /articles (drafts, pending, rejected,
 * scheduled), which must not show up in the public News and Home feeds.
 */
export const isPublished = (a: Pick<Article, "review_status" | "published_at">, now = Date.now()) =>
  // A reply without review_status (only reviewers need the filter) is taken as approved, so the
  // feed never empties because of a missing field.
  (a.review_status ?? "approved") === "approved" && !!a.published_at && new Date(a.published_at).getTime() <= now;

// Public reading: categories, firms, articles. Works for guests.
export const catalog = {
  categories: () => api<Page<Category>>("categories", { query: { per_page: 50 } }),
  firms: ({
    q,
    categoryId,
    page = 1,
    perPage = 20,
  }: { q?: string; categoryId?: number | null; page?: number; perPage?: number } = {}) =>
    api<Page<Firm>>("firms", { query: { q, category_id: categoryId, page, per_page: perPage } }),
  firm: (id: number | string) => api<Envelope<Firm>>(`firms/${id}`),
  articles: ({ kind, page = 1, perPage = 20 }: { kind?: string | null; page?: number; perPage?: number } = {}) =>
    api<Page<Article>>("articles", { query: { kind, page, per_page: perPage } }).then((res) => ({
      ...res,
      data: res.data.filter((a) => isPublished(a)),
    })),
  article: (id: number | string) => api<Envelope<Article>>(`articles/${id}`),
};
