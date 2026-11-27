import { api } from "./client";
import type { Article, Category, Envelope, Firm, Page } from "./types";

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
    api<Page<Article>>("articles", { query: { kind, page, per_page: perPage } }),
  article: (id: number | string) => api<Envelope<Article>>(`articles/${id}`),
};
