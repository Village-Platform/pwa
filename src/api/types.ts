// Shapes of the API's JSON (docs/engineering/api-reference.md). Fields the web app never reads are
// left out; add them when a screen needs them.

/** `{ data }` for one record, `{ data, meta }` for a page. */
export interface Envelope<T> {
  data: T;
  meta?: PageMeta;
}
export interface PageMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  /** Notifications only. */
  unread_count?: number;
  /** After a password change: the only token that still works. */
  token?: string;
}
export type Page<T> = Envelope<T[]>;

export type Role = "user" | "firm_admin" | "admin" | "super_admin";

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
  created_at?: string;
}

/** Fields of `PATCH /me`. */
export interface UserUpdate {
  name?: string;
  phone?: string;
  email?: string | null;
  password?: string;
  password_confirmation?: string;
  /** Required only when the phone changes. */
  current_password?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  icon: string | null;
  icon_url: string | null;
  position?: number;
  active?: boolean;
}

export type FirmStatus = "pending" | "active" | "suspended";

/** What the server lets the caller do with a record. A UI hint: the policy decides every request. */
export interface FirmCan {
  update: boolean;
  destroy: boolean;
  moderate: boolean;
  review: boolean;
}

export interface Firm {
  id: number;
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: string | null;
  status: FirmStatus;
  rejection_reason: string | null;
  owner_id: number;
  category: Pick<Category, "id" | "name" | "icon" | "icon_url">;
  created_at: string;
  can?: Partial<FirmCan>;
}

/** The body of create / update. Nulls are sent on purpose: a cleared field is cleared on the server. */
export interface FirmInput {
  category_id: number | null;
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: string | null;
  /** Super admins only. */
  status?: FirmStatus;
}

export type ArticleKind = "news" | "article" | "announcement";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Article {
  id: number;
  title: string;
  body: string;
  kind: ArticleKind;
  published_at: string | null;
  review_status: ReviewStatus;
  rejection_reason: string | null;
  created_at?: string;
  author: { id: number; name: string };
  can?: { update?: boolean; destroy?: boolean; review?: boolean };
}

export interface ArticleInput {
  title: string;
  body: string;
  kind: ArticleKind;
  published_at: string | null;
}

export interface AppNotification {
  id: number;
  kind: string;
  title: string;
  body: string;
  data?: { screen?: string; id?: number | string; [key: string]: unknown };
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Topic {
  key: string;
  name?: string;
  title?: string;
  description?: string | null;
  subscribed?: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string | null;
  price_cents: number;
  duration_days: number;
  max_firms: number;
}

export interface PaymentMethod {
  key: string;
  name: string;
  account: string | null;
}

/** `status` is what is stored; `state` is derived from the dates. */
export type SubscriptionState = "pending" | "rejected" | "scheduled" | "current" | "expired";

export interface Subscription {
  id: number;
  status: "pending" | "active" | "rejected";
  state: SubscriptionState;
  plan: Pick<SubscriptionPlan, "id" | "name" | "duration_days" | "max_firms">;
  payment_method: string;
  amount_cents: number;
  currency?: string;
  transaction_reference: string;
  payer_phone: string | null;
  notes: string | null;
  has_payment_screenshot: boolean;
  days_left: number | null;
  starts_at: string | null;
  ends_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface AppConfig {
  features: Record<string, boolean>;
}
