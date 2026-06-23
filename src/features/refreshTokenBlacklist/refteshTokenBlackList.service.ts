import { add } from "date-fns";
import {
  IAddRefreshTokenPayload,
  refreshTokenBlackListRepository,
} from "./refreshTokenBlackList.repository";
import { appConfig } from "../../common/appConfig";
import { jwtService } from "../../auth/adapters/jwt.service";

export const refreshTokenBlackListService = {
  async addToken(userId: string, refreshToken: string): Promise<boolean> {
    const expiresTime = appConfig.RT_TIME;

    const addedAt = new Date();
    const expiresAt = add(addedAt, { seconds: Number(expiresTime) });
    const payload: IAddRefreshTokenPayload = {
      userId,
      refreshToken,
      addedAt,
      expiresAt,
    };

    return await refreshTokenBlackListRepository.addRefreshToken(payload);
  },
  async isBlackListToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    return await refreshTokenBlackListRepository.isBlackList(
      userId,
      refreshToken,
    );
  },
  async updateTokens(
    userId: string,
    refreshToken: string,
  ): Promise<[string, string] | null> {
    const isRefreshTokenValid = jwtService.verifyRefreshToken(refreshToken);
    if (!isRefreshTokenValid) return null;
    const isRevokedToken = await this.isBlackListToken(userId, refreshToken);
    if (isRevokedToken) return null;

    await this.addToken(userId, refreshToken);

    return jwtService.createTokensPair(userId);
  },
};
