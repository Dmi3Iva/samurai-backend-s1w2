import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { usersTestManager } from "./usersTestManager";
import { ROUTES, HOMEWORK_USER } from "./test.const";
import {
  createExpiredRefreshToken,
  getRefreshTokenFromSetCookie,
} from "./authRefreshTokenTestHelpers";
import {
  assertDeviceViewModel,
  decodeRefreshToken,
  deleteAllOtherDevices,
  deleteDevice,
  type DeviceViewModel,
  expectSameDeviceIds,
  getDevices,
  loginWithDevice,
  logoutDevice,
  refreshTokens,
} from "./devicesTestHelpers";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/105.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 12.0) Firefox/104.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) Safari/15.0",
] as const;

const SECOND_USER = {
  login: "lg-device2",
  password: "qwerty12",
  email: "lg-device2@example.com",
} as const;

describe("Homework 9 — Security Devices (swagger)", () => {
  beforeEach(async () => {
    await request(app).delete(`${ROUTES.testings}`);
  });

  it("should cover the recommended devices flow from the homework description", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const credentials = {
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    };

    const device1 = await loginWithDevice(credentials, {
      userAgent: USER_AGENTS[0],
    });
    const device2 = await loginWithDevice(credentials, {
      userAgent: USER_AGENTS[1],
    });
    const device3 = await loginWithDevice(credentials, {
      userAgent: USER_AGENTS[2],
    });
    const device4 = await loginWithDevice(credentials);

    const listResponse1 = await getDevices(device1.refreshToken);
    expect(listResponse1.status).toBe(200);

    const devicesBeforeRefresh = listResponse1.body as DeviceViewModel[];
    expect(devicesBeforeRefresh).toHaveLength(4);
    devicesBeforeRefresh.forEach(assertDeviceViewModel);

    const deviceIds = devicesBeforeRefresh.map((device) => device.deviceId);
    expect(deviceIds).toEqual(
      expect.arrayContaining([
        device1.deviceId,
        device2.deviceId,
        device3.deviceId,
        device4.deviceId,
      ]),
    );

    const device1Before = devicesBeforeRefresh.find(
      (device) => device.deviceId === device1.deviceId,
    );
    expect(device1Before).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const refreshResponse = await refreshTokens(device1.refreshToken);
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toEqual({
      accessToken: expect.any(String),
    });

    const refreshedToken = getRefreshTokenFromSetCookie(
      refreshResponse.headers["set-cookie"],
    );
    expect(refreshedToken).toBeTruthy();

    const refreshedPayload = decodeRefreshToken(refreshedToken!);
    expect(refreshedPayload.deviceId).toBe(device1.deviceId);

    const listResponse2 = await getDevices(refreshedToken!);
    expect(listResponse2.status).toBe(200);

    const devicesAfterRefresh = listResponse2.body as DeviceViewModel[];
    expectSameDeviceIds(devicesBeforeRefresh, devicesAfterRefresh);

    const device1After = devicesAfterRefresh.find(
      (device) => device.deviceId === device1.deviceId,
    );
    expect(device1After).toBeDefined();
    expect(device1After!.lastActiveDate).not.toBe(device1Before!.lastActiveDate);

    const deleteDevice2Response = await deleteDevice(
      refreshedToken!,
      device2.deviceId,
    );
    expect(deleteDevice2Response.status).toBe(204);

    const listResponse3 = await getDevices(refreshedToken!);
    expect(listResponse3.status).toBe(200);
    const devicesAfterDelete2 = listResponse3.body as DeviceViewModel[];
    expect(devicesAfterDelete2).toHaveLength(3);
    expect(
      devicesAfterDelete2.map((device) => device.deviceId),
    ).not.toContain(device2.deviceId);

    const logoutDevice3Response = await logoutDevice(device3.refreshToken);
    expect(logoutDevice3Response.status).toBe(204);

    const listResponse4 = await getDevices(refreshedToken!);
    expect(listResponse4.status).toBe(200);
    const devicesAfterLogout3 = listResponse4.body as DeviceViewModel[];
    expect(devicesAfterLogout3).toHaveLength(2);
    expect(
      devicesAfterLogout3.map((device) => device.deviceId),
    ).not.toContain(device3.deviceId);

    const deleteOthersResponse = await deleteAllOtherDevices(refreshedToken!);
    expect(deleteOthersResponse.status).toBe(204);

    const listResponse5 = await getDevices(refreshedToken!);
    expect(listResponse5.status).toBe(200);
    const remainingDevices = listResponse5.body as DeviceViewModel[];
    expect(remainingDevices).toHaveLength(1);
    expect(remainingDevices[0].deviceId).toBe(device1.deviceId);
  });

  it("GET /security/devices: should return 401 without refreshToken cookie", async () => {
    const response = await request(app).get(`${ROUTES.securityDevices}`);
    expect(response.status).toBe(401);
  });

  it("GET /security/devices: should return 401 with expired refreshToken", async () => {
    const user = await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const expiredRefreshToken = createExpiredRefreshToken(user.id);
    const response = await getDevices(expiredRefreshToken);
    expect(response.status).toBe(401);
  });

  it("DELETE /security/devices/{deviceId}: should return 401 without refreshToken cookie", async () => {
    const response = await request(app).delete(
      `${ROUTES.securityDevices}/some-device-id`,
    );
    expect(response.status).toBe(401);
  });

  it("DELETE /security/devices/{deviceId}: should return 404 for non-existing deviceId", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const session = await loginWithDevice({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    const response = await deleteDevice(
      session.refreshToken,
      "non-existing-device-id",
    );
    expect(response.status).toBe(404);
  });

  it("DELETE /security/devices/{deviceId}: should return 403 when deleting another user's device", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });
    await usersTestManager.createEntity({
      login: SECOND_USER.login,
      password: SECOND_USER.password,
      email: SECOND_USER.email,
    });

    const user1Session = await loginWithDevice({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });
    const user2Session = await loginWithDevice({
      loginOrEmail: SECOND_USER.login,
      password: SECOND_USER.password,
    });

    const response = await deleteDevice(
      user1Session.refreshToken,
      user2Session.deviceId,
    );
    expect(response.status).toBe(403);
  });

  it("login without User-Agent should still create a device with non-empty title", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const session = await loginWithDevice({
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    });

    const listResponse = await getDevices(session.refreshToken);
    expect(listResponse.status).toBe(200);

    const devices = listResponse.body as DeviceViewModel[];
    expect(devices).toHaveLength(1);
    assertDeviceViewModel(devices[0]);
    expect(devices[0].deviceId).toBe(session.deviceId);
  });

  it("login with X-Forwarded-For should store that IP on the device", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const forwardedIp = "203.0.113.50";
    const session = await loginWithDevice(
      {
        loginOrEmail: HOMEWORK_USER.login,
        password: HOMEWORK_USER.password,
      },
      { userAgent: USER_AGENTS[0], ip: forwardedIp },
    );

    const listResponse = await getDevices(session.refreshToken);
    expect(listResponse.status).toBe(200);

    const devices = listResponse.body as DeviceViewModel[];
    expect(devices).toHaveLength(1);
    expect(devices[0].ip).toBe(forwardedIp);
  });

  it("DELETE /security/devices: should return 401 without refreshToken cookie", async () => {
    const response = await request(app).delete(`${ROUTES.securityDevices}`);
    expect(response.status).toBe(401);
  });

  it("DELETE /security/devices: should keep only current device", async () => {
    await usersTestManager.createEntity({
      login: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
      email: HOMEWORK_USER.email,
    });

    const credentials = {
      loginOrEmail: HOMEWORK_USER.login,
      password: HOMEWORK_USER.password,
    };

    const device1 = await loginWithDevice(credentials, {
      userAgent: USER_AGENTS[0],
    });
    await loginWithDevice(credentials, { userAgent: USER_AGENTS[1] });
    await loginWithDevice(credentials, { userAgent: USER_AGENTS[2] });

    const deleteResponse = await deleteAllOtherDevices(device1.refreshToken);
    expect(deleteResponse.status).toBe(204);

    const listResponse = await getDevices(device1.refreshToken);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toEqual([
      expect.objectContaining({ deviceId: device1.deviceId }),
    ]);
  });
});
