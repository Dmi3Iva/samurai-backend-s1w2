import { WithId } from "mongodb";

export interface IRefreshTokenBlackList {
  userId: string;
  refreshToken: string;
  addedAt: Date;
  expiresAt: Date;
}
