import bcrypt from "bcrypt";

export const comparePasswords = (
  plainPassword: string,
  encodedPassword: string,
): Promise<boolean> => {
  return new Promise<boolean>((res, rej) =>
    bcrypt.compare(plainPassword, encodedPassword, (err, result) => {
      if (result) res(result);
      else rej(err);
    }),
  );
};
