import { ROUTES as APP_ROUTES } from "../src/consants/routes.conts";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret-for-vitest";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "test-jwt-refresh-secret-for-vitest";

export const ADMIN_AUTH_HEADER = {
  Authorization: "Basic YWRtaW46cXdlcnR5",
};

export const ROUTES = {
  ...APP_ROUTES,
  comments: "/comments",
};

export const VALID_COMMENT_CONTENT =
  "This is a valid comment with enough characters";

/** Credentials pattern used by the remote homework checker (login-V2-describe) */
export const HOMEWORK_USER = {
  login: "lg-964870",
  password: "qwerty1",
  email: "lg964870@example.com",
} as const;

/**
 * Resend rejects fake domains like example.com with "550 Invalid `to` field",
 * so every email that is really sent must use a resend.dev test address.
 * Labels after `+` keep addresses unique per scenario.
 */
export const deliveredTestEmail = (label: string) =>
  `delivered+${label}@resend.dev`;

/** User for h07 self-registration flow tests */
export const REGISTRATION_USER = {
  login: "reg-user",
  password: "qwerty12",
  email: deliveredTestEmail("reg-user"),
} as const;

/** User for h10 password recovery flow (email must be resend.dev — recovery sends mail) */
export const PASSWORD_RECOVERY_USER = {
  login: "pwd-rec",
  password: "qwerty12",
  email: deliveredTestEmail("pwd-rec"),
} as const;

export const bearerAuthHeader = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});
