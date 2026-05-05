import {
  ICreatedDBUserParam,
  IUsersPostBody,
  IUserView,
} from "./models/users.model";
import { usersRepository } from "./users.repository";
import { comparePasswords } from "./utils/compare-passwords";
import { encryptPassword } from "./utils/encrpypt-password";

const mapUserDBToView = () => {};

export const usersService = {
  async isUniqueLogin(login: string): Promise<boolean> {
    const user = await usersRepository.findUserByLogin(login);
    return user === null;
  },
  async isUniqueEmail(email: string): Promise<boolean> {
    const user = await usersRepository.findUserByEmail(email);
    return user === null;
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
  ): Promise<boolean> {
    const user = await usersRepository.findUserByLogin(loginOrEmail);
    if (user) return await comparePasswords(password, user?.password);

    const userbByEmail = await usersRepository.findUserByEmail(loginOrEmail);
    if (userbByEmail)
      return await comparePasswords(password, userbByEmail?.password);

    return false;
  },
};
