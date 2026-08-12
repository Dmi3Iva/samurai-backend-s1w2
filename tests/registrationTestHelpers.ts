import { UserModel } from "../src/features/users/models/user.model";

interface EmailConfirmationData {
  confirmationCode: string;
  expirationDate: Date;
  isConfirmed: boolean;
}

interface UserWithEmailConfirmation {
  email: string;
  emailConfirmation?: EmailConfirmationData;
}

export async function getConfirmationCodeByEmail(
  email: string,
): Promise<string> {
  const user = await UserModel.findOne({ email }).lean();

  if (!user) {
    throw new Error(`User with email ${email} not found in database`);
  }

  const userWithConfirmation = user as UserWithEmailConfirmation;
  const code = userWithConfirmation.emailConfirmation?.confirmationCode;

  if (!code) {
    throw new Error(
      `Confirmation code not found for ${email}. Expected user.emailConfirmation.confirmationCode in DB`,
    );
  }

  return code;
}

export async function isUserEmailConfirmed(email: string): Promise<boolean> {
  const user = await UserModel.findOne({ email }).lean();

  if (!user) {
    return false;
  }

  const userWithConfirmation = user as UserWithEmailConfirmation;
  return userWithConfirmation.emailConfirmation?.isConfirmed === true;
}
