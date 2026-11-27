import { api } from "./client";
import type { Envelope, Page, PaymentMethod, Subscription, SubscriptionPlan } from "./types";

export interface SubscribeInput {
  planId: number;
  method: string;
  reference: string;
  payerPhone?: string;
}

// Plans and payments (behind the `plans` feature flag).
export const plans = {
  plans: () => api<Page<SubscriptionPlan>>("subscription_plans"),
  paymentMethods: () => api<Page<PaymentMethod>>("payment_methods"),
  subscriptions: ({ page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}) =>
    api<Page<Subscription>>("subscriptions", { query: { page, per_page: perPage } }),
  subscribe: ({ planId, method, reference, payerPhone }: SubscribeInput) =>
    api<Envelope<Subscription>>("subscriptions", {
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
