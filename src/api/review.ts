import { api } from "./client";
import type { Article, Envelope, Firm, Page } from "./types";

type Paging = { page?: number; perPage?: number };

// Reviewers (admin, super_admin): the pending queues and the decisions. The server's `can.review`
// on each record says whether to show these controls; the policy still decides every request.
export const review = {
  pendingFirms: ({ page = 1, perPage = 20 }: Paging = {}) =>
    api<Page<Firm>>("firms", { query: { review: "pending", page, per_page: perPage } }),
  pendingArticles: ({ page = 1, perPage = 20 }: Paging = {}) =>
    api<Page<Article>>("articles", { query: { review: "pending", page, per_page: perPage } }),
  approveFirm: (id: number) => api<Envelope<Firm>>(`firms/${id}/approve`, { method: "PATCH" }),
  rejectFirm: (id: number, reason: string) =>
    api<Envelope<Firm>>(`firms/${id}/reject`, { method: "PATCH", body: { reason } }),
  approveArticle: (id: number) => api<Envelope<Article>>(`articles/${id}/approve`, { method: "PATCH" }),
  rejectArticle: (id: number, reason: string) =>
    api<Envelope<Article>>(`articles/${id}/reject`, { method: "PATCH", body: { reason } }),
};
