import { emailService } from "../../auth/adapters/email.service";
import { ICreateRegistrationDataBaseBody } from "../users/models/users.model";
import { usersRepository } from "../users/users.repository";
import { usersService } from "../users/users.service";
import { encryptPassword } from "../users/utils/encrpypt-password";
import { IRegistrationBody } from "./types/auth.router";
import { add } from "date-fns";
import { EAuthRegistrationSTATUS } from "./constants/auth.service.const";
import { authRepository } from "./repository/auth.repository";
import { IAuthType } from "./models/auth.model";
import { appConfig } from "../../common/appConfig";
import { jwtService } from "../../auth/adapters/jwt.service";
import { authRouter } from "./auth.router";
import { authDatabase } from "../../repositories/db";

export const authService = {
  async registerUser(
    registerBody: IRegistrationBody,
  ): Promise<EAuthRegistrationSTATUS> {
    const confirmationCode = crypto.randomUUID();
    const expirationDate = add(new Date(), { minutes: 15, seconds: 0 });
    const createdAt = new Date();
    const password = await encryptPassword(registerBody.password);

    const { login, email } = registerBody;

    const isLoginUnique = await usersService.isUniqueLogin(login);
    const isEmailUnique = await usersService.isUniqueEmail(email);
    if (!isLoginUnique) return EAuthRegistrationSTATUS.LOGIN_ERROR;
    if (!isEmailUnique) return EAuthRegistrationSTATUS.EMAIL_ERROR;

    const registrationDataBaseBody: ICreateRegistrationDataBaseBody = {
      login,
      password,
      email,
      createdAt,
      emailConfirmation: {
        confirmationCode,
        expirationDate,
        isConfirmed: false,
      },
    };

    const id = await usersRepository.createRegistrationUser(
      registrationDataBaseBody,
    );

    if (!id) {
      return EAuthRegistrationSTATUS.COMMON_ERROR;
    }

    const result = await emailService.sendRegistrationConfirmationEmail({
      toEmail: email,
      confirmationCode,
    });

    return result
      ? EAuthRegistrationSTATUS.OK
      : EAuthRegistrationSTATUS.SEND_EMAIL_ERROR;
  },

  async confirmRegistration(code: string) {
    const user = await usersRepository.findUserByConfirmationCode(code);

    if (!user) return false;

    const emailConfirmation = user?.emailConfirmation;
    const isCodeExpired =
      emailConfirmation?.expirationDate &&
      emailConfirmation?.expirationDate < new Date();
    const isCodeAlreadyApplied = emailConfirmation?.isConfirmed;
    if (isCodeAlreadyApplied) return false;
    if (isCodeExpired) return false;

    const result = await usersRepository.confirmRegistrationByUserId(
      user._id.toString(),
    );

    return result;
  },

  async registrationEmailResending(email: string): Promise<boolean> {
    const user = await usersRepository.findUserByEmail(email, {
      fullMapping: true,
    });
    if (!user) return false;
    if (user.user.emailConfirmation?.isConfirmed) return false;
    const confirmationCode = crypto.randomUUID();

    const updatedConfirmationCode =
      await usersRepository.updateConfirmRegistrationByUserId(
        user.user.id,
        confirmationCode,
      );
    if (!updatedConfirmationCode) return false;

    const result = await emailService.sendRegistrationConfirmationEmail({
      toEmail: user.user.email,
      confirmationCode,
    });

    return result;
  },

  /**
   * Регистрирует сессию пользователя и отдаёт токены access and refresh
   * @param userId
   * @returns array, where first element - AccessToken, second element - RefreshToken
   */
  async registerSession({
    userId,
    deviceName,
    ip,
  }: {
    userId: string;
    deviceName: string;
    ip: string;
  }): Promise<[string, string] | null> {
    const iat = new Date();
    const refreshTokenExpTime = Number(appConfig.RT_TIME) / 1000;
    const exp = add(iat, { seconds: refreshTokenExpTime });
    const deviceId = crypto.randomUUID();
    const createSessionPayload: IAuthType = {
      userId,
      deviceName,
      deviceId,
      iat,
      ip,
      exp,
    };
    const res = await authRepository.createSession(createSessionPayload);
    if (res) {
      return jwtService.createTokensPair({
        userId,
        deviceId,
        iat,
      });
    } else {
      return null;
    }
  },

  async removeSession(payload: {
    userId: string;
    deviceId: string;
    iat: string;
  }) {
    const databasePayload = {
      userId: payload.userId,
      deviceId: payload.deviceId,
      iat: new Date(payload.iat),
    };
    return authRepository.removeSession(databasePayload);
  },

  async updateSession(
    payload: {
      userId: string;
      deviceId: string;
      iat: string;
      ip: string;
      deviceName: string;
    },
    refreshToken: string,
  ): Promise<[string, string] | null> {
    const isRefreshTokenValid = jwtService.verifyRefreshToken(refreshToken);
    if (!isRefreshTokenValid) return null;
    const dataBasePayload = { ...payload, iat: new Date(payload.iat) };
    const session = await authRepository.getSession(dataBasePayload);

    if (!session) return null;

    const newIat = new Date();
    await authRepository.updateSession(dataBasePayload, newIat);

    return jwtService.createTokensPair({
      userId: dataBasePayload.userId,
      deviceId: dataBasePayload.deviceId,
      iat: newIat,
    });
  },

  async getUserSessions(userId: string) {
    return await authRepository.getSessions(userId);
  },
};
