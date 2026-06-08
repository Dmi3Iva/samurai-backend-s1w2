import {
  ICreatedDBUserParam,
  IUsersPostBody,
  IUserView,
} from "./models/users.model";
import { usersRepository } from "./users.repository";
import { comparePasswords } from "./utils/compare-passwords";
import { encryptPassword } from "./utils/encrpypt-password";

export const usersService = {
  async isUniqueLogin(login: string): Promise<boolean> {
    const result = await usersRepository.findUserByLogin(login);
    return result === null;
  },
  async isUniqueEmail(email: string): Promise<boolean> {
    const result = await usersRepository.findUserByEmail(email);
    return result === null;
  },
  async createUser(data: IUsersPostBody): Promise<IUserView> {
    const createdAt = new Date();
    let password: string;
    password = await encryptPassword(data.password);

    const createDBUserParam: ICreatedDBUserParam = {
      login: data.login,
      email: data.email,
      password,
      createdAt,
    };

    const id = await usersRepository.createUser(createDBUserParam);

    const result: IUserView = {
      id,
      login: data.login,
      email: data.email,
      createdAt,
    };

    return result;
  },
  async removeUserById(id: string): Promise<boolean> {
    const result = await usersRepository.removeUserById(id);

    return result;
  },
  async isLoginOrEmailAndPasswordCorrected(
    loginOrEmail: string,
    password: string,
  ) {
    const resultByLogin = await usersRepository.findUserByLogin(loginOrEmail);
    if (resultByLogin)
      return (await comparePasswords(password, resultByLogin?.password))
        ? resultByLogin.user
        : null;

    const resultByEmail = await usersRepository.findUserByEmail(loginOrEmail);
    if (resultByEmail)
      return (await comparePasswords(password, resultByEmail?.password))
        ? resultByEmail.user
        : null;

    return null;
  },
  async getUserById(id: string): Promise<IUserView | null> {
    const user = await usersRepository.findUserById(id);
    return user;
  },
};
