import { expect } from "vitest";
import request, { type Response } from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app";
import { appConfig } from "../src/common/appConfig";
import { ROUTES } from "./test.const";
import {
  getRefreshTokenFromSetCookie,
  refreshTokenCookieHeader,
} from "./authRefreshTokenTestHelpers";

export type DeviceViewModel = {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
};

export type LoginCredentials = {
  loginOrEmail: string;
  password: string;
};

export type DeviceSession = {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
};

export const assertDeviceViewModel = (device: DeviceViewModel) => {
  expect(device).toEqual({
    ip: expect.any(String),
    title: expect.any(String),
    lastActiveDate: expect.any(String),
    deviceId: expect.any(String),
  });
  expect(device.ip.length).toBeGreaterThan(0);
  expect(device.title.length).toBeGreaterThan(0);
  expect(device.deviceId.length).toBeGreaterThan(0);
  expect(Number.isNaN(Date.parse(device.lastActiveDate))).toBe(false);
};

export const decodeRefreshToken = (
  refreshToken: string,
): { userId: string; deviceId: string } => {
  const decoded = jwt.verify(
    refreshToken,
    appConfig.JWT_REFRESH_SECRET,
  ) as jwt.JwtPayload & { userId: string; deviceId: string };

  expect(decoded.userId).toEqual(expect.any(String));
  expect(decoded.deviceId).toEqual(expect.any(String));

  return { userId: decoded.userId, deviceId: decoded.deviceId };
};

export const loginWithDevice = async (
  credentials: LoginCredentials,
  options?: { userAgent?: string; ip?: string },
): Promise<DeviceSession> => {
  let req = request(app).post(`${ROUTES.auth}/login`).send(credentials);

  if (options?.userAgent !== undefined) {
    req = req.set("User-Agent", options.userAgent);
  }

  if (options?.ip) {
    req = req.set("X-Forwarded-For", options.ip);
  }

  const response = await req;

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ accessToken: expect.any(String) });

  const refreshToken = getRefreshTokenFromSetCookie(
    response.headers["set-cookie"],
  );
  expect(refreshToken).toBeTruthy();

  const { deviceId } = decodeRefreshToken(refreshToken!);

  return {
    accessToken: response.body.accessToken,
    refreshToken: refreshToken!,
    deviceId,
  };
};

export const getDevices = async (refreshToken: string): Promise<Response> => {
  return request(app)
    .get(`${ROUTES.securityDevices}`)
    .set(refreshTokenCookieHeader(refreshToken));
};

export const deleteDevice = async (
  refreshToken: string,
  deviceId: string,
): Promise<Response> => {
  return request(app)
    .delete(`${ROUTES.securityDevices}/${deviceId}`)
    .set(refreshTokenCookieHeader(refreshToken));
};

export const deleteAllOtherDevices = async (
  refreshToken: string,
): Promise<Response> => {
  return request(app)
    .delete(`${ROUTES.securityDevices}`)
    .set(refreshTokenCookieHeader(refreshToken));
};

export const refreshTokens = async (refreshToken: string): Promise<Response> => {
  return request(app)
    .post(`${ROUTES.auth}/refresh-token`)
    .set(refreshTokenCookieHeader(refreshToken));
};

export const logoutDevice = async (refreshToken: string): Promise<Response> => {
  return request(app)
    .post(`${ROUTES.auth}/logout`)
    .set(refreshTokenCookieHeader(refreshToken));
};

export const expectSameDeviceIds = (
  before: DeviceViewModel[],
  after: DeviceViewModel[],
) => {
  expect(after).toHaveLength(before.length);
  expect(after.map((device) => device.deviceId).sort()).toEqual(
    before.map((device) => device.deviceId).sort(),
  );
};
