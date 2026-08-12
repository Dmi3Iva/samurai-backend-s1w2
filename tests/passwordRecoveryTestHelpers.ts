import { UserModel } from "../src/features/users/models/user.model";

export async function getRecoveryCodeByEmail(email: string): Promise<string> {
  const user = await UserModel.findOne({ email }).lean();

  if (!user) {
    throw new Error(`User with email ${email} not found in database`);
  }

  const code = user.passwordRecovery?.code;

  if (!code) {
    throw new Error(
      `Recovery code not found for ${email}. Expected user.passwordRecovery.code in DB`,
    );
  }

  return code;
}
