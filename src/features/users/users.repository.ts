import { ObjectId, WithId } from "mongodb";
import {
  ICreatedDBUserParam,
  ICreateRegistrationDataBaseBody,
  IDBUserType,
  IUsersGetQueries,
  IUserType,
  IUserView,
} from "./models/user-types";
import { add } from "date-fns";
import { injectable } from "inversify";
import { UserModel } from "./models/user.model";

@injectable()
export class UsersRepository {
  mapDBUserToView = (
    dbUser: IDBUserType,
    options?: { emailMapping?: boolean },
  ): IUserView => {
    return {
      id: dbUser._id.toString(),
      createdAt: dbUser.createdAt,
      email: dbUser.email,
      login: dbUser.login,
      ...(options?.emailMapping && dbUser.emailConfirmation
        ? {
            emailConfirmation: {
              expirationDate: dbUser.emailConfirmation.expirationDate,
              isConfirmed: dbUser.emailConfirmation.isConfirmed,
              confirmationCode: dbUser.emailConfirmation.confirmationCode,
            },
          }
        : {}),
    };
  };

  async findUserByLogin(
    login: string,
    options?: { emailMapping?: boolean },
  ): Promise<{ user: IUserView; password: string } | null> {
    const result = await UserModel.findOne({ login });

    return result
      ? {
          user: this.mapDBUserToView(result, options),
          password: result.password,
        }
      : null;
  }

  async findUserByEmail(
    email: string,
    options?: { emailMapping?: boolean },
  ): Promise<{ user: IUserView; password: string } | null> {
    const result = await UserModel.findOne({ email });

    return result
      ? {
          user: this.mapDBUserToView(result, options),
          password: result.password,
        }
      : null;
  }

  async findUserById(userId: string): Promise<IUserView | null> {
    const result = await UserModel.findById(userId);

    return result ? this.mapDBUserToView(result) : null;
  }

  async createUser(dbUserData: ICreatedDBUserParam): Promise<IUserView> {
    const model = new UserModel(dbUserData);
    const result = await model.save();

    return this.mapDBUserToView(result);
  }

  async createRegistrationUser(
    dbUserData: ICreateRegistrationDataBaseBody,
  ): Promise<string | null> {
    try {
      const model = new UserModel(dbUserData);
      const result = await model.save();

      return result.id;
    } catch (e) {
      return null;
    }
  }

  async removeUserById(id: string) {
    try {
      const result = await UserModel.findByIdAndDelete(id);

      return result !== null;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getUsersWithQuery(queries: IUsersGetQueries) {
    const {
      searchEmailTerm = null,
      searchLoginTerm = null,
      sortBy = "createdAt",
      sortDirection = "desc",
      pageNumber = 1,
      pageSize = 10,
    } = queries;
    const skip = (Number(pageNumber) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const filter = {
      ...(searchEmailTerm || searchLoginTerm
        ? {
            $or: [
              ...(searchLoginTerm
                ? [{ login: { $regex: searchLoginTerm, $options: "i" } }]
                : []),
              ...(searchEmailTerm
                ? [{ email: { $regex: searchEmailTerm, $options: "i" } }]
                : []),
            ],
          }
        : {}),
    };

    const result = await UserModel.find(filter)
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await UserModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / Number(pageSize));
    const page = Number(pageNumber);
    const items = result.map((item) => this.mapDBUserToView(item));

    return {
      pagesCount,
      page,
      pageSize: Number(pageSize),
      totalCount,
      items,
    };
  }
  async removeAll() {
    return await UserModel.deleteMany({});
  }

  async findUserByConfirmationCode(
    confirmationCode: string,
  ): Promise<WithId<IUserType> | null> {
    const result = await UserModel.findOne({
      "emailConfirmation.confirmationCode": confirmationCode,
    }).lean();

    return result ?? null;
  }

  async confirmRegistrationByUserId(userId: string): Promise<boolean> {
    const result = await UserModel.findByIdAndUpdate(userId, {
      "emailConfirmation.isConfirmed": true,
    });

    return result !== null;
  }

  async updateConfirmRegistrationByUserId(
    userId: string,
    confirmationCode: string,
  ): Promise<boolean> {
    const result = await UserModel.updateOne(
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
    const result = await UserModel.updateOne(
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

  async getUserByRecoveryCode(code: string): Promise<IUserView | null> {
    const userDB = await UserModel.findOne({
      "passwordRecovery.code": code,
    });

    if (userDB === null) return null;

    return this.mapDBUserToView(userDB);
  }

  async setNewPassword(userId: string, newPassword: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          password: newPassword,
          passwordRecovery: null,
        },
      },
    );

    return result.modifiedCount === 1;
  }
}
