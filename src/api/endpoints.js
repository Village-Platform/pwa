import { api } from "./client.js";

// Every call the web app makes. Same endpoints, params and bodies as the Android AghourApi.kt and
// its repositories: nothing new on the server, so the shipped Android app and this app share one
// contract.
export const Api = {
  // Catalog
  categories: () => api("categories", { query: { per_page: 50 } }),
  firms: ({ q, categoryId, page = 1, perPage = 20 } = {}) =>
    api("firms", { query: { q, category_id: categoryId, page, per_page: perPage } }),
  firm: (id) => api(`firms/${id}`),
  articles: ({ kind, page = 1, perPage = 20 } = {}) => api("articles", { query: { kind, page, per_page: perPage } }),
  article: (id) => api(`articles/${id}`),

  // Auth / account
  login: (phone, password) => api("auth/login", { method: "POST", body: { phone, password } }),
  register: (user) => api("auth/register", { method: "POST", body: { user } }),
  me: () => api("me"),
  changePassword: (password, password_confirmation) =>
    api("me", { method: "PATCH", body: { user: { password, password_confirmation } } }),
  deleteAccount: (password) => api("me", { method: "DELETE", body: { password } }),

  // Notifications (the user's inbox, or this install's guest inbox via X-Installation-Id)
  notifications: ({ page = 1, perPage = 30 } = {}) => api("notifications", { query: { page, per_page: perPage } }),
  readNotification: (id) => api(`notifications/${id}/read`, { method: "PATCH" }),
  readAllNotifications: () => api("notifications/read_all", { method: "PATCH" }),

  // Owners: firms and articles. Nulls are sent on purpose so a cleared field is cleared on the server.
  myFirms: ({ page = 1, perPage = 20 } = {}) => api("firms", { query: { mine: "true", page, per_page: perPage } }),
  createFirm: (firm) => api("firms", { method: "POST", body: { firm } }),
  updateFirm: (id, firm) => api(`firms/${id}`, { method: "PATCH", body: { firm } }),
  setFirmStatus: (id, status) => api(`firms/${id}`, { method: "PATCH", body: { firm: { status } } }),
  deleteFirm: (id) => api(`firms/${id}`, { method: "DELETE" }),
  createArticle: (article) => api("articles", { method: "POST", body: { article } }),
  updateArticle: (id, article) => api(`articles/${id}`, { method: "PATCH", body: { article } }),
  deleteArticle: (id) => api(`articles/${id}`, { method: "DELETE" }),

  // Plans and payments (behind the `plans` feature flag)
  plans: () => api("subscription_plans"),
  paymentMethods: () => api("payment_methods"),
  subscriptions: ({ page = 1, perPage = 20 } = {}) => api("subscriptions", { query: { page, per_page: perPage } }),
  subscribe: ({ planId, method, reference, payerPhone }) =>
    api("subscriptions", {
      method: "POST",
      body: {
        subscription: {
          subscription_plan_id: planId,
          payment_method: method,
          transaction_reference: reference.trim(),
          payer_phone: payerPhone?.trim() || undefined,
        },
      },
    }),
};
