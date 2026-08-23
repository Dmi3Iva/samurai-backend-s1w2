import { inject, injectable } from "inversify";
import { IUsersPostBody, IUserView } from "./models/user-types";
import { UsersRepository } from "./users.repository";
import { comparePasswords } from "./utils/compare-passwords";
import { User } from "./models/user.model";

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
    const user = await User.createUser(data);
    await this.usersRepository.save(user);
    return user.toView();
  }
  async removeUserById(id: string): Promise<boolean> {
    const result = await this.usersRepository.removeUserById(id);
    return result;
  }
  async isLoginOrEmailAndPasswordCorrected(
    loginOrEmail: string,
    password: string,
  ) {
    // TODO:: there  was emailMapping
    const user = await this.usersRepository.findUserByLoginOrEmail(
      loginOrEmail,
      loginOrEmail,
    );

    if (!user) return null;

    const isPasswordCorrect = await comparePasswords(password, user?.password);
    if (!isPasswordCorrect) return null;

    const isUserHasAndConfirmedRegistration =
      user.isUserConfirmedRegistration();
    if (!isUserHasAndConfirmedRegistration) return null;

    return user;
  }
  async getUserById(id: string): Promise<IUserView | null> {
    const user = await this.usersRepository.findUserById(id);
    return user;
  }
}
