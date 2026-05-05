import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const encryptPassword = async (password: string): Promise<string> => {
  const result = await new Promise<string>((res, rej) =>
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (!err) return res(hash);
      return rej(err);
    }),
  );

  return result;
};
