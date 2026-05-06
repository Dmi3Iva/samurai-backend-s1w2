import bcrypt from "bcrypt";

export const comparePasswords = (
  plainPassword: string,
  encodedPassword: string,
): Promise<boolean> => {
  return new Promise<boolean>((res, rej) =>
    bcrypt.compare(plainPassword, encodedPassword, (err, result) => {
      return res(result);
    }),
  );
};
