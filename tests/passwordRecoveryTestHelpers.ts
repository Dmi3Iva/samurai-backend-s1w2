import { usersDatabase } from "../src/repositories/database";

/**
 * Expected DB shape for h10 (tests read recovery code the same way as
 * registration confirmation codes):
 *
 * user.passwordRecovery = {
 *   recoveryCode: string,
 *   expirationDate: Date,
 * }
 *
 * If your field names differ, adjust this helper only.
 */
interface PasswordRecoveryData {
  recoveryCode?: string | null;
  expirationDate?: Date | null;
}

interface UserWithPasswordRecovery {
  email: string;
  passwordRecovery?: PasswordRecoveryData;
}

export async function getRecoveryCodeByEmail(email: string): Promise<string> {
  const user = await usersDatabase.findOne({ email });

  if (!user) {
    throw new Error(`User with email ${email} not found in database`);
  }

  const userWithRecovery = user as UserWithPasswordRecovery;
  const code = userWithRecovery.passwordRecovery?.recoveryCode;

  if (!code) {
    throw new Error(
      `Recovery code not found for ${email}. Expected user.passwordRecovery.recoveryCode in DB`,
    );
  }

  return code;
}
