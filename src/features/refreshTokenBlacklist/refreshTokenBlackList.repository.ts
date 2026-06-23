import { refreshTokensBlacklistDatabase } from "../../repositories/db";

export interface IAddRefreshTokenPayload {
  userId: string;
  refreshToken: string;
  addedAt: Date;
  expiresAt: Date;
}

export const refreshTokenBlackListRepository = {
  async addRefreshToken(
    addRefreshTokenPayload: IAddRefreshTokenPayload,
  ): Promise<boolean> {
    try {
      await refreshTokensBlacklistDatabase.insertOne(addRefreshTokenPayload);
      return true;
    } catch (e) {
      return false;
    }
  },
  async isBlackList(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const result = await refreshTokensBlacklistDatabase.findOne({
        refreshToken,
        userId,
      });
      return !!result;
    } catch (e) {
      return false;
    }
  },
  async removeAll(): Promise<boolean> {
    try {
      const result = await refreshTokensBlacklistDatabase.deleteMany({});
      return true;
    } catch (e) {
      return false;
    }
  },
};
