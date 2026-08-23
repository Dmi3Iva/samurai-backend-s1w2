import { emailService } from "../../auth/adapters/email.service";
import { ICreateRegistrationDataBaseBody } from "../users/models/user-types";
import { UsersService } from "../users/users.service";
import { encryptPassword } from "../users/utils/encrpypt-password";
import { IRegistrationBody } from "./types/auth.router";
import { add } from "date-fns";
import { EAuthRegistrationSTATUS } from "./constants/auth.service.const";
import { AuthRepository } from "./auth.repository";
import { IAuthType } from "./models/auth.model";
import { appConfig } from "../../common/appConfig";
import { jwtService } from "../../auth/adapters/jwt.service";
import { ERemoveSingleUserSessionState } from "./models/auth.constants";
import { UsersRepository } from "../users/users.repository";
import { inject, injectable } from "inversify";

@injectable()
export class AuthService {
  constructor(
    @inject(AuthRepository)
    private authRepository: AuthRepository,
    @inject(UsersService)
    private usersService: UsersService,
    @inject(UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async registerUser(
    registerBody: IRegistrationBody,
  ): Promise<EAuthRegistrationSTATUS> {
    const confirmationCode = crypto.randomUUID();
    const expirationDate = add(new Date(), { minutes: 15, seconds: 0 });
    const createdAt = new Date();
    const password = await encryptPassword(registerBody.password);

    const { login, email } = registerBody;

    const isLoginUnique = await this.usersService.isUniqueLogin(login);
    const isEmailUnique = await this.usersService.isUniqueEmail(email);

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

    const id = await this.usersRepository.createRegistrationUser(
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
  }

  async confirmRegistration(code: string) {
    const user = await this.usersRepository.findUserByConfirmationCode(code);

    if (!user) return false;

    const emailConfirmation = user?.emailConfirmation;
    const isCodeExpired =
      emailConfirmation?.expirationDate &&
      emailConfirmation?.expirationDate < new Date();
    const isCodeAlreadyApplied = emailConfirmation?.isConfirmed;
    if (isCodeAlreadyApplied) return false;
    if (isCodeExpired) return false;

    const result = await this.usersRepository.confirmRegistrationByUserId(
      user._id.toString(),
    );

    return result;
  }

  async registrationEmailResending(email: string): Promise<boolean> {
    const user = await this.usersRepository.findUserByEmail(email);
    if (!user) return false;
    if (user.emailConfirmation?.isConfirmed) return false;
    // TODO:: add user method updatedConfirmationCode
    const confirmationCode = crypto.randomUUID();

    const updatedConfirmationCode =
      await this.usersRepository.updateConfirmRegistrationByUserId(
        user.id,
        confirmationCode,
      );

    if (!updatedConfirmationCode) return false;

    const result = await emailService.sendRegistrationConfirmationEmail({
      toEmail: user.email,
      confirmationCode,
    });

    return result;
  }

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
    const res = await this.authRepository.createSession(createSessionPayload);
    if (res) {
      return jwtService.createTokensPair({
        userId,
        deviceId,
        issuedAt: iat.toISOString(),
      });
    } else {
      return null;
    }
  }

  async removeSession(payload: {
    userId: string;
    deviceId: string;
    iat: Date;
  }) {
    return this.authRepository.removeSession(payload);
  }

  async updateSession(
    payload: {
      userId: string;
      deviceId: string;
      iat: Date;
      ip: string;
      deviceName: string;
    },
    refreshToken: string,
  ): Promise<[string, string] | null> {
    const isRefreshTokenValid = jwtService.verifyRefreshToken(refreshToken);
    if (!isRefreshTokenValid) return null;

    const { userId, iat, deviceId } = payload;
    const session = await this.authRepository.getSession({
      userId,
      iat,
      deviceId,
    });

    if (!session) return null;

    const newIat = new Date();
    await this.authRepository.updateSession(payload, newIat);

    return jwtService.createTokensPair({
      userId: payload.userId,
      deviceId: payload.deviceId,
      issuedAt: newIat.toISOString(),
    });
  }

  async getUserSessions(userId: string) {
    return await this.authRepository.getSessions(userId);
  }

  async removeUserSessions(userId: string, deviceId: string): Promise<boolean> {
    return await this.authRepository.removeUserSessions(userId, deviceId);
  }

  async removeSingleUserSession(
    userId: string,
    deviceId: string,
  ): Promise<ERemoveSingleUserSessionState> {
    const session = await this.authRepository.getSession({ deviceId });
    if (session === null) {
      return ERemoveSingleUserSessionState.NOT_FOUND;
    }
    if (session?.userId !== userId) {
      return ERemoveSingleUserSessionState.FORBIDDEN;
    }
    await this.authRepository.removeSingleUserSession(userId, deviceId);
    return ERemoveSingleUserSessionState.SUCCESS;
  }

  async passwordRecovery(email: string) {
    const user = await this.usersRepository.findUserByEmail(email);
    if (!user) return false;
    if (user.emailConfirmation?.isConfirmed) return false;

    const isUserRecoveryCodeExpired =
      user?.passwordRecovery?.expirationDate &&
      user?.passwordRecovery?.expirationDate < new Date();
    if (isUserRecoveryCodeExpired) {
      return false;
    }

    const recoveryCode = crypto.randomUUID();

    const recoveryInformation =
      await this.usersRepository.setRecoveryToUserById(user.id, recoveryCode);
    if (!recoveryInformation) return false;

    const result = await emailService.sendPasswordRecoveryEmail({
      toEmail: user.email,
      recoveryCode,
    });

    return result;
  }

  async applyNewPassword({
    newPassword,
    recoveryCode,
  }: {
    newPassword: string;
    recoveryCode: string;
  }): Promise<boolean> {
    const user = await this.usersRepository.getUserByRecoveryCode(recoveryCode);

    if (!user) {
      return false;
    }

    const newPasswordHash = await encryptPassword(newPassword);

    user.password = newPasswordHash;
    user.passwordRecovery = null;

    await this.usersRepository.save(user);

    return true;
  }
}
