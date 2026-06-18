import { emailService } from "../../auth/adapters/email.service";
import {
  ICreateRegistrationDataBaseBody,
  ICreateRegistrationPostBody,
} from "../users/models/users.model";
import { usersRepository } from "../users/users.repository";
import { encryptPassword } from "../users/utils/encrpypt-password";
import { IRegistrationBody } from "./types/auth.router";
import { add } from "date-fns";

export const authService = {
  async registerUser(registerBody: IRegistrationBody): Promise<boolean> {
    const confirmationCode = crypto.randomUUID();
    const expirationDate = add(new Date(), { minutes: 15, seconds: 0 });
    const createdAt = new Date();
    const password = await encryptPassword(registerBody.password);

    const { login, email } = registerBody;

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
      return false;
    }

    const result = await emailService.sendRegistrationConfirmationEmail({
      toEmail: email,
      confirmationCode,
    });

    return result;
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
    const user = await usersRepository.findUserByEmail(email);
    if (!user) return false;
    if (user.user.emailConfirmation?.isConfirmed) return false;
    const confirmationCode = crypto.randomUUID();

    const result = await emailService.sendRegistrationConfirmationEmail({
      toEmail: user.user.email,
      confirmationCode,
    });

    return result;
  },
};
