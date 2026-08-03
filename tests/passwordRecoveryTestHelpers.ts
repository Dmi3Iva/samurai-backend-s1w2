import { usersDatabase } from "../src/repositories/database";

export async function getRecoveryCodeByEmail(email: string): Promise<string> {
  const user = await usersDatabase.findOne({ email });

  if (!user) {
    throw new Error(`User with email ${email} not found in database`);
  }

  const userWithRecovery = user;
  const code = userWithRecovery.passwordRecovery?.code;

  if (!code) {
    throw new Error(
      `Recovery code not found for ${email}. Expected user.passwordRecovery.recoveryCode in DB`,
    );
  }

  return code;
}
