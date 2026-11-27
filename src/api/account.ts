import { api } from "./client";
import type { AuthResult, Envelope, User } from "./types";

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  password_confirmation: string;
}

// Sign-in and the signed-in user's own account.
export const account = {
  login: (phone: string, password: string) =>
    api<Envelope<AuthResult>>("auth/login", { method: "POST", body: { phone, password } }),
  register: (user: RegisterInput) => api<Envelope<AuthResult>>("auth/register", { method: "POST", body: { user } }),
  me: () => api<Envelope<User>>("me"),
  changePassword: (password: string, password_confirmation: string) =>
    api<Envelope<User>>("me", { method: "PATCH", body: { user: { password, password_confirmation } } }),
  deleteAccount: (password: string) => api<null>("me", { method: "DELETE", body: { password } }),
};
