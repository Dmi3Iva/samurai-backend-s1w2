import { inject, injectable } from "inversify";
import {
  ICreatedDBUserParam,
  IUsersPostBody,
  IUserView,
} from "./models/user-types";
import { UsersRepository } from "./users.repository";
import { comparePasswords } from "./utils/compare-passwords";
import { encryptPassword } from "./utils/encrpypt-password";

@injectable()
export class UsersService {
  constructor(
    @inject(UsersRepository)
    private usersRepository: UsersRepository,
  ) {}

  async isUniqueLogin(login: string): Promise<boolean> {
    const result = await this.usersRepository.findUserByLogin(login);
    return result === null;
  }
  async isUniqueEmail(email: string): Promise<boolean> {
    const result = await this.usersRepository.findUserByEmail(email);
    return result === null;
  }
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

    const result = await this.usersRepository.createUser(createDBUserParam);

    // const result: IUserView = {
    //   id,
    //   login: data.login,
    //   email: data.email,
    //   createdAt,
    // };

    return result;
  }
  async removeUserById(id: string): Promise<boolean> {
    const result = await this.usersRepository.removeUserById(id);

    return result;
  }
  async isLoginOrEmailAndPasswordCorrected(
    loginOrEmail: string,
    password: string,
  ) {
    const resultByLogin = await this.usersRepository.findUserByLogin(
      loginOrEmail,
      {
        emailMapping: true,
      },
    );
    if (resultByLogin) {
      const isPasswordCorrect = await comparePasswords(
        password,
        resultByLogin?.password,
      );
      const isUserHasAndConfirmedRegistration =
        resultByLogin.user?.emailConfirmation?.isConfirmed !== false;

      return isPasswordCorrect && isUserHasAndConfirmedRegistration
        ? resultByLogin.user
        : null;
    }

    const resultByEmail = await this.usersRepository.findUserByEmail(
      loginOrEmail,
      {
        emailMapping: true,
      },
    );
    if (resultByEmail) {
      const isPasswordCorrect = await comparePasswords(
        password,
        resultByEmail?.password,
      );
      const isUserHasAndConfirmedRegistration =
        resultByEmail.user?.emailConfirmation?.isConfirmed !== false;

      return isPasswordCorrect && isUserHasAndConfirmedRegistration
        ? resultByEmail.user
        : null;
    }

    return null;
  }
  async getUserById(id: string): Promise<IUserView | null> {
    const user = await this.usersRepository.findUserById(id);
    return user;
  }
}
