import { expect } from "vitest";

/**
 * Mimics remote checker jest state (usersState.getAccessToken).
 * Comments homework tests fail with "accessToken is undefined" when login returns 500.
 */
let accessToken: string | undefined;

export const homeworkState = {
  setAccessToken(token: string) {
    accessToken = token;
  },

  clearAccessToken() {
    accessToken = undefined;
  },

  getAccessToken(): string {
    expect(accessToken).not.toBeUndefined();
    return accessToken as string;
  },
};
