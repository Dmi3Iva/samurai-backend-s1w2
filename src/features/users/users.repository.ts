import { WithId } from "mongodb";
import {
  ICreatedDBUserParam,
  ICreateRegistrationDataBaseBody,
  IUserType,
  IUserView,
} from "./models/user-types";
import { add } from "date-fns";
import { injectable } from "inversify";
import { User, UserType } from "./models/user.model";

@injectable()
export class UsersRepository {
  async save(user: UserType) {
    return user.save();
  }

  async findUserByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<UserType | null> {
    return await User.findOne({ $or: [{ login }, { email }] });
  }

  async findUserByLogin(login: string): Promise<UserType | null> {
    return await User.findOne({ login });
  }

  async findUserByEmail(email: string): Promise<UserType | null> {
    return await User.findOne({ email });
  }

  async findUserById(userId: string): Promise<IUserView | null> {
    const user = await User.findById(userId);
    if (!user) return null;

    return user.toView();
  }

  async createRegistrationUser(
    dbUserData: ICreateRegistrationDataBaseBody,
  ): Promise<string | null> {
    try {
      const user = new User(dbUserData);
      const result = await user.save();

      return result.id;
    } catch (e) {
      return null;
    }
  }

  async removeUserById(id: string) {
    try {
      const result = await User.findByIdAndDelete(id);

      return result !== null;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async removeAll() {
    return await User.deleteMany({});
  }

  async findUserByConfirmationCode(
    confirmationCode: string,
  ): Promise<WithId<IUserType> | null> {
    const result = await User.findOne({
      "emailConfirmation.confirmationCode": confirmationCode,
    }).lean();

    return result ?? null;
  }

  async confirmRegistrationByUserId(userId: string): Promise<boolean> {
    const result = await User.findByIdAndUpdate(userId, {
      "emailConfirmation.isConfirmed": true,
    });

    return result !== null;
  }

  async updateConfirmRegistrationByUserId(
    userId: string,
    confirmationCode: string,
  ): Promise<boolean> {
    const result = await User.updateOne(
      { _id: userId },
      {
        $set: {
          "emailConfirmation.confirmationCode": confirmationCode,
          "emailConfirmation.expirationDate": add(new Date(), {
            minutes: 15,
            seconds: 0,
          }),
        },
      },
    );

    return result.modifiedCount === 1;
  }

  async setRecoveryToUserById(
    userId: string,
    confirmationCode: string,
  ): Promise<boolean> {
    const result = await User.updateOne(
      { _id: userId },
      {
        $set: {
          "passwordRecovery.code": confirmationCode,
          "passwordRecovery.expirationDate": add(new Date(), {
            hours: 1,
            seconds: 0,
          }),
        },
      },
    );

    return result.modifiedCount === 1;
  }

  async getUserByRecoveryCode(code: string): Promise<UserType | null> {
    return await User.findOne({
      "passwordRecovery.code": code,
    });
  }
}
