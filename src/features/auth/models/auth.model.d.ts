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

/** JWT payload. Do not put Date into reserved claim `iat` — jsonwebtoken requires seconds. */
export type ITokenPayload = {
  userId: string;
  deviceId: string;
  /** ISO string of session issue date; must match session.iat in DB */
  issuedAt: string;
};
