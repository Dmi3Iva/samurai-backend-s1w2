import { ROUTES as APP_ROUTES } from "../src/consants/routes.conts";

process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret-for-vitest";

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

export const bearerAuthHeader = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});
