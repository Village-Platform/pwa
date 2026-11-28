import { api } from "./client";
import type { Article, ArticleInput, Envelope, Firm, FirmInput, FirmStatus, Page } from "./types";

type Paging = { page?: number; perPage?: number };

// Owners (and reviewers): firms and articles. Nulls are sent on purpose so a cleared field is
// cleared on the server.
export const owner = {
  myFirms: ({ page = 1, perPage = 20 }: Paging = {}) =>
    api<Page<Firm>>("firms", { query: { mine: "true", page, per_page: perPage } }),
  createFirm: (firm: FirmInput) => api<Envelope<Firm>>("firms", { method: "POST", body: { firm } }),
  updateFirm: (id: number, firm: FirmInput) => api<Envelope<Firm>>(`firms/${id}`, { method: "PATCH", body: { firm } }),
  setFirmStatus: (id: number, status: FirmStatus) =>
    api<Envelope<Firm>>(`firms/${id}`, { method: "PATCH", body: { firm: { status } } }),
  deleteFirm: (id: number) => api<null>(`firms/${id}`, { method: "DELETE" }),
  createArticle: (article: ArticleInput) => api<Envelope<Article>>("articles", { method: "POST", body: { article } }),
  updateArticle: (id: number, article: ArticleInput) =>
    api<Envelope<Article>>(`articles/${id}`, { method: "PATCH", body: { article } }),
  deleteArticle: (id: number) => api<null>(`articles/${id}`, { method: "DELETE" }),
};
