import { expect } from "vitest";
import jwt from "jsonwebtoken";
import { REFRESH_COOKIE_NAME } from "../src/consants/cookies.const";
import { appConfig } from "../src/common/appConfig";

export const parseSetCookieHeader = (
  setCookieHeader: string[] | undefined,
): Record<string, string> => {
  if (!setCookieHeader?.length) {
    return {};
  }

  return setCookieHeader.reduce<Record<string, string>>((acc, cookieString) => {
    const [nameValue] = cookieString.split(";");
    const separatorIndex = nameValue.indexOf("=");
    const name = nameValue.slice(0, separatorIndex);
    const value = nameValue.slice(separatorIndex + 1);
    acc[name] = value;
    return acc;
  }, {});
};

export const getRefreshTokenFromSetCookie = (
  setCookieHeader: string[] | undefined,
): string | undefined => {
  const cookies = parseSetCookieHeader(setCookieHeader);
  return cookies[REFRESH_COOKIE_NAME];
};

export const getMaxAgeFromSetCookie = (
  setCookieHeader: string[] | undefined,
): number | undefined => {
  const refreshCookieString = setCookieHeader?.find((cookieString) =>
    cookieString.startsWith(`${REFRESH_COOKIE_NAME}=`),
  );

  if (!refreshCookieString) {
    return undefined;
  }

  const maxAgePart = refreshCookieString
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("max-age="));

  if (!maxAgePart) {
    return undefined;
  }

  return Number(maxAgePart.split("=")[1]);
};

/** Max-Age from Set-Cookie header converted to milliseconds */
export const getMaxAgeMsFromSetCookie = (
  setCookieHeader: string[] | undefined,
): number | undefined => {
  const maxAgeSeconds = getMaxAgeFromSetCookie(setCookieHeader);
  return maxAgeSeconds === undefined ? undefined : maxAgeSeconds * 1000;
};

export const getAccessTokenLifetimeMs = (): number => Number(appConfig.AC_TIME);

export const getRefreshTokenLifetimeMs = (): number => Number(appConfig.RT_TIME);

export const refreshTokenCookieHeader = (refreshToken: string) => ({
  Cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}`,
});

export const getRefreshCookieString = (
  setCookieHeader: string[] | undefined,
): string | undefined => {
  return setCookieHeader?.find((cookieString) =>
    cookieString.startsWith(`${REFRESH_COOKIE_NAME}=`),
  );
};

export const assertRefreshCookieIsHttpOnlyAndSecure = (
  setCookieHeader: string[] | undefined,
) => {
  const refreshCookie = getRefreshCookieString(setCookieHeader);
  expect(refreshCookie).toBeTruthy();
  expect(refreshCookie!.toLowerCase()).toContain("httponly");

  // checker runs on HTTPS with NODE_ENV=production
  if (process.env.NODE_ENV === "production") {
    expect(refreshCookie!.toLowerCase()).toContain("secure");
  }
};

export const createExpiredAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, appConfig.JWT_SECRET, { expiresIn: -1 });
};

export const createExpiredRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, appConfig.JWT_REFRESH_SECRET, { expiresIn: -1 });
};

export const waitForTokenExpiration = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds + 200));
};
