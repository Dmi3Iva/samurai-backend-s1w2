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
import { User } from "./models/user.model";

@injectable()
export class UsersReadRepository {
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

  async findUserById(userId: string): Promise<IUserView | null> {
    const result = await User.findById(userId);

    return result ? this.mapDBUserToView(result) : null;
  }

  async createUser(dbUserData: ICreatedDBUserParam): Promise<IUserView> {
    const model = new User(dbUserData);
    const result = await model.save();

    return this.mapDBUserToView(result);
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

    const result = await User.find(filter)
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments(filter);
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
}
