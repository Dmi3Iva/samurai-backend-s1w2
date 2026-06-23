import { REFRESH_COOKIE_NAME } from "../src/consants/cookies.const";

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

  return Number(maxAgePart.split("=")[1]) * 1000;
};

export const refreshTokenCookieHeader = (refreshToken: string) => ({
  Cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}`,
});
