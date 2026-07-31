export interface IAuthType {
  userId: string;
  deviceId: string;
  iat: Date;
  deviceName: string;
  ip: string;
  exp: Date;
}

export interface ISecurityDevice {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
}

export type ITokenPayload = Pick<IAuthType, "userId" | "iat" | "deviceId">;
